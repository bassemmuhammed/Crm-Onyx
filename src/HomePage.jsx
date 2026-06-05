import { useState, useEffect, useRef } from "react";

import Icons             from "./Icons";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";


// ── Helpers ───────────────────────────────────────────────

function useCounter(target, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let c = 0;
    const step = Math.ceil(target / 20);
    const id = setInterval(() => {
      c = Math.min(c + step, target);
      setVal(c);
      if (c >= target) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [target, active]);
  return val;
}

// ── Task Due-Date Notification (1 hour before) ────────────
function scheduleTaskNotifications(tasks) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "denied") return;

  const request = () => {
    tasks.forEach((task) => {
      if (task.done) return;
      const dueDate = parseDueDate(task.due);
      if (!dueDate) return;
      const notifyAt = new Date(dueDate.getTime() - 60 * 60 * 1000);
      const delay    = notifyAt.getTime() - Date.now();
      if (delay <= 0) return;
      setTimeout(() => {
        new Notification("Task Reminder ⏰", {
          body: `"${task.title}" is due in 1 hour (${task.due})`,
          icon: "/favicon.ico",
        });
      }, delay);
    });
  };

  if (Notification.permission === "granted") {
    request();
  } else {
    Notification.requestPermission().then((p) => {
      if (p === "granted") request();
    });
  }
}

function parseDueDate(due) {
  if (!due) return null;
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayMatch = due.match(/^Today,?\s+(\d+):?(\d*)\s*(AM|PM)/i);
  if (todayMatch) {
    let h = parseInt(todayMatch[1]);
    const m = parseInt(todayMatch[2] || "0");
    const ap = todayMatch[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
  }

  const tmrMatch = due.match(/^Tomorrow,?\s+(\d+):?(\d*)\s*(AM|PM)/i);
  if (tmrMatch) {
    let h = parseInt(tmrMatch[1]);
    const m = parseInt(tmrMatch[2] || "0");
    const ap = tmrMatch[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    return new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), h, m);
  }

  const dateMatch = due.match(/^([A-Za-z]+)\s+(\d+),?\s+(\d+):?(\d*)\s*(AM|PM)/i);
  if (dateMatch) {
    const monthStr = dateMatch[1];
    const day      = parseInt(dateMatch[2]);
    let h          = parseInt(dateMatch[3]);
    const m        = parseInt(dateMatch[4] || "0");
    const ap       = dateMatch[5].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const monthIndex = new Date(`${monthStr} 1`).getMonth();
    const year = now.getFullYear();
    return new Date(year, monthIndex, day, h, m);
  }

  return null;
}

// ── Stats Definition ──────────────────────────────────────
// "filter" matches the status key used in the Leads/Sales page.
// All Leads → filter: null (show all), New Leads → filter: "New"
const STATS = [
  { label: "All Leads",        filter: null,              target: 0, pct: 0, icon: "sparkle",       color: "#4f46e5", bg: "#ede9fe", trend: "", up: null },
  { label: "New Leads",        filter: "New",             target: 0, pct: 0, icon: "sparkle",       color: "#10b981", bg: "#d1fae5", trend: "", up: null },
  { label: "Call Back",        filter: "Call Back",       target: 0, pct: 0, icon: "phoneCall",     color: "#f59e0b", bg: "#fef3c7", trend: "", up: null },
  { label: "Pending Meeting",  filter: "Pending Meeting", target: 0, pct: 0, icon: "calendarCheck", color: "#8b5cf6", bg: "#ede9fe", trend: "", up: null },
  { label: "Meeting Done",     filter: "Meeting Done",    target: 0, pct: 0, icon: "calendarCheck", color: "#10b981", bg: "#d1fae5", trend: "", up: null },
  { label: "Deal",             filter: "Deal",            target: 0, pct: 0, icon: "handshake",     color: "#ef4444", bg: "#fee2e2", trend: "", up: null },
  { label: "On Going",         filter: "On Going",        target: 0, pct: 0, icon: "hourglass",     color: "#ec4899", bg: "#fce7f3", trend: "", up: null },
  { label: "Low Budget",       filter: "Low Budget",      target: 0, pct: 0, icon: "bar",           color: "#f97316", bg: "#fff3e8", trend: "", up: null },
  { label: "No Answer",        filter: "No Answer",       target: 0, pct: 0, icon: "phoneCall",     color: "#94a3b8", bg: "#f1f5f9", trend: "", up: null },
  { label: "Not Interested",   filter: "Not Interested",  target: 0, pct: 0, icon: "snowflake",     color: "#0ea5e9", bg: "#e0f2fe", trend: "", up: null },
  { label: "Competitor",       filter: "Competitor",      target: 0, pct: 0, icon: "flag",          color: "#dc2626", bg: "#fee2e2", trend: "", up: null },
  { label: "Long Term",        filter: "Long Term",       target: 0, pct: 0, icon: "hourglass",     color: "#7c3aed", bg: "#f5f3ff", trend: "", up: null },
  { label: "Closed",           filter: "Closed",          target: 0, pct: 0, icon: "checkSquare",   color: "#64748b", bg: "#f1f5f9", trend: "", up: null },
];

const TASKS         = [];
const NOTIFICATIONS = [];

const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#0ea5e9" };
const PRIORITY_BG    = { high: "#fee2e2", medium: "#fef3c7", low: "#e0f2fe" };

// ── Stat Card ─────────────────────────────────────────────
// onClick navigates to the Sales/Leads page with the status pre-filtered.
// Pass onLeadsFilter(filterKey) from the parent to handle navigation.

function StatCard({ s, animate, onLeadsFilter }) {
  const val  = useCounter(s.target, animate);
  const [barW, setBarW] = useState("0%");
  const [pressed, setPressed] = useState(false);

  useEffect(() => { if (animate) setTimeout(() => setBarW(s.pct + "%"), 400); }, [animate]);

  const TrendIcon = s.up === true ? Icons.trendUp : s.up === false ? Icons.trendDown : Icons.minus;

  const handleClick = () => {
    if (onLeadsFilter) onLeadsFilter(s.filter);
  };

  return (
    <div
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: "#fff",
        border: `1.5px solid ${pressed ? s.color + "66" : "#e8eaf6"}`,
        borderRadius: 18,
        padding: 16,
        cursor: "pointer",
        boxShadow: pressed
          ? `0 4px 20px ${s.color}22`
          : "0 2px 16px rgba(79,70,229,.07)",
        transform: pressed ? "scale(.97)" : "scale(1)",
        transition: "transform .15s, box-shadow .15s, border-color .15s",
        userSelect: "none",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: s.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10, color: s.color,
      }}>
        {Icons[s.icon]}
      </div>
      <div style={{ fontSize: ".68rem", color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>
        {s.label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>
        {val}
      </div>
      {s.trend && (
        <div style={{ fontSize: ".6rem", color: s.color, fontWeight: 700, marginTop: 5, display: "flex", alignItems: "center", gap: 3 }}>
          <span>{TrendIcon}</span> {s.trend}
        </div>
      )}
      <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: "#eef1fb", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99, background: s.color,
          width: barW, transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────

function TaskCard({ t, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      background: "#fff", border: "1px solid #e8eaf6", borderRadius: 18,
      padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
      cursor: "pointer", boxShadow: "0 2px 12px rgba(79,70,229,.06)",
      borderLeft: `3px solid ${t.done ? "#94a3b8" : t.color}`,
      opacity: t.done ? 0.65 : 1, transition: "all .2s", userSelect: "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: t.done ? "#4f46e5" : "#eef1fb",
        color: t.done ? "#fff" : "#94a3b8",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .2s",
      }}>
        {t.done ? Icons.checkSquare : Icons.circle}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: ".88rem", color: "#1e1b4b",
          textDecoration: t.done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "all .2s",
        }}>{t.title}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
          <div style={{ fontSize: ".65rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
            {Icons.calendar} {t.due}
          </div>
          <div style={{
            fontSize: ".58rem", padding: "2px 7px", borderRadius: 99, fontWeight: 700,
            background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority],
            textTransform: "capitalize",
          }}>{t.priority}</div>
        </div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: t.done ? "#ede9fe" : "#eef1fb",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: t.done ? "#4f46e5" : "#94a3b8", flexShrink: 0,
        transition: "all .2s",
      }}>{t.done ? Icons.checkSquare : Icons.caretRight}</div>
    </div>
  );
}

// ── All Tasks Modal ───────────────────────────────────────

function AllTasksModal({ open, onClose, tasks, onToggle }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? tasks
    : filter === "done"    ? tasks.filter(t => t.done)
    : tasks.filter(t => !t.done);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
      transition: "opacity .25s",
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(30,27,75,.45)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 430,
        background: "#f5f7ff", borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 48px rgba(79,70,229,.18)",
        display: "flex", flexDirection: "column", maxHeight: "88vh",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e8eaf6" }} />
        </div>

        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1e1b4b" }}>All Tasks</div>
            <div style={{ background: "#ede9fe", color: "#4f46e5", fontSize: ".62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
              {done}/{total}
            </div>
          </div>
          <div onClick={onClose} style={{ fontSize: ".75rem", color: "#94a3b8", fontWeight: 600, cursor: "pointer" }}>✕ Close</div>
        </div>

        <div style={{ height: 4, borderRadius: 99, background: "#eef1fb", overflow: "hidden", margin: "0 20px" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
            width: total > 0 ? `${(done / total) * 100}%` : "0%",
            transition: "width .5s",
          }} />
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 20px 0" }}>
          {["all", "pending", "done"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
              background: filter === f ? "#4f46e5" : "#fff",
              color: filter === f ? "#fff" : "#94a3b8",
              fontFamily: "Inter,sans-serif", fontSize: ".72rem", fontWeight: 700,
              boxShadow: filter === f ? "0 4px 12px rgba(79,70,229,.3)" : "0 1px 4px rgba(0,0,0,.06)",
              textTransform: "capitalize",
            }}>
              {f === "all" ? `All (${total})` : f === "done" ? `Done (${tasks.filter(t => t.done).length})` : `Pending (${tasks.filter(t => !t.done).length})`}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: ".85rem", fontWeight: 600 }}>
              No tasks here 🎉
            </div>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => onToggle(t.id)}
              style={{
                background: "#fff", border: "1px solid #e8eaf6", borderRadius: 18,
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(79,70,229,.06)",
                borderLeft: `3px solid ${t.done ? "#94a3b8" : t.color}`,
                opacity: t.done ? 0.65 : 1, transition: "all .2s", userSelect: "none",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: t.done ? "#4f46e5" : "#eef1fb",
                color: t.done ? "#fff" : "#94a3b8",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}>
                {t.done ? Icons.checkSquare : Icons.circle}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: ".88rem", color: "#1e1b4b",
                  textDecoration: t.done ? "line-through" : "none",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  transition: "all .2s",
                }}>{t.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                  <div style={{ fontSize: ".65rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                    {Icons.calendar} {t.due}
                  </div>
                  <div style={{
                    fontSize: ".58rem", padding: "2px 7px", borderRadius: 99, fontWeight: 700,
                    background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority],
                    textTransform: "capitalize",
                  }}>{t.priority}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────
// Props:
//   activeTab, onTabChange, onSignOut   — same as before
//   onLeadsFilter(filterKey)            — NEW: called when a stat card is tapped.
//     filterKey is null (All Leads) or a status string e.g. "Call Back".
//     The parent (App.jsx) should navigate to the Sales/Leads tab and pass
//     the filterKey down so the list pre-filters to that status.

export default function HomePage({ activeTab = 0, onTabChange, onSignOut, onLeadsFilter }) {
  const [animate, setAnimate]         = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [tasks, setTasks]             = useState(TASKS);
  const [notifs, setNotifs]           = useState(NOTIFICATIONS);

  // Freeze background scroll when any modal is open
  useEffect(() => {
    const anyOpen = viewAllOpen || profileOpen || notifOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [viewAllOpen, profileOpen, notifOpen]);

  // Schedule 1-hour-before notifications whenever tasks change
  const scheduledRef = useRef(false);
  useEffect(() => {
    if (tasks.length === 0) return;
    scheduleTaskNotifications(tasks);
  }, [tasks]);

  // Trigger counting animation on mount
  useEffect(() => {
    setTimeout(() => setAnimate(true), 200);
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const toggleTask  = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  const doneTasks   = tasks.filter(t => t.done).length;
  const totalTasks  = tasks.length;

  // ── Handle stat card tap → navigate to leads with filter ──
  const handleLeadsFilter = (filterKey) => {
    // Call parent handler first (navigate to Leads tab + set filter)
    if (onLeadsFilter) onLeadsFilter(filterKey);
    // Also switch tab to Leads (tab index 1 — adjust if different)
    if (onTabChange) onTabChange(1);
  };

  return (
    <div style={{
      fontFamily: "Inter,sans-serif", background: "#f5f7ff",
      minHeight: "100vh", color: "#1e1b4b", width: "100%", position: "relative",
      userSelect: "none", WebkitUserSelect: "none",
    }}>
      {/* ── Modals & Panels ── */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSignOut={onSignOut}
      />
      <AllTasksModal
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        tasks={tasks}
        onToggle={toggleTask}
      />
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={markAllRead}
      />

      {/* ── Header ── */}
      <AppHeader
        unreadCount={unreadCount}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ── Scroll Content ── */}
      <div style={{ padding: "22px 16px 110px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Stats Grid — 2 columns, all statuses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {STATS.map((s, i) => (
            <StatCard
              key={i}
              s={s}
              animate={animate}
              onLeadsFilter={handleLeadsFilter}
            />
          ))}
        </div>

        {/* Tasks Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: "1rem", fontWeight: 800 }}>My Tasks</div>
            <div style={{
              background: "#ede9fe", color: "#4f46e5",
              fontSize: ".62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            }}>{doneTasks}/{totalTasks}</div>
          </div>
          <div
            onClick={() => setViewAllOpen(true)}
            style={{ fontSize: ".75rem", color: "#4f46e5", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
          >
            View all {Icons.caretRight}
          </div>
        </div>

        {/* Tasks Progress Bar */}
        <div style={{ height: 5, borderRadius: 99, background: "#eef1fb", overflow: "hidden", marginTop: -8 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
            width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : "0%",
            transition: "width .6s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>

        {/* Tasks List (first 4) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.slice(0, 4).map(t => (
            <TaskCard key={t.id} t={t} onToggle={() => toggleTask(t.id)} />
          ))}
          {tasks.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: ".85rem", fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#c7d2fe" }}>{Icons.checkSquare}</span>
              No tasks yet
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
