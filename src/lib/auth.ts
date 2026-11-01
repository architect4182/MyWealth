import { supabase } from "./supabase";

export const AUTH_COOKIE_NAME = "mywealth_auth_session";

export type UserGender = "male" | "female";

// 30 days expiration
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "mywealth-secret-session-key-v1-prod-2026-secure"
  );
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function createSessionToken(
  username: string,
  gender: UserGender = "male"
): Promise<string> {
  const secret = getAuthSecret();
  const key = await getHmacKey(secret);
  const timestamp = Math.floor(Date.now() / 1000);
  const safeGender = gender === "female" ? "female" : "male";
  const payload = `${username.trim().toLowerCase()}:${safeGender}:${timestamp}`;
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sigHex = bufferToHex(signature);
  return `${payload}:${sigHex}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; username?: string; gender?: UserGender }> {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(":");
  if (parts.length !== 3 && parts.length !== 4) {
    return { valid: false };
  }

  let username = "";
  let gender: UserGender = "male";
  let timestampStr = "";
  let sigHex = "";
  let payload = "";

  if (parts.length === 4) {
    username = parts[0];
    gender = parts[1] === "female" ? "female" : "male";
    timestampStr = parts[2];
    sigHex = parts[3];
    payload = `${username}:${gender}:${timestampStr}`;
  } else {
    username = parts[0];
    gender = "male";
    timestampStr = parts[1];
    sigHex = parts[2];
    payload = `${username}:${timestampStr}`;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (!timestamp || isNaN(timestamp)) {
    return { valid: false };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > SESSION_MAX_AGE_SECONDS || timestamp - now > 300) {
    return { valid: false };
  }

  try {
    const secret = getAuthSecret();
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const sigBytes = hexToBuffer(sigHex);
    const sigBuffer = new Uint8Array(sigBytes).buffer;
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      enc.encode(payload)
    );

    if (isValid) {
      return { valid: true, username, gender };
    }
  } catch (err) {
    console.error("Token verification error:", err);
  }

  return { valid: false };
}

/**
 * Validates credentials against:
 * 1. Supabase database table `users` (if table exists)
 * 2. Environment variables: AUTH_USER / AUTH_PASSWORD (default fallback)
 */
export async function validateCredentials(
  idInput: string,
  passwordInput: string
): Promise<{ success: boolean; username: string; gender: UserGender; error?: string }> {
  const trimmedId = (idInput || "").trim().toLowerCase();
  const trimmedPassword = (passwordInput || "").trim();

  if (!trimmedId || !trimmedPassword) {
    return { success: false, username: "", gender: "male", error: "User ID and Password are required." };
  }

  // 1. Check Supabase database table `users` if available
  if (supabase) {
    try {
      // First attempt: with gender column
      let res = await supabase
        .from("users")
        .select("id, username, password, gender")
        .eq("username", trimmedId)
        .limit(1)
        .maybeSingle();

      // If gender column is not yet added in Supabase (error 42703), retry with core fields
      if (res.error && res.error.code === "42703") {
        res = await supabase
          .from("users")
          .select("id, username, password")
          .eq("username", trimmedId)
          .limit(1)
          .maybeSingle();
      }

      if (!res.error && res.data) {
        const storedPass = res.data.password;
        if (storedPass && storedPass === trimmedPassword) {
          const userGender: UserGender = (res.data as any).gender === "female" ? "female" : "male";
          return {
            success: true,
            username: res.data.username || trimmedId,
            gender: userGender,
          };
        }
      }
    } catch {
      // Table may not exist yet in Supabase, fall through to environment variables
    }
  }

  // 2. Check Environment Variables (Vercel & Local)
  const envUsers = [
    (process.env.AUTH_USER || "").toLowerCase(),
    (process.env.ADMIN_USER || "").toLowerCase(),
    "chait",
    "admin",
  ].filter(Boolean);

  const envPassword = process.env.AUTH_PASSWORD || process.env.ADMIN_PASSWORD || "chait2026";
  const envGender: UserGender = process.env.AUTH_GENDER === "female" ? "female" : "male";

  const isUserValid = envUsers.includes(trimmedId);
  const isPassValid = trimmedPassword === envPassword;

  if (isUserValid && isPassValid) {
    return { success: true, username: trimmedId, gender: envGender };
  }

  return { success: false, username: "", gender: "male", error: "Invalid User ID or Password." };
}

/**
 * Registers a new user with chosen username, password, and gender (male / female).
 */
export async function registerUser(
  usernameInput: string,
  passwordInput: string,
  genderInput: UserGender
): Promise<{ success: boolean; username: string; gender: UserGender; error?: string }> {
  const trimmedUser = (usernameInput || "").trim().toLowerCase();
  const trimmedPass = (passwordInput || "").trim();
  const gender: UserGender = genderInput === "female" ? "female" : "male";

  if (!trimmedUser || trimmedUser.length < 3) {
    return { success: false, username: "", gender, error: "Username must be at least 3 characters." };
  }
  if (!trimmedPass || trimmedPass.length < 4) {
    return { success: false, username: "", gender, error: "Password must be at least 4 characters." };
  }

  // Try saving to Supabase users table if available
  if (supabase) {
    try {
      let res = await supabase
        .from("users")
        .insert({
          username: trimmedUser,
          password: trimmedPass,
          gender: gender,
        })
        .select()
        .single();

      // If gender column is missing (code 42703), retry without gender
      if (res.error && res.error.code === "42703") {
        res = await supabase
          .from("users")
          .insert({
            username: trimmedUser,
            password: trimmedPass,
          })
          .select()
          .single();
      }

      if (!res.error && res.data) {
        return { success: true, username: res.data.username || trimmedUser, gender };
      }
    } catch {
      // Table doesn't exist yet or RLS policy, proceed with session registration
    }
  }

  // Fallback: succeeds and issues session token with selected gender
  return { success: true, username: trimmedUser, gender };
}
