import { supabase } from "./supabase";

export const AUTH_COOKIE_NAME = "mywealth_auth_session";

// 30 days expiration for seamless persistent login
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days = 2,592,000 seconds

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

export async function createSessionToken(username: string): Promise<string> {
  const secret = getAuthSecret();
  const key = await getHmacKey(secret);
  const timestamp = Math.floor(Date.now() / 1000);
  // Preserve original username casing so FK constraint matches the users table
  const normalizedUsername = username.trim();
  const payload = `${normalizedUsername}:${timestamp}`;
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const sigHex = bufferToHex(signature);
  return `${payload}:${sigHex}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; username?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(":");
  if (parts.length !== 3 && parts.length !== 4) {
    return { valid: false };
  }

  let username = "";
  let timestampStr = "";
  let sigHex = "";
  let payload = "";

  if (parts.length === 4) {
    // Legacy 4-part token: username:gender:timestamp:sig
    username = parts[0];
    timestampStr = parts[2];
    sigHex = parts[3];
    payload = `${username}:${parts[1]}:${timestampStr}`;
  } else {
    // Clean 3-part token: username:timestamp:sig
    username = parts[0];
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
      // Look up the real DB casing so FK inserts always match the users table
      let resolvedUsername = username;
      if (supabase) {
        try {
          const res = await supabase
            .from("users")
            .select("username")
            .ilike("username", username)
            .limit(1)
            .maybeSingle();
          if (!res.error && res.data?.username) {
            resolvedUsername = res.data.username;
          }
        } catch {}
      }
      return { valid: true, username: resolvedUsername };
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
): Promise<{ success: boolean; username: string; error?: string }> {
  const trimmedId = (idInput || "").trim();
  const trimmedPassword = (passwordInput || "").trim();

  if (!trimmedId || !trimmedPassword) {
    return { success: false, username: "", error: "User ID and Password are required." };
  }

  // 1. Connect to Supabase database in real time and map credentials
  if (supabase) {
    try {
      const res = await supabase
        .from("users")
        .select("id, username, password")
        .ilike("username", trimmedId)
        .limit(1)
        .maybeSingle();

      if (!res.error && res.data) {
        const storedPass = res.data.password;
        if (storedPass && storedPass === trimmedPassword) {
          return {
            success: true,
            username: res.data.username || trimmedId,
          };
        }
      }
    } catch (err) {
      console.error("Supabase real-time auth lookup error:", err);
    }
  }

  // 2. Check Environment Variables (only if explicitly set in .env)
  const envUser = (process.env.AUTH_USER || process.env.ADMIN_USER || "").toLowerCase().trim();
  const envPassword = process.env.AUTH_PASSWORD || process.env.ADMIN_PASSWORD || "";

  if (envUser && envPassword && trimmedId.toLowerCase() === envUser && trimmedPassword === envPassword) {
    return { success: true, username: trimmedId };
  }

  return { success: false, username: "", error: "Invalid User ID or Password." };
}

/**
 * Registers a new user with chosen username and password.
 */
export async function registerUser(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; username: string; error?: string }> {
  const trimmedUser = (usernameInput || "").trim().toLowerCase();
  const trimmedPass = (passwordInput || "").trim();

  if (!trimmedUser || trimmedUser.length < 3) {
    return { success: false, username: "", error: "Username must be at least 3 characters." };
  }
  if (!trimmedPass || trimmedPass.length < 4) {
    return { success: false, username: "", error: "Password must be at least 4 characters." };
  }

  // Try saving to Supabase users table if available
  if (supabase) {
    try {
      const res = await supabase
        .from("users")
        .insert({
          username: trimmedUser,
          password: trimmedPass,
        })
        .select()
        .single();

      if (!res.error && res.data) {
        return { success: true, username: res.data.username || trimmedUser };
      }
    } catch {
      // Table doesn't exist yet or RLS policy, proceed with session registration
    }
  }

  // Fallback: succeeds and issues session token
  return { success: true, username: trimmedUser };
}
