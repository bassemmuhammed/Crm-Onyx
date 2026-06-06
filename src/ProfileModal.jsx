// ── ProfileModal.jsx — ONYX CRM ───────────────────────────────
import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import Icons from "./Icons";

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  black:    "#000000",
  surface:  "#0D0D0D",
  card:     "#161618",
  border:   "#2A2A2E",
  cardAlt:  "#1E1E22",
  cardHover:"#252528",
  gray:     "#6B6C73",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  blue:     "#253FF6",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Archivo', sans-serif !important; }
  @keyframes sheet-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .profile-sheet { animation: sheet-up .32s cubic-bezier(.4,0,.2,1) both; }
  .pf-field { transition: background .15s; }
  .pf-btn   { transition: all .18s; }
  .pf-btn:active { transform: scale(.97); }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1 !important; }
`;

const FIELDS = [
  { label: "Full Name",  key: "name",   icon: "user"      },
  { label: "Email",      key: "email",  icon: "sparkle"   },
  { label: "Phone",      key: "phone",  icon: "phoneCall" },
  { label: "Region",     key: "region", icon: "house"     },
  { label: "Job Title",  key: "title",  icon: "chart"     },
];

// ── Resize + compress image → small base64 JPEG ───────────────
function resizeImage(file, maxSize = 256, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; } }
        else       { if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        let b64 = canvas.toDataURL("image/jpeg", quality);
        // If still >150KB, compress more aggressively
        if (b64.length > 150000) {
          const c2 = document.createElement("canvas");
          const s = 180;
          c2.width = s; c2.height = s;
          c2.getContext("2d").drawImage(img, 0, 0, s, s);
          b64 = c2.toDataURL("image/jpeg", 0.5);
        }
        resolve(b64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose, onSignOut }) {
  const [userData,  setUserData]  = useState(null);
  const [userId,    setUserId]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!open) {
      // Reset so next open always shows fresh data
      setUserData(null);
      setLoading(true);
      return;
    }
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data } = await supabase
          .from("users")
          .select("name, email, phone, region, title, role, avatar_url, color")
          .eq("id", user.id)
          .single()
          .throwOnError();
        setUserData(data || { name: user.email, email: user.email });
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchUser();
  }, [open]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Upload: resize → base64 → save in users.avatar_url ───────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      showToast("ارفع صورة فقط", false); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("الصورة أكبر من 10MB", false); return;
    }

    setUploading(true);
    try {
      const base64 = await resizeImage(file, 256, 0.7);

      // Save to DB
      const { error, data } = await supabase
        .from("users")
        .update({ avatar_url: base64 })
        .eq("id", userId)
        .select("avatar_url")
        .single();

      if (error) { showToast(`خطأ: ${error.message}`, false); return; }

      // Verify it actually saved by checking returned data
      if (!data?.avatar_url) {
        showToast("لم يتم الحفظ — حاول تاني", false); return;
      }

      setUserData(prev => ({ ...prev, avatar_url: data.avatar_url }));
      showToast("تم حفظ الصورة ✓");
    } catch (err) {
      showToast(`خطأ: ${err.message}`, false);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const initial     = userData?.name?.charAt(0)?.toUpperCase() || "?";
  const hasPhoto    = !!userData?.avatar_url;
  const accentColor = userData?.color || C.red;

  return (
    <>
      <style>{STYLES}</style>

      {/* File input — off-screen for Android gallery compat */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ position:"fixed", top:-9999, left:-9999, width:1, height:1, opacity:0 }}
        onChange={handlePhotoChange}
      />

      <div style={{
        position:"fixed", inset:0, zIndex:200,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition:"opacity .25s",
      }}>
        {/* Backdrop */}
        <div onClick={onClose} style={{
          position:"absolute", inset:0,
          background:"rgba(0,0,0,.75)", backdropFilter:"blur(6px)",
        }} />

        {/* Sheet */}
        {open && (
          <div className="profile-sheet" style={{
            position:"relative", zIndex:1,
            width:"100%", maxWidth:430,
            background:C.card,
            borderRadius:"22px 22px 0 0",
            border:`1px solid ${C.border}`,
            borderBottom:"none",
            boxShadow:"0 -8px 64px rgba(0,0,0,.7)",
            display:"flex", flexDirection:"column",
            maxHeight:"90vh", overflow:"hidden",
          }}>

            {/* Drag handle */}
            <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
              <div style={{ width:38, height:4, borderRadius:99, background:C.border }} />
            </div>

            {/* Avatar + Info */}
            <div style={{
              margin:"14px 16px 0",
              background:C.cardAlt,
              border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${accentColor}`,
              borderRadius:16,
              padding:"16px",
              display:"flex", alignItems:"center", gap:14,
              position:"relative", overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg, ${accentColor}55 0%, transparent 100%)`,
              }} />

              {/* Circular Avatar */}
              <div
                className="pf-avatar-wrap"
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  width:64, height:64, borderRadius:"50%", flexShrink:0,
                  background: hasPhoto ? "transparent" : accentColor + "30",
                  border:`2.5px solid ${accentColor}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1.5rem", fontWeight:900, color:C.white,
                  cursor: uploading ? "wait" : "pointer",
                  position:"relative", overflow:"hidden",
                }}
              >
                {uploading ? (
                  <div style={{
                    width:22, height:22,
                    border:`2.5px solid ${C.white}`,
                    borderTopColor:"transparent",
                    borderRadius:"50%",
                    animation:"spin .7s linear infinite",
                  }} />
                ) : hasPhoto ? (
                  <img
                    src={userData.avatar_url}
                    alt="avatar"
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                  />
                ) : (
                  <span>{loading ? "…" : initial}</span>
                )}

                {/* Hover overlay */}
                <div className="pf-avatar-overlay" style={{
                  position:"absolute", inset:0,
                  background:"rgba(0,0,0,.55)",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  opacity:0, transition:"opacity .2s", gap:2,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
                      stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize:".45rem", fontWeight:800, color:C.white, letterSpacing:".5px" }}>
                    {hasPhoto ? "CHANGE" : "ADD"}
                  </span>
                </div>
              </div>

              {/* Name / role */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:".95rem", fontWeight:800, color:C.white,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>
                  {loading ? "Loading..." : (userData?.name || "—")}
                </div>
                {userData?.title && (
                  <div style={{ fontSize:".63rem", color:C.gray, fontWeight:600, marginTop:2 }}>
                    {userData.title}
                  </div>
                )}
                {userData?.role && (
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:4,
                    marginTop:7, padding:"2px 9px", borderRadius:5,
                    border:`1px solid ${accentColor}44`,
                    background:`${accentColor}12`,
                  }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:accentColor }} />
                    <span style={{
                      fontSize:".52rem", fontWeight:800, color:accentColor,
                      textTransform:"uppercase", letterSpacing:1,
                    }}>
                      {userData.role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Toast */}
            {toast && (
              <div style={{
                margin:"10px 16px 0", padding:"10px 14px", borderRadius:10,
                background: toast.ok ? "#10b98120" : "#CC151520",
                border:`1px solid ${toast.ok ? "#10b98155" : "#CC151555"}`,
                color: toast.ok ? "#10b981" : C.red,
                fontSize:".72rem", fontWeight:700,
                display:"flex", alignItems:"center", gap:8,
              }}>
                <span>{toast.ok ? "✓" : "✕"}</span>
                {toast.msg}
              </div>
            )}

            {/* Fields */}
            <div style={{
              overflowY:"auto", padding:"12px 16px 0",
              display:"flex", flexDirection:"column", gap:7,
            }}>
              {FIELDS.map(({ label, key, icon }) => (
                <div key={key} className="pf-field" style={{
                  padding:"11px 14px", borderRadius:12,
                  background:C.cardAlt, border:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", gap:12,
                }}>
                  <span style={{ color:accentColor, flexShrink:0, opacity:.85, display:"flex", alignItems:"center" }}>
                    {Icons[icon]}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      fontSize:".52rem", fontWeight:700, color:C.gray,
                      textTransform:"uppercase", letterSpacing:".8px", marginBottom:3,
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize:".82rem", fontWeight:600,
                      color: loading ? C.gray : C.white,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>
                      {loading ? "—" : (userData?.[key] || "—")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding:"14px 16px 24px", display:"flex", flexDirection:"column", gap:8 }}>
              <button
                className="pf-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  width:"100%", padding:"12px",
                  borderRadius:11,
                  border:`1px solid ${accentColor}44`,
                  background:`${accentColor}10`,
                  color:accentColor,
                  fontSize:".78rem", fontWeight:800,
                  cursor: uploading ? "wait" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                    stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {uploading ? "جاري الرفع..." : hasPhoto ? "تغيير الصورة" : "إضافة صورة"}
              </button>

              <button
                className="pf-btn"
                onClick={() => { onClose(); onSignOut?.(); }}
                style={{
                  width:"100%", padding:"13px",
                  borderRadius:12, border:`1px solid ${C.border}`,
                  background:C.cardHover, color:C.white,
                  fontSize:".82rem", fontWeight:800, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {Icons.signOut} Sign Out
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
