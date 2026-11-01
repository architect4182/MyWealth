import { NextRequest, NextResponse } from "next/server";
import { registerUser, createSessionToken, AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, UserGender } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password, gender } = body;

    const safeGender: UserGender = gender === "female" ? "female" : "male";

    const result = await registerUser(username, password, safeGender);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Registration failed." },
        { status: 400 }
      );
    }

    const token = await createSessionToken(result.username, result.gender);

    const res = NextResponse.json({
      success: true,
      username: result.username,
      gender: result.gender,
      redirect: "/",
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS, // 1 hour max age
    });

    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

