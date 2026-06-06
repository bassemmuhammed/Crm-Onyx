// ── HomePage.jsx — ONYX Design System ────────────────────────────────
// الصفحة الرئيسية - ONYX CRM
//
// Props:
//   activeTab      {number}
//   onTabChange    {function}
//   onSignOut      {function}
//   onLeadsFilter  {function}  — called when a stat card is tapped
//   leads          {array}     — optional: live leads data
//   tasks          {array}     — optional: live tasks data

import { useState, useEffect, useRef } from "react";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import Icons             from "./Icons";

// ─── ONYX Design Tokens ───────────────────────────────────────────────
const C = {
  black:     "#000000",
  surface:   "#0D0D0D",
  card:      "#161618",
  border:    "#2A2A2E",
  cardAlt:   "#1E1E22",
  cardHover: "#2E2E34",
  gray:      "#6B6C73",
  silver:    "#CECECE",
  white:     "#FFFFFF",
  red:       "#CC1515",
  redLight:  "#FF2020",
  blue:      "#253FF6",
  // Card gradient variants for daylight separation
  cardGrad1: "linear-gradient(145deg,#1A1A1E 0%,#141416 100%)",
  cardGrad2: "linear-gradient(145deg,#1C1C22 0%,#141418 100%)",
};

// ─── Global Styles ────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";

const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  html, body { margin:0; padding:0; background:#0D0D0D; overflow-x:hidden; }
  *, *::before, *::after { -webkit-tap-highlight-color:transparent; box-sizing:border-box; color-scheme:dark; -webkit-user-select:none; user-select:none; }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp   { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes barGrow   { from{width:0%} to{width:var(--bar-w)} }
  @keyframes pulse2    { 0%,100%{opacity:1} 50%{opacity:.4} }
  .fade-up  { animation: fadeInUp .3s ease both; }
  .tap-btn  { transition: all .15s ease; }
  .tap-btn:active  { transform: scale(.94); }
  .stat-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
  .stat-card:active { transform: scale(.96); }
  .task-row { transition: opacity .2s, border-color .2s; }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
`;

// ─── Helpers ──────────────────────────────────────────────────────────
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
  return null;
}

function scheduleTaskNotifications(tasks) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "denied") return;
  const request = () => {
    tasks.forEach(task => {
      if (task.done) return;
      const dueDate = parseDueDate(task.due);
      if (!dueDate) return;
      const notifyAt = new Date(dueDate.getTime() - 60 * 60 * 1000);
      const delay = notifyAt.getTime() - Date.now();
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
    Notification.requestPermission().then(p => { if (p === "granted") request(); });
  }
}

// ─── Stats Definition ─────────────────────────────────────────────────
const STATS_TEMPLATE = [
  { label: "All Leads",       filter: null,              icon: "sparkle",       color: "#4f46e5", target: 0, pct: 0, trend: "", up: null },
  { label: "New Leads",       filter: "New",             icon: "sparkle",       color: "#10b981", target: 0, pct: 0, trend: "", up: null },
  { label: "Call Back",       filter: "Call Back",       icon: "phoneCall",     color: "#f59e0b", target: 0, pct: 0, trend: "", up: null },
  { label: "Pending Meeting", filter: "Pending Meeting", icon: "calendarCheck", color: "#8b5cf6", target: 0, pct: 0, trend: "", up: null },
  { label: "Meeting Done",    filter: "Meeting Done",    icon: "calendarCheck", color: "#10b981", target: 0, pct: 0, trend: "", up: null },
  { label: "Deal",            filter: "Deal",            icon: "handshake",     color: C.redLight, target: 0, pct: 0, trend: "", up: null },
  { label: "On Going",        filter: "On Going",        icon: "hourglass",     color: "#ec4899", target: 0, pct: 0, trend: "", up: null },
  { label: "Low Budget",      filter: "Low Budget",      icon: "bar",           color: "#f97316", target: 0, pct: 0, trend: "", up: null },
  { label: "No Answer",       filter: "No Answer",       icon: "phoneCall",     color: "#94a3b8", target: 0, pct: 0, trend: "", up: null },
  { label: "Not Interested",  filter: "Not Interested",  icon: "snowflake",     color: "#0ea5e9", target: 0, pct: 0, trend: "", up: null },
  { label: "Competitor",      filter: "Competitor",      icon: "flag",          color: C.red,     target: 0, pct: 0, trend: "", up: null },
  { label: "Long Term",       filter: "Long Term",       icon: "hourglass",     color: "#7c3aed", target: 0, pct: 0, trend: "", up: null },
  { label: "Closed",          filter: "Closed",          icon: "checkSquare",   color: "#64748b", target: 0, pct: 0, trend: "", up: null },
];

const PRIORITY_COLOR = { high: C.red, medium: "#f59e0b", low: "#0ea5e9" };
const PRIORITY_LABEL = { high: "HIGH", medium: "MED", low: "LOW" };

const NOTIFICATIONS_DEFAULT = [];
const TASKS_DEFAULT = [];

// ─── Divider ──────────────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    {label && (
      <span style={{ fontSize:".55rem", fontWeight:700, color:C.gray, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>
        {label}
      </span>
    )}
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────
function SectionHeader({ title, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <div style={{ width:4, height:14, borderRadius:99, background:C.red }} />
        <span style={{ fontSize:".78rem", fontWeight:800, color:C.silver, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({ s, animate, onLeadsFilter, delay = 0, index = 0 }) {
  const val = useCounter(s.target, animate);
  const [barW, setBarW] = useState("0%");

  useEffect(() => {
    if (animate) setTimeout(() => setBarW(s.pct + "%"), 500);
  }, [animate, s.pct]);

  // Alternate card backgrounds for visual separation in daylight
  const cardBg = index % 2 === 0 ? C.cardGrad1 : C.cardGrad2;

  return (
    <div
      className="stat-card fade-up"
      onClick={() => onLeadsFilter && onLeadsFilter(s.filter)}
      style={{
        background: cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "13px 13px 11px",
        cursor: "pointer",
        animationDelay: `${delay}ms`,
        fontFamily: "Archivo,sans-serif",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Corner accent lines — top-left and top-right only */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 22, height: 3, borderRadius: "0 0 3px 0",
        background: s.color,
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 3, height: 22, borderRadius: "0 0 3px 0",
        background: s.color,
      }} />
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 22, height: 3, borderRadius: "0 0 0 3px",
        background: s.color,
      }} />
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 3, height: 22, borderRadius: "0 0 0 3px",
        background: s.color,
      }} />

      {/* Icon + Label */}
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${s.color}22`,
          border: `1px solid ${s.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: s.color, flexShrink: 0,
        }}>
          {Icons[s.icon]}
        </div>
        <span style={{ fontSize:".6rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.5 }}>
          {s.label}
        </span>
      </div>

      {/* Count */}
      <div style={{ fontSize:"1.9rem", fontWeight:900, color:C.white, lineHeight:1, letterSpacing:-1 }}>
        {val}
      </div>

      {/* Trend */}
      {s.trend && (
        <div style={{ fontSize:".58rem", color:s.color, fontWeight:700, marginTop:4, display:"flex", alignItems:"center", gap:3 }}>
          {s.trend}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginTop:10, height:3, borderRadius:99, background:C.border, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:99, background:s.color,
          width: barW, transition:"width 1.2s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────
function TaskCard({ t, onToggle }) {
  return (
    <div
      className="task-row"
      onClick={onToggle}
      style={{
        background: C.cardGrad2,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer",
        opacity: t.done ? 0.55 : 1,
        fontFamily: "Archivo,sans-serif",
        boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: t.done ? C.red : C.cardAlt,
        border: `1.5px solid ${t.done ? C.red : C.border}`,
        color: t.done ? C.white : C.gray,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .2s",
        fontSize: ".7rem",
      }}>
        {t.done ? Icons.checkSquare : Icons.circle}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontWeight: 700, fontSize: ".85rem", color: t.done ? C.gray : C.white,
          textDecoration: t.done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "all .2s",
        }}>{t.title}</div>
        <div style={{ display:"flex", gap:7, marginTop:4, alignItems:"center" }}>
          <div style={{ fontSize:".6rem", color:C.gray, display:"flex", alignItems:"center", gap:3 }}>
            {Icons.calendar} {t.due}
          </div>
          <div style={{
            fontSize:".55rem", padding:"2px 7px", borderRadius:4, fontWeight:800,
            background:`${PRIORITY_COLOR[t.priority] || C.red}18`,
            color: PRIORITY_COLOR[t.priority] || C.red,
            letterSpacing:.4,
          }}>
            {PRIORITY_LABEL[t.priority] || "—"}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        width:28, height:28, borderRadius:7,
        background: t.done ? `${C.red}18` : C.cardAlt,
        display:"flex", alignItems:"center", justifyContent:"center",
        color: t.done ? C.red : C.gray, flexShrink:0,
        transition:"all .2s",
      }}>
        {t.done ? Icons.checkSquare : Icons.caretRight}
      </div>
    </div>
  );
}

// ─── All Tasks Modal ──────────────────────────────────────────────────
function AllTasksModal({ open, onClose, tasks, onToggle }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? tasks
    : filter === "done"    ? tasks.filter(t => t.done)
    : tasks.filter(t => !t.done);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
      transition:"opacity .25s",
    }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.72)", backdropFilter:"blur(6px)" }} />
      <div style={{
        position:"relative", zIndex:1, width:"100%", maxWidth:430,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius:"20px 20px 0 0",
        boxShadow: `0 -8px 48px rgba(204,21,21,.18)`,
        display:"flex", flexDirection:"column", maxHeight:"88vh",
        fontFamily:"Archivo,sans-serif",
      }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
          <div style={{ width:36, height:3, borderRadius:99, background:C.border }} />
        </div>

        {/* Header */}
        <div style={{ padding:"12px 18px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:4, height:16, borderRadius:99, background:C.red }} />
            <span style={{ fontSize:"1rem", fontWeight:900, color:C.white }}>All Tasks</span>
            <div style={{
              background:`${C.red}18`, border:`1px solid ${C.red}44`,
              color:C.red, fontSize:".62rem", fontWeight:800, padding:"2px 8px", borderRadius:4,
            }}>
              {done}/{total}
            </div>
          </div>
          <div onClick={onClose} style={{ fontSize:".72rem", color:C.gray, fontWeight:700, cursor:"pointer", padding:"4px 6px" }}>✕</div>
        </div>

        {/* Progress */}
        <div style={{ height:3, background:C.border, overflow:"hidden", margin:"0 18px" }}>
          <div style={{
            height:"100%", background:C.red,
            width: total > 0 ? `${(done/total)*100}%` : "0%",
            transition:"width .5s",
          }} />
        </div>

        {/* Filter chips */}
        <div style={{ display:"flex", gap:6, padding:"12px 18px 0" }}>
          {["all", "pending", "done"].map(f => (
            <button key={f} className="chip-btn" onClick={() => setFilter(f)} style={{
              padding:"5px 12px", borderRadius:6,
              border:`1px solid ${filter===f ? C.red+"66" : C.border}`,
              background: filter===f ? `${C.red}18` : C.cardAlt,
              color: filter===f ? C.white : C.gray,
              fontFamily:"Archivo,sans-serif", fontSize:".65rem", fontWeight:700, cursor:"pointer",
            }}>
              {f === "all" ? `All (${total})` : f === "done" ? `Done (${done})` : `Pending (${total-done})`}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div style={{ overflowY:"auto", padding:"12px 14px 24px", display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px 0", color:C.gray, fontSize:".82rem", fontWeight:600 }}>
              No tasks here 🎉
            </div>
          )}
          {filtered.map(t => (
            <TaskCard key={t.id} t={t} onToggle={() => onToggle(t.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────
export default function HomePage({
  activeTab = 0,
  onTabChange,
  onSignOut,
  onLeadsFilter,
  leads: leadsFromProps,
  tasks: tasksFromProps,
}) {
  const [animate,      setAnimate]      = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [viewAllOpen,  setViewAllOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [tasks,        setTasks]        = useState(tasksFromProps || TASKS_DEFAULT);
  const [notifs,       setNotifs]       = useState(NOTIFICATIONS_DEFAULT);

  // Freeze scroll when modal is open
  useEffect(() => {
    const anyOpen = viewAllOpen || profileOpen || notifOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [viewAllOpen, profileOpen, notifOpen]);

  // Schedule notifications
  useEffect(() => {
    if (tasks.length === 0) return;
    scheduleTaskNotifications(tasks);
  }, [tasks]);

  // Trigger animate on mount
  useEffect(() => {
    setTimeout(() => setAnimate(true), 150);
  }, []);

  // Inject styles once
  useEffect(() => {
    const id = "onyx-home-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const toggleTask  = id => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const markAllRead = ()  => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  const doneTasks   = tasks.filter(t => t.done).length;
  const totalTasks  = tasks.length;

  const handleLeadsFilter = filterKey => {
    if (onLeadsFilter) onLeadsFilter(filterKey);
    if (onTabChange)   onTabChange(1);
  };

  return (
    <div style={{
      fontFamily: "Archivo,sans-serif",
      background: C.surface,
      minHeight: "100vh",
      color: C.white,
      width: "100%",
      position: "relative",
      userSelect: "none",
      WebkitUserSelect: "none",
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
      <div style={{ padding:"16px 14px 110px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── Stats Section ── */}
        <div>
          <SectionHeader title="Lead Overview" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {STATS_TEMPLATE.map((s, i) => (
              <StatCard
                key={i}
                s={s}
                animate={animate}
                onLeadsFilter={handleLeadsFilter}
                delay={i * 30}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ── Tasks Section ── */}
        <div
          className="fade-up"
          style={{
            background: C.cardGrad1,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            animationDelay: "200ms",
            boxShadow: "0 2px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
            position: "relative",
          }}
        >
          {/* Corner accents top-left and top-right */}
          <div style={{ position:"absolute", top:0, left:0, width:22, height:3, background:C.red, borderRadius:"0 0 3px 0" }} />
          <div style={{ position:"absolute", top:0, left:0, width:3, height:22, background:C.red, borderRadius:"0 0 3px 0" }} />
          <div style={{ position:"absolute", top:0, right:0, width:22, height:3, background:C.red, borderRadius:"0 0 0 3px" }} />
          <div style={{ position:"absolute", top:0, right:0, width:3, height:22, background:C.red, borderRadius:"0 0 0 3px" }} />
          {/* Section Title Bar */}
          <div style={{
            padding:"10px 14px 9px",
            borderBottom:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
              <span style={{ fontSize:".72rem", fontWeight:800, color:C.silver, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>
                My Tasks
              </span>
              <div style={{
                background:`${C.red}18`, border:`1px solid ${C.red}44`,
                color:C.red, fontSize:".58rem", fontWeight:800,
                padding:"2px 7px", borderRadius:4,
                fontFamily:"Archivo,sans-serif",
              }}>
                {doneTasks}/{totalTasks}
              </div>
            </div>
            <div
              className="tap-btn"
              onClick={() => setViewAllOpen(true)}
              style={{ fontSize:".68rem", color:C.red, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}
            >
              View all {Icons.caretRight}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height:3, background:C.border, overflow:"hidden" }}>
            <div style={{
              height:"100%", background:C.red,
              width: totalTasks > 0 ? `${(doneTasks/totalTasks)*100}%` : "0%",
              transition:"width .6s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>

          {/* Task List */}
          <div style={{ padding:"10px 12px 12px", display:"flex", flexDirection:"column", gap:8 }}>
            {tasks.slice(0,4).map(t => (
              <TaskCard key={t.id} t={t} onToggle={() => toggleTask(t.id)} />
            ))}
            {tasks.length === 0 && (
              <div style={{
                textAlign:"center", padding:"28px 0",
                color:C.gray, fontSize:".82rem", fontWeight:700,
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                fontFamily:"Archivo,sans-serif",
              }}>
                <div style={{ fontSize:"1.4rem" }}>🎉</div>
                No tasks yet — you're all caught up!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
