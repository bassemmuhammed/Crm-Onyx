import { useState, useEffect } from "react";
import { Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Building2, TrendingUp, Users, Shield, KeyRound, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";

// ─────────────────────────────────────────────
//  SESSION HELPERS
// ─────────────────────────────────────────────
const Session = {
  save: ({ user, role, remember }) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("crm_user", JSON.stringify(user));
    store.setItem("crm_role", role);
    if (remember) localStorage.setItem("crm_remember", "true");
  },
  load: () => {
    const remember = localStorage.getItem("crm_remember") === "true";
    const store = remember ? localStorage : sessionStorage;
    return {
      user: JSON.parse(store.getItem("crm_user") || "null"),
      role: store.getItem("crm_role"),
      remember,
    };
  },
  clear: () => {
    ["crm_user", "crm_role", "crm_remember", "crm_phone"].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  },
};

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [view, setView]                 = useState("login");
  const [phone, setPhone]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [shakeKey, setShakeKey]         = useState(0);
  const [rememberMe, setRememberMe]     = useState(() => localStorage.getItem("crm_remember") === "true");
  const [mounted, setMounted]           = useState(false);

  // Change-password fields
  const [cpPhone, setCpPhone]             = useState("");
  const [cpCurrentPw, setCpCurrentPw]     = useState("");
  const [cpNewPw, setCpNewPw]             = useState("");
  const [cpConfirmPw, setCpConfirmPw]     = useState("");
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew]         = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpSuccess, setCpSuccess]         = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  useEffect(() => {
    if (localStorage.getItem("crm_remember") === "true") {
      setPhone(localStorage.getItem("crm_phone") || "");
    }
  }, []);

  // ── LOGIN بـ Supabase ──
  // 🔒 Phase 1.5 (Flutter migration): استبدال الاستعلام المباشر على users table
  // بـ RPC آمن `login_with_phone` يمنع user enumeration + equalized response time
  // (pg_sleep(0.1) على الفشل) + bcrypt check + active check.
  // الـ RPC موجود في migrations/02_login_rpc.sql
  const handleLogin = async () => {
    if (!phone || !password) {
      setError("Please fill in all fields");
      setShakeKey(k => k + 1);
      return;
    }
    setError(""); setLoading(true);

    try {
      // 1) استدعاء RPC الآمن — يرجع user JSON أو null (موحد للـ timing)
      const { data: rpcUser, error: rpcError } = await supabase.rpc("login_with_phone", {
        p_phone: phone,
        p_password: password,
      });

      // لو الـ RPC رجع null أو error → رسالة موحدة (نفسها في كل الحالات)
      if (rpcError || !rpcUser) {
        setError("Incorrect phone number or password");
        setShakeKey(k => k + 1);
        setLoading(false);
        return;
      }

      // 2) تأسيس session عبر Supabase Auth (الإيميل من الـ RPC)
      // 🔒 SECURITY FIX SC-001 (مطابق Flutter): لو signIn فشل بعد نجاح الـ RPC
      //    امنع تسجيل الدخول (الباسورد مش متزامن بين users و auth.users)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: rpcUser.email,
        password: password,
      });

      if (authError) {
        // مش نرجع "wrong password" عشان نمنع information leakage
        setError("Unable to sign in. Please contact admin to sync your password.");
        setShakeKey(k => k + 1);
        setLoading(false);
        return;
      }

      // 3) حفظ الـ session — نستخدم بيانات الـ RPC (موثوقة)
      const userData = {
        id: rpcUser.id,
        full_name: rpcUser.full_name,
        name: rpcUser.full_name, // alias للموافقة مع الكود القديم
        email: rpcUser.email,
        phone: rpcUser.phone,
        role: rpcUser.role,
        avatar_url: rpcUser.avatar_url,
        active: rpcUser.active,
      };

      Session.save({ user: userData, role: userData.role, remember: rememberMe });
      if (rememberMe) localStorage.setItem("crm_phone", phone);
      onLogin(userData.role, userData, authData.session.access_token);

    } catch (err) {
      setError("Something went wrong, please try again");
      setShakeKey(k => k + 1);
    }

    setLoading(false);
  };

  // ── تغيير الباسورد بـ Supabase ──
  // 🔒 نفس مبدأ RPC login_with_phone: نتجنب الاستعلام المباشر على users table
  const handleChangePassword = async () => {
    if (!cpPhone || !cpCurrentPw || !cpNewPw || !cpConfirmPw) {
      setError("Please fill in all fields"); setShakeKey(k => k + 1); return;
    }
    if (cpNewPw.length < 6) {
      setError("New password must be at least 6 characters"); setShakeKey(k => k + 1); return;
    }
    if (cpNewPw !== cpConfirmPw) {
      setError("New passwords don't match"); setShakeKey(k => k + 1); return;
    }
    setError(""); setLoading(true);

    try {
      // 1) استخدم RPC login_with_phone للتحقق من phone + current password
      //    (نفس الأمان المطبق في الـ login)
      const { data: rpcUser, error: rpcError } = await supabase.rpc("login_with_phone", {
        p_phone: cpPhone,
        p_password: cpCurrentPw,
      });

      if (rpcError || !rpcUser) {
        setError("Phone number or current password is incorrect");
        setShakeKey(k => k + 1);
        setLoading(false);
        return;
      }

      // 2) حدّث الباسورد عبر Supabase Auth (بنفس الإيميل من الـ RPC)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: rpcUser.email,
        password: cpCurrentPw,
      });

      if (signInError) {
        setError("Current password is incorrect");
        setShakeKey(k => k + 1);
        setLoading(false);
        return;
      }

      // 3) حدّث الباسورد
      const { error: updateError } = await supabase.auth.updateUser({
        password: cpNewPw,
      });

      if (updateError) {
        setError("Failed to update password");
        setShakeKey(k => k + 1);
        setLoading(false);
        return;
      }

      setCpSuccess(true);
      setTimeout(() => {
        setCpSuccess(false);
        setView("login");
        setCpPhone(""); setCpCurrentPw(""); setCpNewPw(""); setCpConfirmPw("");
      }, 2200);

    } catch (err) {
      setError("Something went wrong, please try again");
      setShakeKey(k => k + 1);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") view === "login" ? handleLogin() : handleChangePassword();
  };

  // ── SHARED STYLES ──
  const inputStyle = {
    width: "100%",
    padding: "13px 44px 13px 44px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    direction: "ltr",
    transition: "all 0.25s ease",
  };
  const inputNoRightPad = { ...inputStyle, padding: "13px 16px 13px 44px" };
  const iconL = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", left: "14px", pointerEvents: "none", zIndex: 1 };
  const iconR = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", right: "14px", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px" };
  const focusOn  = e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.08)"; };
  const focusOff = e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="root" dir="ltr" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>

        {/* ── RIGHT: FORM PANEL ── */}
        <div className="right-panel">
          <div className="form-wrap">

            {/* ═══════════════ LOGIN VIEW ═══════════════ */}
            {view === "login" && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Sign In</h2>
                  <div className="form-title-bar" />
                  <p className="form-sub">Enter your credentials to access the dashboard</p>
                </div>

                <div className="fields">
                  {/* Phone */}
                  <div className="field">
                    <label className="field-label">Phone Number</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={iconL}><Phone size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                      <input
                        style={inputNoRightPad}
                        type="tel"
                        placeholder="010XXXXXXXX"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={handleKey}
                        onFocus={focusOn}
                        onBlur={focusOff}
                        maxLength={11}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="field">
                    <label className="field-label">Password</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={iconL}><Lock size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                      <input
                        style={inputStyle}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKey}
                        onFocus={focusOn}
                        onBlur={focusOff}
                      />
                      <button style={iconR} onClick={() => setShowPassword(!showPassword)} type="button"
                        onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        {showPassword ? <EyeOff size={16} color="#94a3b8" strokeWidth={1.8} /> : <Eye size={16} color="#94a3b8" strokeWidth={1.8} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Change PW */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div onClick={() => setRememberMe(r => !r)} style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: rememberMe ? "2px solid #6366f1" : "2px solid #cbd5e1",
                        background: rememberMe ? "#6366f1" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s ease",
                      }}>
                        {rememberMe && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span onClick={() => setRememberMe(r => !r)}
                        style={{ fontSize: 13, color: "#64748b", cursor: "pointer", userSelect: "none", fontWeight: 500 }}>
                        Remember me
                      </span>
                    </div>
                    <button onClick={() => { setView("changePassword"); setError(""); }} type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6366f1", fontWeight: 600, fontFamily: "inherit", padding: 0 }}>
                      Change Password
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="error-box" key={shakeKey}>
                      <AlertCircle size={15} color="#ef4444" strokeWidth={2} /><span>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button className="submit-btn" onClick={handleLogin} disabled={loading} type="button">
                    {loading
                      ? <span className="btn-inner"><span className="spinner" />Signing in...</span>
                      : <span className="btn-inner">Sign In<ArrowRight size={18} strokeWidth={2} /></span>}
                  </button>
                </div>
              </>
            )}

            {/* ═══════════════ CHANGE PASSWORD VIEW ═══════════════ */}
            {view === "changePassword" && (
              <>
                <div className="form-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <KeyRound size={18} color="#fff" strokeWidth={1.8} />
                    </div>
                    <h2 className="form-title" style={{ marginBottom: 0 }}>Change Password</h2>
                  </div>
                  <div className="form-title-bar" />
                  <p className="form-sub">Verify your phone number and set a new password</p>
                </div>

                {cpSuccess ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0", animation: "fadeUp 0.4s ease" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={28} color="#22c55e" strokeWidth={2} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Password Updated!</p>
                    <p style={{ fontSize: 13, color: "#94a3b8" }}>Redirecting to sign in...</p>
                  </div>
                ) : (
                  <div className="fields">
                    {/* Phone */}
                    <div className="field">
                      <label className="field-label">Phone Number</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={iconL}><Phone size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                        <input style={inputNoRightPad} type="tel" placeholder="010XXXXXXXX"
                          value={cpPhone} onChange={e => setCpPhone(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={handleKey} onFocus={focusOn} onBlur={focusOff} maxLength={11} />
                      </div>
                    </div>

                    {/* Current Password */}
                    <div className="field">
                      <label className="field-label">Current Password</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={iconL}><Lock size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                        <input style={inputStyle} type={cpShowCurrent ? "text" : "password"} placeholder="••••••••"
                          value={cpCurrentPw} onChange={e => setCpCurrentPw(e.target.value)}
                          onKeyDown={handleKey} onFocus={focusOn} onBlur={focusOff} />
                        <button style={iconR} onClick={() => setCpShowCurrent(!cpShowCurrent)} type="button"
                          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>
                          {cpShowCurrent ? <EyeOff size={16} color="#94a3b8" strokeWidth={1.8} /> : <Eye size={16} color="#94a3b8" strokeWidth={1.8} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="field">
                      <label className="field-label">New Password</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={iconL}><Lock size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                        <input style={inputStyle} type={cpShowNew ? "text" : "password"} placeholder="Min. 6 characters"
                          value={cpNewPw} onChange={e => setCpNewPw(e.target.value)}
                          onKeyDown={handleKey} onFocus={focusOn} onBlur={focusOff} />
                        <button style={iconR} onClick={() => setCpShowNew(!cpShowNew)} type="button"
                          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>
                          {cpShowNew ? <EyeOff size={16} color="#94a3b8" strokeWidth={1.8} /> : <Eye size={16} color="#94a3b8" strokeWidth={1.8} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="field">
                      <label className="field-label">Confirm New Password</label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <span style={iconL}><Lock size={16} color="#94a3b8" strokeWidth={1.8} /></span>
                        <input style={inputStyle} type={cpShowConfirm ? "text" : "password"} placeholder="Re-enter new password"
                          value={cpConfirmPw} onChange={e => setCpConfirmPw(e.target.value)}
                          onKeyDown={handleKey} onFocus={focusOn} onBlur={focusOff} />
                        <button style={iconR} onClick={() => setCpShowConfirm(!cpShowConfirm)} type="button"
                          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>
                          {cpShowConfirm ? <EyeOff size={16} color="#94a3b8" strokeWidth={1.8} /> : <Eye size={16} color="#94a3b8" strokeWidth={1.8} />}
                        </button>
                      </div>
                    </div>

                    {/* Password strength */}
                    {cpNewPw && (
                      <div style={{ display: "flex", gap: 4, marginTop: -4 }}>
                        {[1, 2, 3, 4].map(i => {
                          const strength = cpNewPw.length >= 10 ? 4 : cpNewPw.length >= 8 ? 3 : cpNewPw.length >= 6 ? 2 : 1;
                          const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                          return <div key={i} style={{ flex: 1, height: 3, borderRadius: 100, background: i <= strength ? colors[strength - 1] : "#f1f5f9", transition: "all 0.3s ease" }} />;
                        })}
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="error-box" key={shakeKey}>
                        <AlertCircle size={15} color="#ef4444" strokeWidth={2} /><span>{error}</span>
                      </div>
                    )}

                    <button className="submit-btn" onClick={handleChangePassword} disabled={loading} type="button">
                      {loading
                        ? <span className="btn-inner"><span className="spinner" />Updating...</span>
                        : <span className="btn-inner">Update Password<ArrowRight size={18} strokeWidth={2} /></span>}
                    </button>

                    <button onClick={() => { setView("login"); setError(""); }} type="button"
                      style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "11px", width: "100%", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: "inherit", transition: "all 0.2s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}>
                      ← Back to Sign In
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* ── LEFT: HERO PANEL ── */}
        <div className="left-panel">
          <div className="left-noise" />
          <div className="left-glow-1" /><div className="left-glow-2" /><div className="left-glow-3" />

          <div className="left-topbar">
            <div className="brand">
              <div className="brand-icon"><Building2 size={20} color="#fff" strokeWidth={1.8} /></div>
              <div><div className="brand-name">Onyx CRM</div></div>
            </div>
          </div>

          <div className="left-center">
            <h1 className="left-headline">
              Manage Your Deals<br />
              <span className="headline-accent">Professionally</span>
            </h1>
            <p className="left-desc">An all-in-one platform for managing clients, projects, and commissions — everything you need in one place.</p>
            <div className="stats-row">
              <div className="stat-card">
                <Users size={18} color="#818cf8" strokeWidth={1.8} />
                <div className="stat-num">120+</div>
                <div className="stat-lbl">Active Clients</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-card">
                <TrendingUp size={18} color="#34d399" strokeWidth={1.8} />
                <div className="stat-num">24/7</div>
                <div className="stat-lbl">Always Online</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-card">
                <Shield size={18} color="#f472b6" strokeWidth={1.8} />
                <div className="stat-num">100%</div>
                <div className="stat-lbl">Secure</div>
              </div>
            </div>
          </div>

          <div className="left-dots">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="dot" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  html, body, #root { height:100%; width:100%; margin:0; padding:0; overflow:hidden; }
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body {
    background:#0f172a;
    font-family:'Plus Jakarta Sans', sans-serif;
    -webkit-font-smoothing:antialiased;
  }

  .root {
    position:fixed; inset:0;
    display:flex; flex-direction:row;
    width:100vw; height:100vh;
    overflow:hidden; user-select:none;
    font-family:'Plus Jakarta Sans', sans-serif;
    background:#0f172a;
  }

  .left-panel {
    flex:1; min-width:0; height:100vh;
    background:#0f172a; position:relative;
    display:flex; flex-direction:column;
    padding:36px 48px; overflow:hidden;
  }
  .left-noise { position:absolute; inset:0; pointer-events:none; opacity:0.4; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); }
  .left-glow-1 { position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 65%); top:-140px; left:-120px; pointer-events:none; animation:float1 7s ease-in-out infinite; }
  .left-glow-2 { position:absolute; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(6,182,212,0.16) 0%,transparent 65%); bottom:-100px; right:-60px; pointer-events:none; animation:float2 8s ease-in-out infinite; }
  .left-glow-3 { position:absolute; width:260px; height:260px; border-radius:50%; background:radial-gradient(circle,rgba(244,114,182,0.12) 0%,transparent 65%); top:45%; left:55%; pointer-events:none; animation:float1 6s ease-in-out infinite reverse; }
  @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
  @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-16px,16px)} }

  .left-topbar { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; animation:fadeUp 0.6s 0.1s ease both; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand-icon { width:40px; height:40px; flex-shrink:0; border-radius:10px; background:linear-gradient(135deg,#6366f1,#4f46e5); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(99,102,241,0.4); }
  .brand-name { color:#fff; font-size:16px; font-weight:700; white-space:nowrap; }

  .left-center { flex:1; position:relative; z-index:2; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; animation:fadeUp 0.7s 0.25s ease both; min-height:0; padding:24px 0; }
  .left-headline { font-size:clamp(28px,3.5vw,52px); color:#fff; font-weight:800; line-height:1.2; margin-bottom:14px; letter-spacing:-1px; text-align:center; }
  .headline-accent { background:linear-gradient(90deg,#818cf8,#06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .left-desc { color:rgba(255,255,255,0.45); font-size:14px; line-height:1.8; max-width:380px; margin-bottom:32px; text-align:center; }
  .stats-row { display:flex; align-items:center; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px 20px; width:fit-content; backdrop-filter:blur(8px); }
  .stat-card { text-align:center; padding:0 18px; display:flex; flex-direction:column; align-items:center; gap:5px; }
  .stat-divider { width:1px; height:36px; background:rgba(255,255,255,0.1); }
  .stat-num { color:#fff; font-size:19px; font-weight:700; line-height:1; }
  .stat-lbl { color:rgba(255,255,255,0.35); font-size:11px; }

  .left-dots { flex-shrink:0; display:flex; gap:8px; flex-wrap:wrap; max-width:160px; position:relative; z-index:2; animation:fadeUp 0.7s 0.4s ease both; }
  .dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.12); animation:dot-pulse 3s ease-in-out infinite; }
  @keyframes dot-pulse { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.3)} }

  .right-panel { flex-shrink:0; width:460px; height:100vh; background:#fff; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; box-shadow:-24px 0 80px rgba(0,0,0,0.2); }
  .form-wrap { width:100%; max-height:100vh; padding:0 48px; display:flex; flex-direction:column; justify-content:center; animation:fadeUp 0.6s 0.2s ease both; }
  .form-header { margin-bottom:24px; }
  .form-title { font-size:clamp(20px,2vw,28px); font-weight:800; color:#0f172a; letter-spacing:-0.8px; line-height:1.15; margin-bottom:10px; }
  .form-title-bar { width:36px; height:3px; background:linear-gradient(90deg,#6366f1,#06b6d4); border-radius:100px; margin-bottom:10px; }
  .form-sub { color:#94a3b8; font-size:13px; line-height:1.6; }

  .fields { display:flex; flex-direction:column; gap:14px; }
  .field { display:flex; flex-direction:column; gap:6px; }
  .field-label { font-size:13px; font-weight:600; color:#334155; letter-spacing:0.2px; }

  .error-box { display:flex; align-items:center; gap:9px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px 14px; color:#dc2626; font-size:13px; animation:shake 0.35s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

  .submit-btn { width:100%; padding:13px; background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%); color:#fff; border:none; border-radius:12px; font-size:15px; font-family:inherit; font-weight:600; cursor:pointer; margin-top:4px; transition:all 0.25s ease; }
  .submit-btn:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,0.35); }
  .submit-btn:active { transform:translateY(0); }
  .submit-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
  .btn-inner { display:flex; align-items:center; justify-content:center; gap:8px; }
  .spinner { width:17px; height:17px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }

  .divider { display:flex; align-items:center; gap:12px; margin:18px 0 14px; }
  .divider-line { flex:1; height:1px; background:#f1f5f9; }
  .divider-text { font-size:11px; color:#cbd5e1; letter-spacing:1px; white-space:nowrap; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  @media (max-width:1100px) { .left-panel{padding:28px 36px;} .form-wrap{padding:0 36px;} .right-panel{width:420px;} }
  @media (max-width:768px)  { .left-panel{display:none;} .right-panel{width:100%;} .form-wrap{padding:0 32px;} }
  @media (max-width:480px)  { .form-wrap{padding:0 24px;} }
`;
