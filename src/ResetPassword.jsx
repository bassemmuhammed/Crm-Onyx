// ── ResetPassword.jsx
import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Building2 } from "lucide-react";
import { supabase } from "./lib/supabase";

const NoSelect = () => <style>{"* { -webkit-user-select: none !important; user-select: none !important; }"}</style>;


export default function ResetPassword() {
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    if (hash.includes("access_token") || params.get("token")) {
      setValidToken(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setValidToken(true);
      });
    }
  }, []);

  const inputStyle = {
    width: "100%", padding: "13px 44px 13px 44px",
    border: "1.5px solid #242938", borderRadius: "12px",
    fontSize: "14px", fontFamily: "inherit", color: "#0B0D12",
    background: "#171B24", outline: "none",
    transition: "all 0.25s ease", boxSizing: "border-box",
  };
  const iconL = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", left: "14px", pointerEvents: "none" };
  const iconR = { position: "absolute", display: "flex", alignItems: "center", top: "50%", transform: "translateY(-50%)", right: "14px", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px" };
  const focusOn  = e => { e.target.style.borderColor = "#4C8DFF"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.08)"; };
  const focusOff = e => { e.target.style.borderColor = "#242938"; e.target.style.background = "#171B24"; e.target.style.boxShadow = "none"; };

  const strength = newPw.length >= 10 ? 4 : newPw.length >= 8 ? 3 : newPw.length >= 6 ? 2 : newPw.length > 0 ? 1 : 0;
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

  const handleSubmit = async () => {
    if (!newPw || !confirmPw) { setError("Please fill in all fields"); return; }
    if (newPw.length < 6)     { setError("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw)  { setError("Passwords don't match"); return; }

    setError(""); setLoading(true);

    // 1. حدّث الباسورد
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 2. اربط الـ auth id بجدول users
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { id, email } = session.user;
      await supabase
        .from("users")
        .update({ id })
        .eq("email", email);
    }

    setSuccess(true);
    setTimeout(() => { window.location.href = "/"; }, 2500);
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        html, body, #root { height:100%; width:100%; margin:0; padding:0; }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0B0D12; font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; }
        .rp-root { position:fixed; inset:0; display:flex; width:100vw; height:100vh; font-family:'Inter',sans-serif; background:#0B0D12; }
        .rp-left { flex:1; min-width:0; height:100vh; background:#0B0D12; position:relative; display:flex; flex-direction:column; padding:36px 48px; overflow:hidden; }
        .rp-glow1 { position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 65%); top:-140px; left:-120px; pointer-events:none; }
        .rp-glow2 { position:absolute; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(6,182,212,0.16) 0%,transparent 65%); bottom:-100px; right:-60px; pointer-events:none; }
        .rp-right { flex-shrink:0; width:460px; height:100vh; background:#fff; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:-24px 0 80px rgba(0,0,0,0.2); }
        .rp-form { width:100%; padding:0 48px; display:flex; flex-direction:column; justify-content:center; }
        .rp-title { font-size:28px; font-weight:800; color:#0B0D12; letter-spacing:-0.8px; margin-bottom:6px; }
        .rp-bar { width:36px; height:3px; background:linear-gradient(90deg,#4C8DFF,#06b6d4); border-radius:100px; margin-bottom:10px; }
        .rp-sub { color:#5B6478; font-size:13px; line-height:1.6; margin-bottom:24px; }
        .rp-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .rp-label { font-size:13px; font-weight:600; color:#334155; }
        .rp-btn { width:100%; padding:13px; background:linear-gradient(135deg,#4C8DFF 0%,#4f46e5 100%); color:#fff; border:none; border-radius:12px; font-size:15px; font-family:inherit; font-weight:600; cursor:pointer; transition:all 0.25s ease; display:flex; align-items:center; justify-content:center; gap:8px; }
        .rp-btn:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,0.35); }
        .rp-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
        .rp-error { display:flex; align-items:center; gap:9px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px 14px; color:#dc2626; font-size:13px; margin-bottom:12px; }
        .brand-icon { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#4C8DFF,#4f46e5); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(99,102,241,0.4); }
        .spinner { width:17px; height:17px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width:768px) { .rp-left{display:none;} .rp-right{width:100%;} .rp-form{padding:0 32px;} }
      `}</style>

      <div className="rp-root" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
      <NoSelect />
        <div className="rp-right">
          <div className="rp-form">
            {success ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"32px 0", textAlign:"center" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CheckCircle2 size={32} color="#22c55e" strokeWidth={2} />
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:"#0B0D12" }}>Password Set!</div>
                <div style={{ fontSize:13, color:"#5B6478" }}>Redirecting you to sign in...</div>
              </div>
            ) : !validToken ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#0B0D12", marginBottom:8 }}>Invalid or expired link</div>
                <div style={{ fontSize:13, color:"#5B6478", marginBottom:20 }}>Please ask your admin to send a new invite.</div>
                <a href="/" style={{ color:"#4C8DFF", fontWeight:600, fontSize:14 }}>← Back to Sign In</a>
              </div>
            ) : (
              <>
                <h2 className="rp-title">Set Your Password</h2>
                <div className="rp-bar" />
                <p className="rp-sub">Welcome! Please set a password to access your account.</p>

                {error && (
                  <div className="rp-error">
                    <AlertCircle size={15} color="#ef4444" strokeWidth={2} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="rp-field">
                  <label className="rp-label">New Password</label>
                  <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                    <span style={iconL}><Lock size={16} color="#5B6478" strokeWidth={1.8} /></span>
                    <input style={inputStyle} type={showNew ? "text" : "password"} placeholder="Min. 6 characters"
                      value={newPw} onChange={e => setNewPw(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
                    <button style={iconR} onClick={() => setShowNew(v => !v)} type="button">
                      {showNew ? <EyeOff size={16} color="#5B6478" strokeWidth={1.8} /> : <Eye size={16} color="#5B6478" strokeWidth={1.8} />}
                    </button>
                  </div>
                  {newPw && (
                    <div style={{ display:"flex", gap:4, marginTop:4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:100, background: i <= strength ? strengthColors[strength-1] : "#1D2230", transition:"all 0.3s ease" }} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="rp-field">
                  <label className="rp-label">Confirm Password</label>
                  <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                    <span style={iconL}><Lock size={16} color="#5B6478" strokeWidth={1.8} /></span>
                    <input style={inputStyle} type={showConf ? "text" : "password"} placeholder="Re-enter password"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onFocus={focusOn} onBlur={focusOff}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                    <button style={iconR} onClick={() => setShowConf(v => !v)} type="button">
                      {showConf ? <EyeOff size={16} color="#5B6478" strokeWidth={1.8} /> : <Eye size={16} color="#5B6478" strokeWidth={1.8} />}
                    </button>
                  </div>
                </div>

                <button className="rp-btn" onClick={handleSubmit} disabled={loading} type="button">
                  {loading ? <><span className="spinner" /> Setting password...</> : <>Set Password <ArrowRight size={18} strokeWidth={2} /></>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rp-left">
          <div className="rp-glow1" /><div className="rp-glow2" />
          <div style={{ display:"flex", alignItems:"center", gap:12, position:"relative", zIndex:2 }}>
            <div className="brand-icon"><Building2 size={20} color="#fff" strokeWidth={1.8} /></div>
            <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>Onyx CRM</div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", position:"relative", zIndex:2 }}>
            <h1 style={{ fontSize:"clamp(28px,3.5vw,52px)", color:"#fff", fontWeight:800, lineHeight:1.2, marginBottom:14, letterSpacing:-1 }}>
              Welcome to<br />
              <span style={{ background:"linear-gradient(90deg,#818cf8,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Onyx CRM</span>
            </h1>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, lineHeight:1.8, maxWidth:380 }}>
              Set your password to get started and access your sales dashboard.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
