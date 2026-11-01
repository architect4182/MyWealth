import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, createSessionToken, AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
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

  const res = NextResponse.json({
    authenticated: true,
    username: session.username,
    gender: userGender,
  });

  // Rolling 1-hour session extension: Slide cookie forward while user is actively making requests
  try {
    const refreshedToken = await createSessionToken(session.username, userGender);
    res.cookies.set(AUTH_COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch {}

  return res;
}

