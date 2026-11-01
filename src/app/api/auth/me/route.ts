import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session.valid || !session.username) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let userGender = session.gender || "male";

  // Always fetch source-of-truth gender directly from database users table
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("gender")
        .eq("username", session.username.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (!error && data?.gender) {
        userGender = data.gender === "female" ? "female" : "male";
      }
    } catch {}
  }

  return NextResponse.json({
    authenticated: true,
    username: session.username,
    gender: userGender,
  });
}

