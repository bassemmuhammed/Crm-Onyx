// ── ProfileModal.jsx — ONYX Design System ────────────────────────────
// بروفايل المستخدم - bottom sheet بـ ONYX dark UI
// بيجيب اسم اليوزر من Supabase

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Icons from "./Icons";

const C = {
  surface: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  cardAlt: "#1A1A1A", cardHover: "#252525", gray: "#595A5F",
  silver: "#CECECE", white: "#FFFFFF", red: "#CC1515", redLight: "#FF2020",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
  @keyframes sheet-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .profile-sheet {
    animation: sheet-up .3s cubic-bezier(.4,0,.2,1) both;
    font-family: 'Archivo', sans-serif;
  }
  .profile-field { transition: background .15s; }
  .profile-field:active { background: #1e1e1e !important; }
  .signout-btn { transition: all .15s; }
  .signout-btn:active { transform: scale(.97); }
`;

const FIELDS = [
  { label: "Full Name",  key: "name",   icon: "user"      },
  { label: "Email",      key: "email",  icon: "sparkle"   },
  { label: "Phone",      key: "phone",  icon: "phoneCall" },
  { label: "Region",     key: "region", icon: "house"     },
  { label: "Job Title",  key: "title",  icon: "chart"     },
];

export default function ProfileModal({ open, onClose, onSignOut }) {
  const [userData, setUserData] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("users")
          .select("name, email, phone, region, title, role")
          .eq("id", user.id)
          .single();

        setUserData(data || { name: user.email, email: user.email });
      } catch (_) {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [open]);

  const initial = userData?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "opacity .25s",
      }}>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)",
          }}
        />

        {/* Sheet */}
        {open && (
          <div className="profile-sheet" style={{
            position: "relative", zIndex: 1,
            width: "100%", maxWidth: 430,
            background: C.card,
            borderRadius: "20px 20px 0 0",
            border: `1px solid ${C.border}`,
            borderBottom: "none",
            boxShadow: "0 -8px 48px rgba(0,0,0,.6)",
            display: "flex", flexDirection: "column",
            maxHeight: "88vh", overflow: "hidden",
          }}>

            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border }} />
            </div>

            {/* Avatar card */}
            <div style={{
              margin: "12px 16px 0",
              background: C.cardAlt,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.red}`,
              borderRadius: 14,
              padding: "16px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              {/* Avatar circle */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: C.cardHover,
                border: `1.5px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", fontWeight: 900, color: C.white, flexShrink: 0,
                fontFamily: "Archivo, sans-serif",
              }}>
                {loading ? "…" : initial}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: ".95rem", fontWeight: 800, color: C.white,
                  fontFamily: "Archivo, sans-serif",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {loading ? "Loading..." : (userData?.name || "—")}
                </div>
                {userData?.title && (
                  <div style={{
                    fontSize: ".65rem", color: C.gray, fontWeight: 600,
                    marginTop: 2, fontFamily: "Archivo, sans-serif",
                  }}>
                    {userData.title}
                  </div>
                )}
                {/* Role badge */}
                {userData?.role && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginTop: 6, padding: "2px 8px", borderRadius: 4,
                    border: `1px solid ${C.red}44`,
                    background: `${C.red}10`,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />
                    <span style={{
                      fontSize: ".52rem", fontWeight: 800, color: C.red,
                      textTransform: "uppercase", letterSpacing: 1,
                      fontFamily: "Archivo, sans-serif",
                    }}>
                      {userData.role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            <div style={{
              overflowY: "auto", padding: "12px 16px 0",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {FIELDS.map(({ label, key, icon }) => (
                <div key={key} className="profile-field" style={{
                  padding: "10px 14px", borderRadius: 12,
                  background: C.cardAlt, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ color: C.red, flexShrink: 0, opacity: .8 }}>
                    {Icons[icon]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: ".55rem", fontWeight: 700, color: C.gray,
                      textTransform: "uppercase", letterSpacing: .6,
                      fontFamily: "Archivo, sans-serif", marginBottom: 2,
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: ".82rem", fontWeight: 600, color: C.white,
                      fontFamily: "Archivo, sans-serif",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {loading ? "—" : (userData?.[key] || "—")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign Out */}
            <div style={{ padding: 16 }}>
              <button
                className="signout-btn"
                onClick={() => { onClose(); onSignOut?.(); }}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  background: C.cardHover,
                  color: C.white,
                  fontSize: ".82rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "Archivo, sans-serif",
                  letterSpacing: .3,
                  border: `1px solid ${C.border}`,
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
