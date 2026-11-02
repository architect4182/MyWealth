"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Sparkles, UserPlus, LogIn } from "lucide-react";
import { MyWealthLogo } from "@/components/MyWealthLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/";
  const isInactiveReason = searchParams.get("reason") === "inactivity";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = { username: username.trim(), password: password.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Store resolved user identity locally for instant zero-lag rendering
        const resolvedUser = data.username || username.trim();
        try {
          localStorage.setItem("mywealth_current_user", resolvedUser);
          localStorage.setItem("mywealth_last_activity", String(Date.now()));
        } catch { }

        // Instant direct load into authorized dashboard
        window.location.replace(redirectTo);
      } else {
        setError(data.error || "Authentication failed. Please verify your details.");
        setIsLoading(false);
      }
    } catch {
      setError("Unable to connect. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="apple-auth-card">
      {/* Brand Emblem */}
      <div className="apple-auth-header">
        <div className="apple-auth-brand">
          <MyWealthLogo size={56} textSize={24} />
        </div>

        <div className="apple-auth-badge">
          <ShieldCheck size={13} className="apple-auth-shield" />
          <span>{mode === "register" ? "New Portfolio Setup" : "Private Vault Access"}</span>
        </div>

        <h1 className="apple-auth-title">
          {mode === "register" ? "Create Your Vault" : "Welcome Back"}
        </h1>
        <p className="apple-auth-subtitle">
          {mode === "register"
            ? "Register your credentials and choose your dashboard vision persona."
            : "Sign in with your authorized ID and password to access your wealth dashboard."}
        </p>

        {/* Mode Switcher Segmented Pill */}
        <div className="apple-auth-mode-pill">
          <button
            type="button"
            className={`apple-auth-mode-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`apple-auth-mode-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            <UserPlus size={13} />
            <span>Register</span>
          </button>
        </div>
      </div>

      {/* Inactivity Notice Banner */}
      {isInactiveReason && !error && (
        <div className="apple-auth-notice-banner" role="status">
          <span className="apple-auth-notice-dot" />
          <span>You were automatically logged out due to 1 hour of inactivity.</span>
        </div>
      )}

      {/* Error Alert Pill */}
      {error && (
        <div className="apple-auth-error-banner" role="alert">
          <span className="apple-auth-error-dot" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="apple-auth-form" noValidate>
        <div className="apple-auth-field-group">
          <label htmlFor="auth-username" className="apple-auth-label">
            Username
          </label>
          <div className="apple-auth-input-wrap">
            <User size={16} className="apple-auth-input-icon" />
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              placeholder={mode === "register" ? "Choose your Username" : "Enter Username"}
              value={username}
              onChange={handleUsernameChange}
              className="apple-auth-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="apple-auth-field-group">
          <div className="apple-auth-label-row">
            <label htmlFor="auth-password" className="apple-auth-label">
              {mode === "register" ? "Create Password" : "Password"}
            </label>
          </div>
          <div className="apple-auth-input-wrap">
            <Lock size={16} className="apple-auth-input-icon" />
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              placeholder="Enter Password"
              value={password}
              onChange={handlePasswordChange}
              className="apple-auth-input with-toggle"
              disabled={isLoading}
            />
            <button
              type="button"
              className="apple-auth-toggle-pass"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !username.trim() || !password.trim()}
          className="apple-auth-submit-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="apple-auth-spin" />
              <span>{mode === "register" ? "Setting Up Vault…" : "Verifying Access…"}</span>
            </>
          ) : (
            <>
              <span>{mode === "register" ? "Create Vault & Enter" : "Unlock Portfolio"}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Footer Security Watermark */}
      <div className="apple-auth-footer">
        <div className="apple-auth-security-note">
          <Sparkles size={12} className="apple-auth-sparkle" />
          <span>Protected by cryptographic HMAC-SHA256 session vault</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="apple-auth-canvas">
      {/* Ambient glowing radial light flares */}
      <div className="apple-auth-glow-orb top-orb" />
      <div className="apple-auth-glow-orb bottom-orb" />

      <div className="apple-auth-card-wrap">
        <Suspense fallback={
          <div className="apple-auth-card" style={{ minHeight: "360px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={24} className="apple-auth-spin" style={{ color: "#9366FF" }} />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
