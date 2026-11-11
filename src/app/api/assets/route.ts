import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (session.valid && session.username) {
    return session.username;
  }
  return null;
}

// GET: Fetch all assets for a user (case-insensitive username match)
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });
  }

  const authUser = await getAuthUser(req);
  const { searchParams } = new URL(req.url);
  const paramUser = searchParams.get("username")?.trim();
  const username = authUser || paramUser;

  if (!username) {
    return NextResponse.json({ success: false, error: "Username required" }, { status: 400 });
  }

  try {
    // Query with case-insensitive username match
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .ilike("username", username)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch assets" }, { status: 500 });
  }
}

// POST: Add a new asset or scheduled SIP
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });
  }

  const authUser = await getAuthUser(req);
  const body = await req.json().catch(() => ({}));
  const username = authUser || (body.username || body.userId || "").trim();

  if (!username) {
    return NextResponse.json({ success: false, error: "Active user identity required" }, { status: 401 });
  }

  if (!body.name || !body.category) {
    return NextResponse.json({ success: false, error: "Asset name and category are required" }, { status: 400 });
  }

  const isSip = Boolean(body.isSip);
  const quantity = Number(body.quantity) || 0;
  const buyPrice = Number(body.buyPrice) || 0;
  const currentPrice = Number(body.currentPrice !== undefined ? body.currentPrice : body.buyPrice) || 0;
  const investedAmount = body.investedAmount !== undefined
    ? Number(body.investedAmount)
    : (body.invested_amount !== undefined ? Number(body.invested_amount) : (quantity * buyPrice));
  const currency = (body.currency === "USD" ? "USD" : "INR") as "INR" | "USD";
  const brokerApp = body.brokerApp ? String(body.brokerApp).trim() : (body.broker_app ? String(body.broker_app).trim() : null);
  const tradeDate = body.tradeDate ? String(body.tradeDate).trim() : (body.trade_date ? String(body.trade_date).trim() : null);

  const sipFields = isSip
    ? {
        is_sip: true,
        sip_amount: body.sipAmount ? Number(body.sipAmount) : null,
        sip_day: body.sipDay ? Number(body.sipDay) : 5,
        sip_start_date: body.sipStartDate || null,
        sip_installments: body.sipInstallments !== undefined ? Number(body.sipInstallments) : 1,
        last_sip_date: body.lastSipDate || null,
        sip_status: body.sipStatus || "active",
      }
    : {
        is_sip: false,
        sip_amount: null,
        sip_day: null,
        sip_start_date: null,
        sip_installments: 0,
        last_sip_date: null,
        sip_status: "active",
      };

  try {
    const basePayload: Record<string, any> = {
      name: String(body.name).trim(),
      category: body.category,
      quantity,
      invested_amount: investedAmount,
      buy_price: buyPrice,
      current_price: currentPrice,
      currency,
      username: username.trim(),
    };
    if (brokerApp) {
      basePayload.broker_app = brokerApp;
    }
    if (tradeDate) {
      basePayload.trade_date = tradeDate;
    }

    // 1. Try full insert with username, broker_app, trade_date, invested_amount, and SIP fields
    let insertRes = await supabase
      .from("assets")
      .insert([{ ...basePayload, ...sipFields }])
      .select();

    // 1b. If trade_date column is not provisioned yet in schema, retry full payload without trade_date first
    if (insertRes.error && insertRes.error.message?.includes("trade_date") && "trade_date" in basePayload) {
      delete basePayload.trade_date;
      insertRes = await supabase
        .from("assets")
        .insert([{ ...basePayload, ...sipFields }])
        .select();
    }

    // 2. Safe fallback: If broker_app, invested_amount, or SIP columns fail
    if (insertRes.error) {
      console.warn("[POST /api/assets] Full insert failed, retrying safe standard payload:", insertRes.error.message);
      const safePayload: Record<string, any> = {
        name: basePayload.name,
        category: basePayload.category,
        quantity: basePayload.quantity,
        invested_amount: basePayload.invested_amount,
        buy_price: basePayload.buy_price,
        current_price: basePayload.current_price,
        currency: basePayload.currency,
        username: basePayload.username,
      };

      insertRes = await supabase
        .from("assets")
        .insert([safePayload])
        .select();

      // 3. Fallback without invested_amount if invested_amount column does not exist
      if (insertRes.error && (insertRes.error.code === "42703" || insertRes.error.message?.includes("invested"))) {
        delete safePayload.invested_amount;
        insertRes = await supabase
          .from("assets")
          .insert([safePayload])
          .select();
      }
    }

    if (insertRes.error) {
      console.error("[API /api/assets POST] Supabase insert error:", insertRes.error);
      return NextResponse.json({ success: false, error: insertRes.error.message }, { status: 400 });
    }

    if (!insertRes.data || !insertRes.data[0]) {
      return NextResponse.json({ success: false, error: "Asset could not be created in database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, asset: insertRes.data[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[API /api/assets POST] Unexpected error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PUT: Update an existing asset (or batch price updates)
export async function PUT(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });
  }

  const authUser = await getAuthUser(req);
  const body = await req.json().catch(() => ({}));

  // Batched price checkpoint mode: { updates: [{ id, currentPrice }] }
  if (Array.isArray(body.updates)) {
    const validUpdates = body.updates.filter(
      (u: any) => u?.id && Number.isFinite(Number(u.currentPrice)) && Number(u.currentPrice) > 0
    );
    if (validUpdates.length === 0) {
      return NextResponse.json({ success: true, updatedCount: 0 });
    }
    try {
      const results = await Promise.all(
        validUpdates.map((u: any) =>
          supabase!
            .from("assets")
            .update({ current_price: Number(u.currentPrice) })
            .eq("id", String(u.id))
        )
      );
      const updatedCount = results.filter((r) => !r.error).length;
      return NextResponse.json({ success: true, updatedCount });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message || "Batch update failed" }, { status: 500 });
    }
  }

  const id = body.id;

  if (!id) {
    return NextResponse.json({ success: false, error: "Asset ID is required" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.category !== undefined) updates.category = body.category;
  if (body.quantity !== undefined) updates.quantity = Number(body.quantity);
  if (body.investedAmount !== undefined || body.invested_amount !== undefined) {
    updates.invested_amount = Number(body.investedAmount !== undefined ? body.investedAmount : body.invested_amount);
  }
  if (body.buyPrice !== undefined || body.buy_price !== undefined) {
    updates.buy_price = Number(body.buyPrice !== undefined ? body.buyPrice : body.buy_price);
  }
  if (body.currentPrice !== undefined || body.current_price !== undefined) {
    updates.current_price = Number(body.currentPrice !== undefined ? body.currentPrice : body.current_price);
  }
  if (body.currency !== undefined) updates.currency = body.currency;
  if (body.brokerApp !== undefined || body.broker_app !== undefined) {
    updates.broker_app = body.brokerApp !== undefined ? body.brokerApp : body.broker_app;
  }
  if (body.tradeDate !== undefined || body.trade_date !== undefined) {
    const rawTd = body.tradeDate !== undefined ? body.tradeDate : body.trade_date;
    updates.trade_date = rawTd ? String(rawTd).trim() : null;
  }
  if (body.isSip !== undefined) updates.is_sip = Boolean(body.isSip);
  if (body.sipAmount !== undefined) updates.sip_amount = body.sipAmount ? Number(body.sipAmount) : null;
  if (body.sipDay !== undefined) updates.sip_day = body.sipDay ? Number(body.sipDay) : null;
  if (body.sipStartDate !== undefined) updates.sip_start_date = body.sipStartDate || null;
  if (body.sipInstallments !== undefined) updates.sip_installments = Number(body.sipInstallments);
  if (body.lastSipDate !== undefined) updates.last_sip_date = body.lastSipDate || null;
  if (body.sipStatus !== undefined) updates.sip_status = body.sipStatus;

  try {
    let updateRes = await supabase.from("assets").update(updates).eq("id", id).select();

    if (updateRes.error && updateRes.error.message?.includes("trade_date") && "trade_date" in updates) {
      delete updates.trade_date;
      updateRes = await supabase.from("assets").update(updates).eq("id", id).select();
    }

    if (updateRes.error && (updateRes.error.code === "42703" || updateRes.error.message?.includes("invested") || updateRes.error.message?.includes("broker_app"))) {
      if (updateRes.error.code === "42703" || updateRes.error.message?.includes("invested")) {
        delete updates.invested_amount;
      }
      delete updates.broker_app;
      delete updates.trade_date;
      updateRes = await supabase.from("assets").update(updates).eq("id", id).select();
    }

    if (updateRes.error) {
      return NextResponse.json({ success: false, error: updateRes.error.message }, { status: 400 });
    }

    if (!updateRes.data || updateRes.data.length === 0) {
      return NextResponse.json({ success: false, error: "Holding not found in database to update" }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset: updateRes.data[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update asset" }, { status: 500 });
  }
}

// DELETE: Remove an asset
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Asset ID is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("assets").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to delete asset" }, { status: 500 });
  }
}

