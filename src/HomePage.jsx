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

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Icons             from "./Icons";
import { Phone, CalendarDays, Trash2, CheckSquare, Circle, ChevronRight, CheckCheck, ClipboardList, X } from "lucide-react";
import { LeadDetailModal } from "./LeadsPage";
import { updateLead as dbUpdateLead, supabase } from "./sharedLeadsData";

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
  @keyframes slideUp   { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes swipeDeleteReveal { from{opacity:0;transform:scaleX(0)} to{opacity:1;transform:scaleX(1)} }
  .fade-up  { animation: fadeInUp .3s ease both; }
  .tap-btn  { transition: all .15s ease; }
  .tap-btn:active  { transform: scale(.94); }
  .stat-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
  .stat-card:active { transform: scale(.96); }
  .task-row { transition: opacity .2s, border-color .2s; }
  .task-swipe-wrapper { position:relative; overflow:hidden; border-radius:12px; }
  .task-swipe-inner {
    transition: transform .25s cubic-bezier(.4,0,.2,1);
    touch-action: pan-y;
    will-change: transform;
  }
  .task-delete-bg {
    position:absolute; right:0; top:0; bottom:0;
    display:flex; align-items:center; justify-content:flex-end;
    padding-right:18px;
    background: linear-gradient(90deg, transparent 0%, #CC151588 30%, #CC1515 100%);
    border-radius:12px;
    min-width:80px;
    pointer-events:none;
  }
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
        new Notification("Task Reminder", {
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
  { label: "All Leads",       filterKey: "all",              icon: "sparkle",       color: "#4f46e5" },
  { label: "New Leads",       filterKey: "new",              icon: "sparkle",       color: "#10b981" },
  { label: "Call Back",       filterKey: "callback",         icon: "phoneCall",     color: "#f59e0b" },
  { label: "Pending Meeting", filterKey: "pendingMeeting",   icon: "calendarCheck", color: "#8b5cf6" },
  { label: "Meeting Done",    filterKey: "meetingDone",      icon: "calendarCheck", color: "#10b981" },
  { label: "Deal",            filterKey: "deal",             icon: "handshake",     color: C.redLight },
  { label: "On Going",        filterKey: "onGoing",          icon: "hourglass",     color: "#ec4899" },
  { label: "Low Budget",      filterKey: "lowBudget",        icon: "bar",           color: "#f97316" },
  { label: "No Answer",       filterKey: "noAnswer",         icon: "phoneCall",     color: "#94a3b8" },
  { label: "Not Interested",  filterKey: "notInterested",    icon: "snowflake",     color: "#0ea5e9" },
  { label: "Competitor",      filterKey: "chooseCompetitor", icon: "flag",          color: C.red     },
  { label: "Long Term",       filterKey: "longTerm",         icon: "hourglass",     color: "#7c3aed" },
  { label: "Closed",          filterKey: "closed",           icon: "checkSquare",   color: "#64748b" },
];

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
function StatCard({ s, count = 0, totalLeads = 0, animate, onLeadsFilter, delay = 0, index = 0 }) {
  const val = useCounter(count, animate);
  const pct  = totalLeads > 0 && s.filterKey !== "all" ? Math.round((count / totalLeads) * 100) : 0;
  const [barW, setBarW] = useState("0%");

  useEffect(() => {
    if (animate) setTimeout(() => setBarW(pct + "%"), 500);
  }, [animate, pct]);

  const cardBg = index % 2 === 0 ? C.cardGrad1 : C.cardGrad2;

  return (
    <div
      className="stat-card fade-up"
      onClick={() => onLeadsFilter && onLeadsFilter(s.filterKey)}
      style={{
        background: cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "11px 11px 9px",
        cursor: "pointer",
        animationDelay: `${delay}ms`,
        fontFamily: "Archivo,sans-serif",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: C.black,
          border: `1.5px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: s.color,
          fontSize: "1.1rem",
        }}>
          {Icons[s.icon]}
        </div>
        <div style={{ fontSize:"1.6rem", fontWeight:900, color:C.white, lineHeight:1, letterSpacing:-1 }}>
          {val}
        </div>
      </div>
      <div style={{ fontSize:".62rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.7 }}>
        {s.label}
      </div>
      <div style={{ marginTop:10, height:2, borderRadius:99, background:C.border, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:99, background:s.color,
          width: barW, transition:"width 1.2s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Swipeable Task Card ───────────────────────────────────────────────
// ✅ تعديل 1: Swipe to delete
// ✅ تعديل 3: إخفاء badge الـ MED/HIGH
// ✅ تعديل 4: أيقونات Lucide بدل الإيموجي
function SwipeableTaskCard({ t, onToggle, onDelete, onOpenLead }) {
  const [offsetX, setOffsetX]   = useState(0);
  const [swiping, setSwiping]   = useState(false);
  const [deleted, setDeleted]   = useState(false);
  const startXRef               = useRef(null);
  const DELETE_THRESHOLD        = 80;

  const leadBorderColor = t.isLead
    ? (t.priority === "high" ? "#8b5cf6" : "#f59e0b")
    : null;

  // ── Touch handlers ──
  const onTouchStart = e => {
    startXRef.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = e => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx < 0) setOffsetX(Math.max(dx, -120));
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX <= -DELETE_THRESHOLD) {
      // Animate out then call delete
      setDeleted(true);
      setTimeout(() => onDelete && onDelete(t.id), 280);
    } else {
      setOffsetX(0);
    }
    startXRef.current = null;
  };

  // Icon based on task type (lucide-react)
  const TaskIcon = t.isLead
    ? (t.priority === "high" ? <CalendarDays size={14} /> : <Phone size={14} />)
    : <ClipboardList size={14} />;

  if (deleted) return null;

  return (
    <div className="task-swipe-wrapper" style={{ opacity: deleted ? 0 : 1, transition:"opacity .28s" }}>
      {/* Delete BG revealed on swipe */}
      <div className="task-delete-bg" style={{ opacity: offsetX < -10 ? 1 : 0, transition:"opacity .2s" }}>
        <Trash2 size={18} color={C.white} />
      </div>

      {/* Card inner */}
      <div
        className="task-swipe-inner task-row"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform .25s cubic-bezier(.4,0,.2,1)",
          background: C.cardGrad2,
          border: `1px solid ${C.border}`,
          borderLeft: leadBorderColor ? `3px solid ${leadBorderColor}` : `1px solid ${C.border}`,
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
        onClick={onToggle}
      >
        {/* Checkbox */}
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: t.done ? C.red : C.cardAlt,
          border: `1.5px solid ${t.done ? C.red : C.border}`,
          color: t.done ? C.white : C.gray,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s",
        }}>
          {t.done
            ? <CheckSquare size={13} strokeWidth={2.5} />
            : <Circle size={13} strokeWidth={2} />
          }
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Title row with lucide icon */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color: leadBorderColor || C.gray, display:"flex", alignItems:"center", flexShrink:0 }}>
              {TaskIcon}
            </span>
            <div style={{
              fontWeight: 700, fontSize: ".85rem", color: t.done ? C.gray : C.white,
              textDecoration: t.done ? "line-through" : "none",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              transition: "all .2s",
            }}>
              {/* إزالة الإيموجي من العنوان وعرض النص فقط */}
              {t.title.replace(/^[📞📅]\s*/, "")}
            </div>
          </div>

          {/* Due date فقط — بدون badge الـ MED/HIGH (تعديل 3) */}
          <div style={{ display:"flex", gap:5, marginTop:5, alignItems:"center" }}>
            <CalendarDays size={11} color={C.gray} />
            <span style={{ fontSize:".6rem", color:C.gray, fontFamily:"Archivo,sans-serif" }}>
              {t.due}
            </span>
          </div>
        </div>

        {/* Arrow — لو تاسك ليد يفتح الليد، لو مش ليد مش بيعمل حاجة */}
        <div
          onClick={e => {
            e.stopPropagation();
            if (t.isLead && onOpenLead) onOpenLead();
          }}
          style={{
            width:28, height:28, borderRadius:7,
            background: t.done ? `${C.red}18` : C.cardAlt,
            display:"flex", alignItems:"center", justifyContent:"center",
            color: t.done ? C.red : (t.isLead ? C.silver : C.gray),
            flexShrink:0,
            transition:"all .2s",
            cursor: t.isLead ? "pointer" : "default",
            border: t.isLead && !t.done ? `1px solid ${C.border}` : "none",
          }}
        >
          {t.done
            ? <CheckCheck size={14} />
            : <ChevronRight size={14} />
          }
        </div>
      </div>
    </div>
  );
}

// ─── All Tasks Modal (تعديل 2) ────────────────────────────────────────
function AllTasksModal({ open, onClose, tasks, onToggle, onDelete, onOpenLead, leads }) {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default"); // "default" | "priority" | "date"

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = parseInt(document.body.style.top || "0") * -1;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

  const filtered = useMemo(() => {
    let list = filter === "all" ? tasks
      : filter === "done"    ? tasks.filter(t => t.done)
      : tasks.filter(t => !t.done);

    if (sortBy === "priority") {
      list = [...list].sort((a,b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    } else if (sortBy === "date") {
      list = [...list].sort((a,b) => {
        if (a.due === "No date set") return 1;
        if (b.due === "No date set") return -1;
        return new Date(a.due) - new Date(b.due);
      });
    }
    return list;
  }, [filter, sortBy, tasks]);

  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done/total)*100) : 0;

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop — نفس LeadDetailModal */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:200,
        background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)",
      }} />

      {/* Sheet wrapper — نفس LeadDetailModal */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width:"100%", maxWidth:430,
          background: C.card,
          borderRadius:"22px 22px 0 0",
          borderTop:"2px solid transparent",
          backgroundImage:`linear-gradient(${C.card}, ${C.card}), linear-gradient(90deg, ${C.red} 0%, ${C.red} 40%, transparent 100%)`,
          backgroundOrigin:"border-box",
          backgroundClip:"padding-box, border-box",
          boxShadow:`0 -8px 48px rgba(204,21,21,.18)`,
          display:"flex", flexDirection:"column",
          maxHeight:"calc(100dvh - 60px)",
          overflow:"hidden",
          fontFamily:"Archivo,sans-serif",
          animation:"slideUp .3s cubic-bezier(.4,0,.2,1) both",
        }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
            <div style={{ width:36, height:4, borderRadius:99, background:C.border }} />
          </div>

          {/* Header */}
          <div style={{ padding:"14px 18px 10px", flexShrink:0 }}>
            <div style={{
              background:C.cardAlt, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${C.red}`,
              borderRadius:14, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:14,
            }}>
              {/* Icon box */}
              <div style={{
                width:46, height:46, borderRadius:12, flexShrink:0,
                background:C.black, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <ClipboardList size={22} color={C.red} strokeWidth={2} />
              </div>

              {/* Title + counter */}
              <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ fontSize:".95rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>My Tasks</div>
                <div style={{ fontSize:".68rem", color:C.gray, marginTop:3, fontFamily:"Archivo,sans-serif" }}>
                  {done} of {total} completed
                </div>
              </div>

              {/* Close btn */}
              <div
                onClick={onClose}
                style={{
                  width:32, height:32, borderRadius:8, flexShrink:0,
                  background:C.card, border:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer",
                }}
              >
                <X size={14} color={C.gray} />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:".6rem", color:C.gray, fontWeight:600, fontFamily:"Archivo,sans-serif" }}>Progress</span>
                <span style={{ fontSize:".6rem", fontWeight:700, fontFamily:"Archivo,sans-serif", color: pct===100 ? "#10b981" : C.silver }}>{pct}%</span>
              </div>
              <div style={{ height:4, background:C.border, borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  background: pct===100 ? "#10b981" : C.red,
                  width:`${pct}%`, transition:"width .5s cubic-bezier(.4,0,.2,1)",
                }} />
              </div>
            </div>

            {/* Filter + Sort */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, gap:8 }}>
              <div style={{ display:"flex", gap:5 }}>
                {["all","pending","done"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding:"5px 11px", borderRadius:6,
                    border:`1px solid ${filter===f ? C.red+"66" : C.border}`,
                    background: filter===f ? `${C.red}18` : C.cardAlt,
                    color: filter===f ? C.white : C.gray,
                    fontFamily:"Archivo,sans-serif", fontSize:".6rem", fontWeight:700, cursor:"pointer",
                  }}>
                    {f==="all" ? `All (${total})` : f==="done" ? `Done (${done})` : `Pending (${total-done})`}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background:C.cardAlt, border:`1px solid ${C.border}`,
                  color:C.silver, borderRadius:6,
                  fontSize:".6rem", fontWeight:700, padding:"5px 8px",
                  fontFamily:"Archivo,sans-serif", cursor:"pointer", outline:"none",
                }}
              >
                <option value="default">Default</option>
                <option value="priority">Priority</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:C.border, margin:"0 18px 0" }} />

          {/* Task list — scrollable */}
          <div style={{
            overflowY:"auto", padding:"10px 14px 32px",
            display:"flex", flexDirection:"column", gap:8,
            WebkitOverflowScrolling:"touch", overscrollBehavior:"contain",
          }}>
            {filtered.length === 0 && (
              <div style={{ textAlign:"center", padding:"32px 0", color:C.gray, fontSize:".82rem", fontWeight:600, fontFamily:"Archivo,sans-serif" }}>
                No tasks here 🎉
              </div>
            )}
            {filtered.map(t => (
              <SwipeableTaskCard
                key={t.id}
                t={t}
                onToggle={() => onToggle(t.id)}
                onDelete={onDelete}
                onOpenLead={() => {
                  if (t.isLead && leads) {
                    const lead = leads.find(l => l.id === t.leadId);
                    if (lead) { onClose(); onOpenLead(lead); }
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Format date for task display ────────────────────────────────────
function formatLeadDue(lead) {
  const dateStr = lead.callbackDate || lead.meetingDate;
  const timeStr = lead.callbackTime || lead.meetingTime;
  if (!dateStr) return "No date set";
  if (!timeStr) return dateStr;
  const dt = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(dt.getTime())) return `${dateStr} ${timeStr}`;
  return dt.toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit", hour12:true });
}

// ─── Home Page ────────────────────────────────────────────────────────
export default function HomePage({
  activeTab = 0,
  onTabChange,
  onSignOut,
  onLeadsFilter,
  leads: leadsFromProps,
  tasks: tasksFromProps,
  currentUser,
}) {
  const [animate,      setAnimate]      = useState(false);
  const [viewAllOpen,  setViewAllOpen]  = useState(false);
  const [manualTasks,  setManualTasks]  = useState(tasksFromProps || TASKS_DEFAULT);
  const [doneLeadIds,  setDoneLeadIds]  = useState(new Set());
  const [deletedIds,   setDeletedIds]   = useState(new Set());
  // ── Lead Detail Modal state ──
  const [leadDetail,   setLeadDetail]   = useState(null);
  const [leadOpen,     setLeadOpen]     = useState(false);

  const salesName = currentUser?.name || currentUser?.email || "Sales";

  useEffect(() => {
    document.body.style.overflow = viewAllOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [viewAllOpen]);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 150);
  }, []);

  useEffect(() => {
    const id = "onyx-home-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const leads = leadsFromProps || [];

  const leadTasks = useMemo(() => {
    return leads
      .filter(l => (l.status === "callback" || l.status === "pendingMeeting") && !deletedIds.has(`lead-${l.id}`))
      .map(l => ({
        id:       `lead-${l.id}`,
        title:    l.status === "callback"
                    ? `Call Back: ${l.name}`
                    : `Meeting: ${l.name}`,
        due:      formatLeadDue(l),
        priority: l.status === "pendingMeeting" ? "high" : "medium",
        done:     doneLeadIds.has(l.id),
        isLead:   true,
        leadId:   l.id,
      }));
  }, [leads, doneLeadIds, deletedIds]);

  const tasks = useMemo(() => [...leadTasks, ...manualTasks], [leadTasks, manualTasks]);

  const statCounts = useMemo(() => {
    const total = leads.length;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    return { all: total, ...byStatus };
  }, [leads]);

  const toggleTask = id => {
    if (id.startsWith("lead-")) {
      const leadId = id.replace("lead-", "");
      setDoneLeadIds(prev => {
        const next = new Set(prev);
        next.has(leadId) ? next.delete(leadId) : next.add(leadId);
        return next;
      });
    } else {
      setManualTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }
  };

  // ── Delete handler (swipe to delete) ──
  const deleteTask = id => {
    if (id.startsWith("lead-")) {
      setDeletedIds(prev => new Set([...prev, id]));
    } else {
      setManualTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateLead = useCallback(async (updated) => {
    await dbUpdateLead(updated, salesName, null);
  }, [salesName]);

  // ── Lead Detail — بيجيب البيانات الكاملة من Supabase عند الضغط بس ──
  const openLead = useCallback(async (partialLead) => {
    // بيجيب الليد كامل من DB بعدين يفتح الـ modal
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("id", partialLead.id)
      .single();

    if (data) {
      setLeadDetail({
        id:           data.id,
        name:         data.name         || "",
        phone:        data.phone        || "",
        status:       data.status       || "new",
        assignedTo:   data.assigned_to  || "",
        callbackDate: data.callback_date|| "",
        callbackTime: data.callback_time|| "",
        meetingDate:  data.callback_date|| "",
        meetingTime:  data.callback_time|| "",
        clientInfo:   data.client_info  || {},
        comments:     data.comments     || [],
      });
    } else {
      // fallback لو فشل الـ fetch
      setLeadDetail({ ...partialLead, phone: "", comments: [], clientInfo: {} });
    }
    setLeadOpen(true);
  }, []);

  const doneTasks  = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;

  const handleLeadsFilter = filterKey => {
    if (onLeadsFilter) onLeadsFilter(filterKey === "all" ? null : filterKey);
    if (onTabChange)   onTabChange(1);
  };

  return (
    <div style={{
      fontFamily: "Archivo,sans-serif",
      color: C.white,
      width: "100%",
      position: "relative",
      userSelect: "none",
      WebkitUserSelect: "none",
    }}>

      {/* ── Lead Detail Modal (من التاسك) ── */}
      <LeadDetailModal
        lead={leadDetail}
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        onUpdate={updateLead}
        salesName={salesName}
      />

      {/* ── Modals ── */}
      <AllTasksModal
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        tasks={tasks}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onOpenLead={openLead}
        leads={leads}
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
                count={statCounts[s.filterKey] || 0}
                totalLeads={statCounts.all}
                animate={animate}
                onLeadsFilter={handleLeadsFilter}
                delay={i * 30}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ── Tasks Section ── */}
        {/* تعديل 4: شيلنا الأحمر من الحواف */}
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
          {/* Section Title Bar */}
          <div style={{
            padding:"10px 14px 9px",
            borderBottom:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <ClipboardList size={14} color={C.red} strokeWidth={2.5} />
              <span style={{ fontSize:".72rem", fontWeight:800, color:C.silver, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>
                My Tasks
              </span>
              <div style={{
                background:`${C.border}`, border:`1px solid ${C.border}`,
                color:C.silver, fontSize:".58rem", fontWeight:800,
                padding:"2px 7px", borderRadius:4,
                fontFamily:"Archivo,sans-serif",
              }}>
                {doneTasks}/{totalTasks}
              </div>
            </div>
            <div
              className="tap-btn"
              onClick={() => setViewAllOpen(true)}
              style={{ fontSize:".68rem", color:C.silver, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}
            >
              View all <ChevronRight size={13} />
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
              <SwipeableTaskCard
                key={t.id}
                t={t}
                onToggle={() => toggleTask(t.id)}
                onDelete={deleteTask}
                onOpenLead={t.isLead ? () => {
                  const lead = leads.find(l => l.id === t.leadId);
                  if (lead) openLead(lead);
                } : null}
              />
            ))}
            {tasks.length === 0 && (
              <div style={{
                textAlign:"center", padding:"28px 0",
                color:C.gray, fontSize:".82rem", fontWeight:700,
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                fontFamily:"Archivo,sans-serif",
              }}>
                <CheckSquare size={22} color={C.gray} />
                No tasks yet — you're all caught up!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
