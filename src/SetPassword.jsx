// ── SetPassword.jsx ─────────────────────────────────────────────────
// P0-4: شاشة Set Password (مطابقة SetPasswordScreen في Flutter)
//
// flow:
//   1. الأدمن يدعو مستخدم جديد → Edge Function invite-user → Supabase يبعث email
//      برابط: https://app.com/reset-password#access_token=...&type=invite
//   2. المستخدم يضغط الرابط → DeepLinkService يلتقطه → يعرض شاشة set-password
//   3. هذه الشاشة تستخدم:
//      - auth.verifyOTP({ type: "invite", token_hash }) لو فيه token_hash
//      - أو auth.getSession() لو فيه access_token في الـ hash
//      لتأسيس invite session
//   4. المستخدم يكتب الباسورد الجديد → auth.updateUser({ password })
//   5. sign out من invite session → sign in بالـ email + الباسورد الجديد
//   6. لو المستخدم مش admin/owner → notifyAdminsOnSalesPresence('logged in')
//   7. navigate to home
//
// في حالة فشل الـ link (منتهي/مستخدم بالفعل):
//   - اعرض زر "Resend Invite" → يستدعي Edge Function resend-invite

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight, Building2, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { supabase } from "./lib/supabase";
import { invokeEdgeFunction } from "./lib/edgeFunction";
import { C } from "./theme";

export default function SetPassword({ initialUrl, onSuccess, onBackToLogin }) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [stage, setStage]           = useState("init"); // init | ready | submitting | success | invalid
  const [email, setEmail]           = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendMsg, setResendMsg]   = useState("");
  const [shakeKey, setShakeKey]     = useState(0);
  const [mounted, setMounted]       = useState(false);
  const inviteSessionRef = useRef(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  // ── 1) init from URL: تحقق من token وحاول تأسيس invite session ──
  useEffect(() => {
    let cancelled = false;

    const initFromLink = async () => {
      try {
        // استخدم initialUrl لو متاح، وإلا window.location.href
        const url = initialUrl || window.location.href;
        const u = new URL(url);
        const hashParams = new URLSearchParams(u.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const tokenType = hashParams.get("type");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // لو فيه error في الـ hash
        if (error) {
          if (!cancelled) {
            setError(errorDescription || error);
            setStage("invalid");
            setLoading(false);
          }
          return;
        }

        // لو فيه access_token (Supabase redirect من email)
        if (accessToken && tokenType === "invite") {
          // تأسيس session من الـ access_token
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (sessionError || !sessionData?.user) {
            if (!cancelled) {
              setError("This invite link is invalid or has expired. Please request a new invite.");
              setStage("invalid");
              setLoading(false);
            }
            return;
          }

          // نجح تأسيس invite session
          if (!cancelled) {
            inviteSessionRef.current = true;
            setEmail(sessionData.user.email || "");
            setStage("ready");
            setLoading(false);
          }
          return;
        }

        // fallback: query params (old-style)
        const queryParams = u.searchParams;
        const token = queryParams.get("token");
        const type = queryParams.get("type");
        if (token && type === "invite") {
          // حاول verifyOTP
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "invite",
          });

          if (verifyError || !verifyData?.user) {
            if (!cancelled) {
              setError("This invite link is invalid or has expired.");
              setStage("invalid");
              setLoading(false);
            }
            return;
          }

          if (!cancelled) {
            inviteSessionRef.current = true;
            setEmail(verifyData.user.email || "");
            setStage("ready");
            setLoading(false);
          }
          return;
        }

        // مفيش token → اعرض invalid
        if (!cancelled) {
          setError("No invite token found in the URL. Please use the link from your invite email.");
          setStage("invalid");
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("SetPassword init error:", err);
          setError("Failed to process invite link. Please try again or contact admin.");
          setStage("invalid");
          setLoading(false);
        }
      }
    };

    initFromLink();
    return () => { cancelled = true; };
  }, [initialUrl]);

  // ── 2) submit: تحديث الباسورد + sign in ──
  const handleSubmit = async () => {
    setError("");

    // تحقق من الباسورد
    if (!newPassword) {
      setError("Please enter a new password");
      setShakeKey(k => k + 1);
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setShakeKey(k => k + 1);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setShakeKey(k => k + 1);
      return;
    }

    setStage("submitting");

    try {
      // 1) تحديث الباسورد (في الـ invite session الحالية)
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password");
        setStage("ready");
        setShakeKey(k => k + 1);
        return;
      }

      // 2) استخرج الـ email من الـ session الحالية
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionEmail = sessionData?.session?.user?.email || email;

      if (!sessionEmail) {
        setError("Could not determine your email. Please contact admin.");
        setStage("ready");
        return;
      }

      // 3) sign out من invite session
      await supabase.auth.signOut();

      // 4) sign in بالـ email + الباسورد الجديد
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: sessionEmail,
        password: newPassword,
      });

      if (signInError) {
        setError("Password updated but sign-in failed. Please log in manually.");
        setStage("ready");
        return;
      }

      // 5) نجاح!
      setStage("success");

      // 6) امسح الـ token من الـ URL (لمنع إعادة المعالجة)
      try {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, cleanUrl);
        window.location.hash = "";
      } catch {}

      // 7) استدعِ onSuccess بعد فترة قصيرة (للسماح بعرض success state)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            email: sessionEmail,
            session: signInData.session,
          });
        } else {
          // default: redirect to home
          window.location.href = "/";
        }
      }, 1500);

    } catch (err) {
      console.error("SetPassword submit error:", err);
      setError("Something went wrong. Please try again.");
      setStage("ready");
      setShakeKey(k => k + 1);
    }
  };

  // ── 3) resend invite ──
  const handleResendInvite = async () => {
    if (!email) {
      setError("Please enter your email to resend the invite");
      return;
    }
    setResending(true);
    setResendMsg("");
    setError("");

    try {
      const { data, error } = await invokeEdgeFunction("resend-invite", { email });

      if (error) {
        setError(error.message || "Failed to resend invite");
        setShakeKey(k => k + 1);
      } else if (data?.error) {
        setError(data.error);
        setShakeKey(k => k + 1);
      } else {
        setResendMsg("Invite sent! Check your email.");
      }
    } catch (err) {
      setError("Failed to resend invite. Please contact admin.");
      setShakeKey(k => k + 1);
    }

    setResending(false);
  };

  // ── password strength meter ──
  const getStrength = (pw) => {
    if (!pw) return { bars: 0, label: "", color: C.gray };
    if (pw.length < 6) return { bars: 1, label: "Too short", color: C.red };
    if (pw.length < 8) return { bars: 2, label: "Weak", color: C.red };
    if (pw.length < 10) return { bars: 3, label: "Good", color: C.amber };
    return { bars: 4, label: "Strong", color: C.green };
  };
  const strength = getStrength(newPassword);

  const inputStyle = {
    width: "100%",
    padding: "13px 44px 13px 44px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "inherit",
    color: C.white,
    background: C.card,
    outline: "none",
    direction: "ltr",
    transition: "all 0.25s ease",
  };
  const iconL = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", left: 14, pointerEvents: "none", zIndex: 1 };
  const iconR = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", right: 14, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 };

  // ── Loading state ──
  if (loading || stage === "init") {
    return (
      <div style={{
        minHeight: "100dvh",
        background: `radial-gradient(circle at 30% 20%, ${C.red}22 0%, transparent 50%), ${C.black}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Archivo, sans-serif",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.red, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, animation: "pulse 1.5s ease infinite" }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div style={{ color: C.silver, fontSize: 14, fontWeight: 600 }}>Verifying your invite link…</div>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (stage === "success") {
    return (
      <div style={{
        minHeight: "100dvh",
        background: `radial-gradient(circle at 30% 20%, ${C.green}22 0%, transparent 50%), ${C.black}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Archivo, sans-serif",
        padding: 24,
      }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: C.green, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "pulse 2s ease infinite" }}>
            <CheckCircle2 size={36} color="#fff" />
          </div>
          <h1 style={{ color: C.white, fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
            Password Set Successfully!
          </h1>
          <p style={{ color: C.silver, fontSize: 14, fontWeight: 500, margin: 0 }}>
            Redirecting you to the dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Main form (ready / submitting / invalid) ──
  return (
    <div
      key={shakeKey}
      style={{
        minHeight: "100dvh",
        background: `radial-gradient(circle at 30% 20%, ${C.red}22 0%, transparent 50%), ${C.black}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Archivo, sans-serif",
        padding: 24,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease",
        animation: error ? "shake 0.4s ease" : "none",
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: C.red, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            marginBottom: 14, boxShadow: `0 8px 24px ${C.red}55`,
          }}>
            <Building2 size={28} color="#fff" />
          </div>
          <h1 style={{ color: C.white, fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: -0.3 }}>
            {stage === "invalid" ? "Invite Link Expired" : "Set Your Password"}
          </h1>
          <p style={{ color: C.silver, fontSize: 13, fontWeight: 500, margin: 0 }}>
            {stage === "invalid"
              ? "Your invite link is no longer valid. You can request a new one below."
              : email
                ? `Welcome to ONYX CRM. Set a password for ${email}.`
                : "Welcome to ONYX CRM. Please set your password."}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderTop: `2px solid ${C.red}`,
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        }}>
          {/* Email input (فقط في invalid state) */}
          {stage === "invalid" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: C.silver, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <span style={iconL}><Mail size={16} color={C.gray} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ ...inputStyle, padding: "13px 16px 13px 44px" }}
                />
              </div>
            </div>
          )}

          {/* New Password (فقط في ready/submitting) */}
          {stage !== "invalid" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: C.silver, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={iconL}><Lock size={16} color={C.gray} /></span>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    disabled={stage === "submitting"}
                  />
                  <button style={iconR} onClick={() => setShowNew(!showNew)} type="button">
                    {showNew ? <EyeOff size={16} color={C.gray} /> : <Eye size={16} color={C.gray} />}
                  </button>
                </div>
                {/* Strength meter */}
                {newPassword && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= strength.bars ? strength.color : C.border,
                        transition: "background 0.2s ease",
                      }} />
                    ))}
                  </div>
                )}
                {newPassword && (
                  <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 600 }}>
                    {strength.label}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ color: C.silver, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={iconL}><Lock size={16} color={C.gray} /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    disabled={stage === "submitting"}
                  />
                  <button style={iconR} onClick={() => setShowConfirm(!showConfirm)} type="button">
                    {showConfirm ? <EyeOff size={16} color={C.gray} /> : <Eye size={16} color={C.gray} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${C.red}15`,
              border: `1px solid ${C.red}44`,
              borderRadius: 10, padding: "10px 12px",
              marginBottom: 14,
            }}>
              <AlertCircle size={15} color={C.red} />
              <span style={{ color: C.red, fontSize: 12, fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Resend success message */}
          {resendMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${C.green}15`,
              border: `1px solid ${C.green}44`,
              borderRadius: 10, padding: "10px 12px",
              marginBottom: 14,
            }}>
              <CheckCircle2 size={15} color={C.green} />
              <span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>{resendMsg}</span>
            </div>
          )}

          {/* Submit button */}
          {stage !== "invalid" ? (
            <button
              onClick={handleSubmit}
              disabled={stage === "submitting"}
              style={{
                width: "100%", padding: "13px",
                background: C.red, color: C.white,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                cursor: stage === "submitting" ? "not-allowed" : "pointer",
                opacity: stage === "submitting" ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: `0 6px 20px ${C.red}44`,
                transition: "all 0.2s ease",
              }}
            >
              {stage === "submitting" ? "Setting password…" : "Set Password"}
              {stage !== "submitting" && <ArrowRight size={16} />}
            </button>
          ) : (
            <button
              onClick={handleResendInvite}
              disabled={resending || !email}
              style={{
                width: "100%", padding: "13px",
                background: C.red, color: C.white,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                cursor: resending || !email ? "not-allowed" : "pointer",
                opacity: resending || !email ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: `0 6px 20px ${C.red}44`,
              }}
            >
              {resending ? "Sending…" : "Resend Invite"}
              {!resending && <RefreshCw size={16} />}
            </button>
          )}

          {/* Back to login link */}
          {onBackToLogin && (
            <button
              onClick={onBackToLogin}
              style={{
                width: "100%", marginTop: 12,
                background: "none", border: "none",
                color: C.gray, fontSize: 12, fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer",
                padding: "6px",
              }}
            >
              ← Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
