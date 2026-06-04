// ── NotificationPanel.jsx ─────────────────────────────────
// لوحة الإشعارات - بتنزلق من الشمال
//
// Props:
//   open      {boolean}  - هل اللوحة مفتوحة؟
//   onClose   {function} - لما يغلق
//   notifs    {array}    - مصفوفة الإشعارات:
//               [{ id, text, time, color, unread }]
//   onMarkAll {function} - لما يضغط "Mark all as read"
//
// Example usage:
//   import NotificationPanel from "./NotificationPanel";
//
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [notifs, setNotifs] = useState(NOTIFICATIONS);
//   const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
//
//   <NotificationPanel
//     open={notifOpen}
//     onClose={() => setNotifOpen(false)}
//     notifs={notifs}
//     onMarkAll={markAllRead}
//   />

export default function NotificationPanel({ open, onClose, notifs = [], onMarkAll }) {
  const unread = notifs.filter(n => n.unread).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(30,27,75,.35)", backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity .3s",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0,
        left: open ? 0 : "-100%",
        bottom: 0,
        width: "min(320px, 88vw)", zIndex: 301,
        background: "#fff", borderRight: "1px solid #e8eaf6",
        boxShadow: "8px 0 40px rgba(79,70,229,.12)",
        transition: "left .35s cubic-bezier(.4,0,.2,1)",
        display: "flex", flexDirection: "column",
        fontFamily: "Inter,sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "48px 20px 18px",
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
        }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff" }}>
            Notifications
          </div>
          {unread > 0 && (
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.7)", marginTop: 4 }}>
              {unread} unread &nbsp;·&nbsp;
              <span
                onClick={onMarkAll}
                style={{ color: "#fde68a", cursor: "pointer", fontWeight: 700 }}
              >
                Mark all as read
              </span>
            </div>
          )}
        </div>

        {/* List */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 12,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {notifs.length === 0 && (
            <div style={{
              textAlign: "center", padding: "40px 0",
              color: "#94a3b8", fontSize: ".85rem", fontWeight: 600,
            }}>
              No notifications 🎉
            </div>
          )}
          {notifs.map(n => (
            <div key={n.id} style={{
              padding: "12px 14px", borderRadius: 14,
              background: n.unread ? "#f5f7ff" : "#fff",
              border: `1px solid ${n.unread ? "#e0e7ff" : "#f1f5f9"}`,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: n.unread ? n.color : "transparent",
                flexShrink: 0, marginTop: 5,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: ".8rem",
                  fontWeight: n.unread ? 700 : 500,
                  color: "#1e1b4b", lineHeight: 1.4,
                }}>
                  {n.text}
                </div>
                <div style={{ fontSize: ".65rem", color: "#94a3b8", marginTop: 4 }}>
                  {n.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: "1px solid #e8eaf6" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: 12,
              background: "#eef1fb", border: "none",
              color: "#4f46e5", borderRadius: 12,
              fontFamily: "Inter,sans-serif",
              fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
