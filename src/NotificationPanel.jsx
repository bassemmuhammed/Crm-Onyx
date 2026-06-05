// ── NotificationPanel.jsx — ONYX Design System ───────────────────
// يقرأ من NotificationContext — مفيش props للـ notifs تاني

import { useNotifications } from "./NotificationContext";

const C = {
  surface: "#0A0A0A", card: "#111111", border: "#1E1E1E",
  cardAlt: "#1A1A1A", gray: "#595A5F", silver: "#CECECE",
  white: "#FFFFFF", red: "#CC1515",
};

const STYLES = `
  @keyframes notif-drop {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);   }
  }
  .notif-panel {
    animation: notif-drop .2s cubic-bezier(.4,0,.2,1) both;
    font-family: 'Archivo', sans-serif;
  }
  .notif-item { transition: background .15s; cursor: pointer; }
  .notif-item:active { background: #1e1e1e !important; }
`;

export default function NotificationPanel({ open, onClose }) {
  const { notifs, unreadCount, markAllRead, markRead, loading } = useNotifications();

  if (!open) return null;

  const handleMarkAll = () => { markAllRead(); };
  const handleItem    = (n) => { if (n.unread) markRead(n.id); };

  return (
    <>
      <style>{STYLES}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 400, background: "transparent" }}
      />

      {/* Panel */}
      <div
        className="notif-panel"
        style={{
          position: "fixed",
          top: 62,
          right: 12,
          width: "min(340px, calc(100vw - 24px))",
          zIndex: 401,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(204,21,21,.08)",
          overflow: "hidden",
        }}
      >
        {/* Arrow */}
        <div style={{
          position: "absolute", top: -7, right: 22,
          width: 13, height: 13,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderBottom: "none", borderRight: "none",
          transform: "rotate(45deg)",
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: ".78rem", fontWeight: 800, color: C.white,
              textTransform: "uppercase", letterSpacing: .6,
            }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <div style={{
                background: C.red, color: C.white,
                fontSize: ".5rem", fontWeight: 900,
                width: 16, height: 16, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {unreadCount}
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <span
              onClick={handleMarkAll}
              style={{
                fontSize: ".62rem", fontWeight: 700, color: C.red,
                cursor: "pointer", letterSpacing: .3,
              }}
            >
              Mark all read
            </span>
          )}
        </div>

        {/* List */}
        <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.gray, fontSize: ".78rem", fontWeight: 600 }}>
              Loading…
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.gray, fontSize: ".78rem", fontWeight: 600 }}>
              No notifications 🎉
            </div>
          ) : notifs.map((n, i) => (
            <div
              key={n.id}
              className="notif-item"
              onClick={() => handleItem(n)}
              style={{
                padding: "12px 16px",
                borderBottom: i < notifs.length - 1 ? `1px solid ${C.border}` : "none",
                background: n.unread ? "#151515" : C.card,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: n.unread ? n.color : C.gray,
                flexShrink: 0, marginTop: 4,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: ".78rem", fontWeight: n.unread ? 700 : 500,
                  color: n.unread ? C.white : C.silver,
                  lineHeight: 1.45,
                }}>
                  {n.text}
                </div>
                <div style={{ fontSize: ".62rem", color: C.gray, fontWeight: 600, marginTop: 3 }}>
                  {n.time}
                </div>
              </div>

              {n.unread && (
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: C.red, flexShrink: 0, marginTop: 4,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
          <span
            onClick={onClose}
            style={{ fontSize: ".65rem", fontWeight: 700, color: C.gray, cursor: "pointer", letterSpacing: .3 }}
          >
            Close
          </span>
        </div>
      </div>
    </>
  );
}
