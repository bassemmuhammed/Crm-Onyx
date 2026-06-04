// ── ProfileModal.jsx ──────────────────────────────────────
// الملف الشخصي - bottom sheet قابل للتعديل
//
// Props:
//   open    {boolean}  - هل الـ modal مفتوح؟
//   onClose {function} - لما يغلق
//
// Example usage:
//   import ProfileModal from "./ProfileModal";
//
//   const [profileOpen, setProfileOpen] = useState(false);
//   <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

import { useState } from "react";
import Icons from "./Icons";

const DEFAULT_FORM = {
  name:   "Ahmed Hassan",
  email:  "ahmed@onyxcrm.com",
  phone:  "+20 101 234 5678",
  region: "Cairo — New Capital",
  title:  "Senior Broker",
};

const FIELDS = [
  { label: "Full Name",  key: "name",   icon: "user"      },
  { label: "Email",      key: "email",  icon: "sparkle"   },
  { label: "Phone",      key: "phone",  icon: "phoneCall" },
  { label: "Region",     key: "region", icon: "house"     },
  { label: "Job Title",  key: "title",  icon: "chart"     },
];

export default function ProfileModal({ open, onClose, onSignOut }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [saved, setSaved]     = useState(false);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "all" : "none",
      transition: "opacity .25s",
      fontFamily: "Inter,sans-serif",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(30,27,75,.45)", backdropFilter: "blur(6px)",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 430,
        background: "#fff", borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 48px rgba(79,70,229,.18)",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh", overflow: "hidden",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e8eaf6" }} />
        </div>

        {/* Avatar card */}
        <div style={{
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
          padding: "20px 22px 24px", margin: "10px 16px 0", borderRadius: 18,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "rgba(255,255,255,.2)",
            border: "2px solid rgba(255,255,255,.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", fontWeight: 900, color: "#fff", flexShrink: 0,
          }}>
            {form.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>
              {form.name}
            </div>
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.7)", marginTop: 2 }}>
              {form.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: ".65rem", color: "rgba(255,255,255,.75)" }}>Active now</span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{
          overflowY: "auto", padding: "16px 16px 0",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {FIELDS.map(({ label, key, icon }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                fontSize: ".65rem", fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: 0.5,
              }}>
                {label}
              </div>
              {editing ? (
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    padding: "10px 14px", borderRadius: 12,
                    fontSize: ".88rem", fontWeight: 600,
                    border: "1.5px solid #c7d2fe", outline: "none",
                    color: "#1e1b4b", fontFamily: "Inter,sans-serif",
                    background: "#f5f7ff",
                  }}
                />
              ) : (
                <div style={{
                  padding: "10px 14px", borderRadius: 12,
                  fontSize: ".88rem", fontWeight: 600,
                  background: "#f8f9ff", border: "1px solid #e8eaf6",
                  color: "#1e1b4b", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ color: "#4f46e5", flexShrink: 0 }}>{Icons[icon]}</span>
                  {form[key]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {saved && (
            <div style={{
              textAlign: "center", fontSize: ".78rem",
              color: "#10b981", fontWeight: 700, padding: "4px 0",
            }}>
              ✓ Profile saved successfully
            </div>
          )}

          {editing ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  border: "1px solid #e8eaf6", background: "#f8f9ff",
                  color: "#94a3b8", fontFamily: "Inter,sans-serif",
                  fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 2, padding: 12, borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  color: "#fff", fontFamily: "Inter,sans-serif",
                  fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
                }}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                width: "100%", padding: 12, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "#fff", fontFamily: "Inter,sans-serif",
                fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              Edit Profile
            </button>
          )}

          <button
            onClick={() => {
              sessionStorage.setItem("loggedIn", "false");
              onClose();
              onSignOut?.();
            }}
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              background: "#fee2e2", border: "1px solid rgba(239,68,68,.2)",
              color: "#ef4444", fontFamily: "Inter,sans-serif",
              fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {Icons.signOut} Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
