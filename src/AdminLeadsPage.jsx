// ── AdminLeadsPage.jsx — ONYX Design System ──────────────────────
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, fetchTeam, fetchLeads, addLead as dbAddLead, updateLead as dbUpdateLead, deleteLead as dbDeleteLead, addComment as dbAddComment } from "./sharedLeadsData";

// ─── ONYX Design Tokens ──────────────────────────────────────────
const C = {
  black:   "#000000",
  surface: "#0A0A0A",
  card:    "#111111",
  border:  "#1E1E1E",
  cardAlt: "#252525",
  cardHover:"#2E2E2E",
  gray:    "#595A5F",
  silver:  "#CECECE",
  white:   "#FFFFFF",
  red:     "#CC1515",
  redLight:"#FF2020",
  blue:    "#253FF6",
};

const STATUS_META = {
  new:             { label: "New",               color: "#10b981", bg: "#10b98120", icon: "✦"  },
  callback:        { label: "Call Back",         color: "#f59e0b", bg: "#f59e0b20", icon: "🔄" },
  pendingMeeting:  { label: "Pending Meeting",   color: "#253FF6", bg: "#253FF620", icon: "📅" },
  meetingDone:     { label: "Meeting Done",      color: "#a855f7", bg: "#a855f720", icon: "🤝" },
  deal:            { label: "Deal",              color: "#CC1515", bg: "#CC151520", icon: "💰" },
  onGoing:         { label: "On Going",          color: "#06b6d4", bg: "#06b6d420", icon: "🔁" },
  lowBudget:       { label: "Low Budget",        color: "#f97316", bg: "#f9731620", icon: "💸" },
  noAnswer:        { label: "No Answer",         color: "#8b949e", bg: "#8b949e20", icon: "📵" },
  notInterested:   { label: "Not Interested",    color: "#6b7280", bg: "#6b728020", icon: "⊘"  },
  chooseCompetitor:{ label: "Competitor",        color: "#ec4899", bg: "#ec489920", icon: "⚔️" },
  longTerm:        { label: "Long Term",         color: "#8b5cf6", bg: "#8b5cf620", icon: "⏳" },
  closed:          { label: "Closed",            color: "#374151", bg: "#37415130", icon: "🔒" },
};

const STATUS_ORDER = ["new","callback","pendingMeeting","meetingDone","deal","onGoing","lowBudget","noAnswer","notInterested","chooseCompetitor","longTerm","closed"];
const ALL_STATUSES = ["all", ...STATUS_ORDER];

const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";

const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  .lead-card  { transition: transform .15s ease }
  .lead-card:active { transform: scale(.985) }
  .chip-btn   { transition: all .15s ease }
  .chip-btn:active { transform: scale(.93) }
  .tap-btn    { transition: all .15s ease }
  .tap-btn:active { transform: scale(.94) }
  .lead-item  { animation: fadeInUp .2s ease both }
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer; filter:invert(1) }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:${C.red}; border-radius:99px }
  input,select { color-scheme:dark }
  ::placeholder { color:${C.gray} !important; opacity:1 }
  select option { background:${C.cardAlt}; color:${C.white} }
  body { overflow:hidden; }
  @keyframes spin { to { transform:rotate(360deg) } }
`;

const inputBase = {
  width:"100%", padding:"10px 14px", borderRadius:10,
  border:`1.5px solid ${C.border}`, outline:"none",
  fontSize:".82rem", fontWeight:600, color:C.white,
  fontFamily:"Archivo, sans-serif", background:C.cardAlt,
};

// ─── Loading Bar ──────────────────────────────────────────────────
function LoadingBar({ show }) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:999, height:2, background:C.border }}>
      <div style={{
        height:"100%", background:C.red,
        width: show ? "75%" : "100%",
        opacity: show ? 1 : 0,
        transition: show ? "width 2.5s ease" : "opacity .4s ease",
        borderRadius:"0 2px 2px 0",
      }} />
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
const Div = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    {label && <span style={{ fontSize:".55rem", fontWeight:700, color:C.gray, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{label}</span>}
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ─── AdminLeadDetailModal ─────────────────────────────────────────
function AdminLeadDetailModal({ lead, open, onClose, onUpdate, onDelete, team }) {
  const [local, setLocal]   = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const prevId  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && lead && lead.id !== prevId.current) {
      setLocal({ ...lead, comments:[...lead.comments] });
      setComment(""); setConfirmDel(false);
      prevId.current = lead.id;
    }
    if (!open) { prevId.current = null; setAssignOpen(false); setConfirmDel(false); }
  }, [open, lead]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

  const set = useCallback((k, v) => setLocal(l => ({ ...l, [k]:v })), []);

  const handleAddComment = useCallback(async () => {
    const text = comment.trim();
    if (!text || !local) return;
    const entry = { text, by:"Admin", time: new Date().toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"}) };
    const saved = await dbAddComment(local.id, entry);
    if (saved) setLocal(l => ({ ...l, comments:[{ id:saved.id, text:saved.text, by:saved.by, time:saved.time }, ...l.comments] }));
    setComment(""); inputRef.current?.focus();
  }, [comment, local]);

  const handleSave = useCallback(async () => {
    setSaving(true); await onUpdate(local); setSaving(false); onClose();
  }, [local, onUpdate, onClose]);

  const handleDelete = useCallback(async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true); await onDelete(local.id); setDeleting(false); onClose();
  }, [confirmDel, local, onDelete, onClose]);

  if (!local) return null;

  const meta       = STATUS_META[local.status] || STATUS_META.new;
  const isCallback = local.status === "callback";
  const agent      = team.find(t => t.id === local.assignedTo);

  return (
    <>
      <style>{STYLES}</style>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:200,
        background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)",
        opacity: open?1:0, pointerEvents: open?"all":"none", transition:"opacity .25s",
      }} />

      {/* Sheet */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        pointerEvents: open?"all":"none",
      }}>
        <div onClick={e=>e.stopPropagation()} style={{
          width:"100%", maxWidth:430,
          background:C.card, borderRadius:"22px 22px 0 0",
          borderTop:`2px solid ${C.red}`,
          boxShadow:`0 -8px 48px rgba(204,21,21,.18)`,
          display:"flex", flexDirection:"column", maxHeight:"calc(100dvh - 126px)",
          transform: open?"translateY(0)":"translateY(100%)",
          transition:"transform .32s cubic-bezier(.32,0,.16,1)",
        }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
            <div style={{ width:36, height:4, borderRadius:99, background:C.border }} />
          </div>

          {/* Lead header */}
          <div style={{ padding:"14px 16px 0", flexShrink:0 }}>
            <div style={{
              background:`linear-gradient(135deg, ${C.cardAlt}, ${C.card})`,
              border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${meta.color}`,
              borderRadius:14, padding:"14px 14px",
              display:"flex", alignItems:"center", gap:12,
            }}>
              {/* Avatar */}
              <div style={{
                width:46, height:46, borderRadius:12, flexShrink:0,
                background:`${meta.color}18`, border:`1.5px solid ${meta.color}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.2rem", fontWeight:900, color:meta.color, fontFamily:"Archivo,sans-serif",
              }}>{(local.name||"?").charAt(0)}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".92rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{local.name}</div>
                <div style={{ fontSize:".68rem", color:C.gray, marginTop:3, fontFamily:"Archivo,sans-serif" }}>{local.project}</div>
              </div>

              {/* Status pill */}
              <div style={{ background:meta.bg, borderRadius:99, padding:"5px 11px", border:`1px solid ${meta.color}33`, flexShrink:0 }}>
                <span style={{ fontSize:".6rem", fontWeight:700, color:meta.color, fontFamily:"Archivo,sans-serif" }}>{meta.icon} {meta.label}</span>
              </div>
            </div>
          </div>

          {/* Scrollable */}
          <div style={{ overflowY:"auto", padding:"12px 16px 16px", display:"flex", flexDirection:"column", gap:10, WebkitOverflowScrolling:"touch" }}>

            {/* ── ACTIONS SECTION ── */}
            <Div label="Actions" />

            {/* Assign */}
            <div onClick={() => setAssignOpen(true)} className="tap-btn" style={{
              display:"flex", alignItems:"center", gap:10,
              background:C.cardAlt, borderRadius:12, padding:"11px 14px",
              cursor:"pointer", border:`1px solid ${C.border}`,
            }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${C.blue}18`, border:`1px solid ${C.blue}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={C.blue}><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
              </div>
              <span style={{ fontSize:".75rem", fontWeight:700, color: agent ? C.silver : C.gray, fontFamily:"Archivo,sans-serif", flex:1 }}>
                {agent ? `${agent.name}` : "توزيع على سيلز"}
              </span>
              {agent && <span style={{ fontSize:".6rem", color:C.blue, fontWeight:700, fontFamily:"Archivo,sans-serif" }}>تغيير →</span>}
              {!agent && <svg width="12" height="12" viewBox="0 0 256 256" fill={C.gray}><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>}
            </div>

            {/* ── STATUS SECTION ── */}
            <Div label="Status" />
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {STATUS_ORDER.map(s => {
                const m = STATUS_META[s];
                const active = local.status === s;
                return (
                  <button key={s} className="chip-btn" onClick={() => set("status", s)} style={{
                    padding:"6px 11px", borderRadius:99,
                    border:`1px solid ${active ? m.color : C.border}`,
                    cursor:"pointer", fontFamily:"Archivo,sans-serif",
                    fontSize:".65rem", fontWeight:700,
                    background: active ? m.color : C.cardAlt,
                    color: active ? "#fff" : C.gray,
                    boxShadow: active ? `0 3px 10px ${m.color}40` : "none",
                    display:"flex", alignItems:"center", gap:3,
                  }}>{m.icon} {m.label}</button>
                );
              })}
            </div>

            {/* Callback schedule */}
            {isCallback && (
              <>
                <Div label="Callback Schedule" />
                <div style={{ background:`${C.cardAlt}`, border:`1px solid #f59e0b33`, borderLeft:`3px solid #f59e0b`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".6rem", color:"#f59e0b", fontWeight:700, marginBottom:5, fontFamily:"Archivo,sans-serif" }}>DATE</div>
                      <input type="date" value={local.callbackDate||""} onChange={e => set("callbackDate", e.target.value)} style={{ ...inputBase, border:`1px solid #f59e0b33`, fontSize:".8rem" }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".6rem", color:"#f59e0b", fontWeight:700, marginBottom:5, fontFamily:"Archivo,sans-serif" }}>TIME</div>
                      <input type="time" value={local.callbackTime||""} onChange={e => set("callbackTime", e.target.value)} style={{ ...inputBase, border:`1px solid #f59e0b33`, fontSize:".8rem" }} />
                    </div>
                  </div>
                  {local.callbackDate && local.callbackTime && (
                    <div style={{ marginTop:8, fontSize:".7rem", color:"#f59e0b", fontWeight:700, fontFamily:"Archivo,sans-serif" }}>
                      📅 {new Date(`${local.callbackDate}T${local.callbackTime}`).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── BUDGET SECTION ── */}
            <Div label="Client" />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Property type */}
              <div style={{ display:"flex", gap:6 }}>
                {[
                  { key:"residential", label:"سكني",  color:"#10b981" },
                  { key:"commercial",  label:"تجاري",  color:"#f59e0b" },
                  { key:"admin",       label:"إداري",  color:C.blue    },
                ].map(t => {
                  const active = local.clientInfo?.type === t.key;
                  return (
                    <button key={t.key} className="chip-btn" onClick={() => set("clientInfo",{...local.clientInfo, type:t.key})} style={{
                      flex:1, padding:"8px 4px", borderRadius:10,
                      border:`1px solid ${active ? t.color : C.border}`, cursor:"pointer",
                      fontFamily:"Archivo,sans-serif", fontSize:".7rem", fontWeight:700,
                      background: active ? t.color : C.cardAlt,
                      color: active ? "#fff" : C.gray,
                      boxShadow: active ? `0 3px 10px ${t.color}40` : "none", transition:"all .15s",
                    }}>{t.label}</button>
                  );
                })}
              </div>
              {/* Budget */}
              <input value={local.clientInfo?.budget||""} onChange={e => set("clientInfo",{...local.clientInfo, budget:e.target.value})} placeholder="💰 Budget e.g. 2,500,000 EGP" style={{ ...inputBase }} />
            </div>

            {/* ── COMMENTS SECTION ── */}
            <Div label="Comments" />
            <div style={{ display:"flex", gap:8 }}>
              <input ref={inputRef} value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleAddComment()}
                placeholder="Write a comment…"
                style={{ ...inputBase, flex:1 }}
              />
              <button className="tap-btn" onClick={handleAddComment} style={{
                width:42, height:42, borderRadius:10, border:"none", flexShrink:0,
                background: comment.trim() ? C.red : C.cardAlt,
                color: comment.trim() ? "#fff" : C.gray,
                cursor: comment.trim() ? "pointer" : "default",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:".9rem",
                boxShadow: comment.trim() ? `0 3px 12px ${C.red}44` : "none",
              }}>➤</button>
            </div>

            {local.comments.length > 0
              ? local.comments.map(c => (
                  <div key={c.id} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:".78rem", color:C.silver, fontWeight:600, lineHeight:1.55, fontFamily:"Archivo,sans-serif" }}>{c.text}</div>
                    <div style={{ fontSize:".58rem", color:C.gray, marginTop:4, display:"flex", justifyContent:"space-between", fontFamily:"Archivo,sans-serif" }}>
                      <span>{c.by}</span><span>{c.time}</span>
                    </div>
                  </div>
                ))
              : <div style={{ textAlign:"center", padding:"6px 0", color:C.gray, fontSize:".72rem", fontFamily:"Archivo,sans-serif" }}>No comments yet</div>
            }

            <div style={{ height:6 }} />
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 16px 28px", flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.card }}>
            {confirmDel && (
              <div style={{ background:`${C.red}12`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"9px 12px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:".7rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif" }}>تأكيد الحذف النهائي؟</span>
                <button onClick={() => setConfirmDel(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray, fontSize:".68rem", fontFamily:"Archivo,sans-serif", fontWeight:700 }}>إلغاء ✕</button>
              </div>
            )}
            <div style={{ display:"flex", gap:7 }}>
              <button className="tap-btn" onClick={handleDelete} disabled={deleting} style={{
                width:42, height:42, borderRadius:10, border:`1px solid ${confirmDel ? C.red : C.border}`,
                background: confirmDel ? C.red : C.cardAlt,
                color: confirmDel ? "#fff" : C.gray,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:".85rem", cursor:"pointer", flexShrink:0, transition:"all .15s",
              }}>🗑</button>
              <button onClick={onClose} style={{
                flex:1, padding:"11px 0", borderRadius:10,
                border:`1px solid ${C.border}`, background:C.cardAlt, color:C.gray,
                fontFamily:"Archivo,sans-serif", fontSize:".78rem", fontWeight:700, cursor:"pointer",
              }}>إغلاق</button>
              <button className="tap-btn" onClick={handleSave} disabled={saving} style={{
                flex:2, padding:"11px 0", borderRadius:10, border:"none",
                background: saving ? C.gray : C.red,
                color:"#fff", boxShadow: saving ? "none" : `0 4px 14px ${C.red}44`,
                fontFamily:"Archivo,sans-serif", fontSize:".78rem", fontWeight:800, cursor:"pointer",
              }}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
            </div>
          </div>
        </div>
      </div>

      {assignOpen && (
        <AssignModal lead={local} team={team}
          onClose={() => setAssignOpen(false)}
          onAssign={id => { set("assignedTo", id); setAssignOpen(false); }}
          onUnassign={() => { set("assignedTo", null); setAssignOpen(false); }}
        />
      )}
    </>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────
function AssignModal({ lead, onClose, onAssign, onUnassign, team }) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, padding:"20px 16px 32px", paddingBottom:"24px", maxHeight:"70vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>توزيع: {lead.name}</div>
          <div onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".75rem", color:C.gray }}>✕</div>
        </div>
        {team.map(agent => {
          const active = lead.assignedTo === agent.id;
          return (
            <div key={agent.id} className="tap-btn" onClick={() => active ? onUnassign() : onAssign(agent.id)} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 12px", borderRadius:12, marginBottom:6,
              background: active ? agent.color+"20" : C.cardAlt,
              border: active ? `1.5px solid ${agent.color}` : `1px solid ${C.border}`,
              cursor:"pointer",
            }}>
              <div style={{ width:32, height:32, borderRadius:9, background:agent.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".72rem", fontWeight:900, color:"#fff", fontFamily:"Archivo,sans-serif" }}>{agent.name.charAt(0)}</div>
              <div style={{ flex:1, fontSize:".75rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>{agent.name}</div>
              {active && <div style={{ fontSize:".6rem", color:agent.color, fontWeight:800, fontFamily:"Archivo,sans-serif" }}>✓ موزع</div>}
            </div>
          );
        })}
        {lead.assignedTo && (
          <div onClick={onUnassign} style={{ textAlign:"center", fontSize:".65rem", color:C.red, fontWeight:700, cursor:"pointer", padding:"8px 0", fontFamily:"Archivo,sans-serif" }}>
            سحب التوزيع ✕
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────
const AdminLeadCard = ({ lead, onClick, onDelete, team }) => {
  const meta        = STATUS_META[lead.status] || STATUS_META.new;
  const agent       = team.find(t => t.id === lead.assignedTo);
  const hasCallback = lead.status === "callback" && lead.callbackDate && lead.callbackTime;
  const initial     = (lead.name || "?").charAt(0).toUpperCase();

  return (
    <div className="lead-card" onClick={onClick} style={{
      background: "#252525",
      border: "1px solid #333333",
      borderRadius: 16,
      cursor: "pointer",
      overflow: "hidden",
      position: "relative",
      boxShadow: "0 2px 24px rgba(0,0,0,.5)",
    }}>
      {/* Red top accent bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"#cc1515", borderRadius:"16px 16px 0 0" }} />

      <div style={{ padding:"14px 14px 13px" }}>

        {/* Row 1: Avatar + Name/Phone + Status + Action icons */}
        <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom: hasCallback ? 8 : 10 }}>
          {/* Avatar: black square */}
          <div style={{
            width:42, height:42, borderRadius:10, flexShrink:0,
            background:"#1a1a1a", border:"1px solid #383838",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"1rem", fontWeight:900, color:"#ffffff", fontFamily:"Archivo,sans-serif",
          }}>{initial}</div>

          {/* Name + phone */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Archivo,sans-serif", fontWeight:800, fontSize:".88rem", color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.name}</div>
            <div style={{ fontFamily:"Archivo,sans-serif", fontSize:".67rem", color:C.gray, marginTop:2 }}>{lead.phone}</div>
          </div>

          {/* Status pill */}
          <div style={{ fontSize:".58rem", fontWeight:700, color:meta.color, background:C.cardAlt, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif", flexShrink:0 }}>
            {meta.label}
          </div>

          {/* Call icon */}
          <a href={`tel:${lead.phone}`} onClick={e=>e.stopPropagation()} style={{
            fontSize:".58rem", fontWeight:600, color:C.silver,
            background:C.cardAlt, padding:"3px 8px", borderRadius:6,
            border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            textDecoration:"none", flexShrink:0,
          }}>📞</a>

          {/* WhatsApp icon */}
          <a href={`https://wa.me/${(lead.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{
            fontSize:".58rem", fontWeight:600, color:C.silver,
            background:C.cardAlt, padding:"3px 8px", borderRadius:6,
            border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            textDecoration:"none", flexShrink:0,
          }}>💬</a>
        </div>

        {/* Callback banner */}
        {hasCallback && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:".58rem", fontWeight:700, color:C.silver, background:C.cardAlt, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif" }}>
              CALL BACK
            </div>
            <div style={{ fontSize:".58rem", fontWeight:600, color:C.silver, background:C.cardAlt, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif" }}>
              {new Date(`${lead.callbackDate}T${lead.callbackTime}`).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"})}
            </div>
          </div>
        )}

        {/* Tags: agent only */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {agent ? (
            <div style={{ fontSize:".58rem", color:C.silver, fontWeight:600, background:C.cardAlt, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif" }}>
              {agent.name.split(" ")[0]}
            </div>
          ) : (
            <div style={{ fontSize:".58rem", color:C.gray, background:C.cardAlt, padding:"3px 8px", borderRadius:6, border:`1px dashed ${C.border}`, fontFamily:"Archivo,sans-serif" }}>غير موزع</div>
          )}
        </div>

      </div>
    </div>
  );
};

// ─── Modals ───────────────────────────────────────────────────────
function ModalWrap({ onClose, title, children }) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, maxHeight:"88vh", overflowY:"auto", padding:"20px 16px 24px", boxShadow:`0 -8px 40px rgba(204,21,21,.18)` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>{title}</div>
          <div onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".75rem", color:C.gray }}>✕</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:".6rem", fontWeight:700, color:C.gray, marginBottom:4, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputBase }} />
    </div>
  );
}

function PrimaryBtn({ label, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      background: disabled ? C.cardAlt : C.red,
      color: disabled ? C.gray : "#fff",
      border: disabled ? `1px solid ${C.border}` : "none",
      borderRadius:10, padding:"11px 0", textAlign:"center",
      fontSize:".75rem", fontWeight:800, cursor: disabled ? "default" : "pointer",
      boxShadow: disabled ? "none" : `0 4px 14px ${C.red}44`,
      transition:"all .2s", fontFamily:"Archivo,sans-serif",
      marginTop:4,
    }}>{label}</div>
  );
}

function AddManualModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:"", phone:"", project:PROJECTS[0], note:"" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  return (
    <ModalWrap onClose={onClose} title="إضافة ليد يدوي">
      <Field label="الاسم"    value={form.name}  onChange={v=>set("name",v)}  placeholder="محمد أحمد" />
      <Field label="التليفون" value={form.phone} onChange={v=>set("phone",v)} placeholder="010XXXXXXXX" type="tel" />
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:".6rem", fontWeight:700, color:C.gray, marginBottom:4, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>المشروع</div>
        <select value={form.project} onChange={e=>set("project",e.target.value)} style={{ ...inputBase, appearance:"none", cursor:"pointer" }}>
          {PROJECTS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <Field label="ملاحظة (اختياري)" value={form.note} onChange={v=>set("note",v)} placeholder="..." />
      <PrimaryBtn label={loading ? "جاري الإضافة..." : "إضافة ليد"} disabled={loading} onClick={async () => {
        if (!form.name || !form.phone) return;
        setLoading(true); await onAdd({ ...form, source:"manual" }); setLoading(false); onClose();
      }} />
    </ModalWrap>
  );
}

function ExcelModal({ onClose, onAdd }) {
  const [rows, setRows]   = useState([]);
  const [done, setDone]   = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split("\n").filter(Boolean).slice(1);
      setRows(lines.map(line => {
        const [name, phone, project] = line.split(",").map(s => s.trim().replace(/"/g,""));
        return { name, phone, project: project || PROJECTS[0] };
      }).filter(r => r.name && r.phone));
    };
    reader.readAsText(file);
  };

  return (
    <ModalWrap onClose={onClose} title="رفع ملف Excel">
      {!done ? (
        <>
          <div onClick={() => fileRef.current.click()} style={{ border:`2px dashed ${C.red}44`, borderRadius:12, padding:"24px 16px", textAlign:"center", cursor:"pointer", marginBottom:12, background:`${C.red}08` }}>
            <div style={{ fontSize:"1.6rem", marginBottom:6 }}>📊</div>
            <div style={{ fontSize:".72rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif" }}>اضغط لرفع ملف CSV</div>
            <div style={{ fontSize:".58rem", color:C.gray, marginTop:2, fontFamily:"Archivo,sans-serif" }}>CSV (name, phone, project)</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleFile} />
          {rows.length > 0 && (
            <>
              <div style={{ fontSize:".62rem", color:"#10b981", fontWeight:700, marginBottom:8, fontFamily:"Archivo,sans-serif" }}>✓ تم قراءة {rows.length} ليد</div>
              {rows.slice(0,4).map((r,i) => (
                <div key={i} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 10px", marginBottom:5, fontSize:".62rem", color:C.silver, fontFamily:"Archivo,sans-serif" }}>{r.name} — {r.phone} — {r.project}</div>
              ))}
              {rows.length > 4 && <div style={{ fontSize:".58rem", color:C.gray, marginBottom:8, fontFamily:"Archivo,sans-serif" }}>و {rows.length - 4} أكتر...</div>}
              <PrimaryBtn label={loading ? "جاري الاستيراد..." : `استيراد ${rows.length} ليد`} disabled={loading} onClick={async () => {
                setLoading(true); for (const r of rows) await onAdd({...r,source:"excel"}); setLoading(false); setDone(true);
              }} />
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ fontSize:"2rem", marginBottom:8 }}>✅</div>
          <div style={{ fontSize:".8rem", fontWeight:800, color:"#10b981", fontFamily:"Archivo,sans-serif", marginBottom:14 }}>تم الاستيراد بنجاح!</div>
          <PrimaryBtn label="إغلاق" onClick={onClose} />
        </div>
      )}
    </ModalWrap>
  );
}

function FacebookModal({ onClose }) {
  return (
    <ModalWrap onClose={onClose} title="استيراد من Facebook">
      <div style={{ background:"#1877f212", border:"1px solid #1877f230", borderRadius:12, padding:"18px 16px", textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:"1.4rem", marginBottom:8 }}>📘</div>
        <div style={{ fontSize:".75rem", fontWeight:800, color:"#60a5fa", fontFamily:"Archivo,sans-serif", marginBottom:4 }}>Facebook Lead Ads</div>
        <div style={{ fontSize:".62rem", color:C.gray, fontFamily:"Archivo,sans-serif" }}>الربط مع Facebook API قيد التطوير</div>
      </div>
      <PrimaryBtn label="إغلاق" onClick={onClose} />
    </ModalWrap>
  );
}

// ─── Delete Confirm Popup ─────────────────────────────────────────
function DeletePopup({ lead, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:400, background:"rgba(0,0,0,.85)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px" }}
      onClick={onCancel}
    >
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.card, border:`1px solid ${C.red}44`, borderTop:`2px solid ${C.red}`,
        borderRadius:20, padding:"22px 20px", width:"100%", maxWidth:320,
        boxShadow:`0 8px 40px ${C.red}20`,
      }}>
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🗑️</div>
          <div style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", marginBottom:6 }}>حذف الليد</div>
          <div style={{ fontSize:".7rem", color:C.gray, fontFamily:"Archivo,sans-serif", lineHeight:1.6 }}>
            هل أنت متأكد من حذف <span style={{ color:C.white, fontWeight:700 }}>{lead.name}</span>؟<br/>الإجراء لا يمكن التراجع عنه.
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${C.border}`, background:C.cardAlt, color:C.gray, fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:700, cursor:"pointer" }}>إلغاء</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:C.red, color:"#fff", fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 12px ${C.red}44` }}>حذف نهائياً</button>
        </div>
      </div>
    </div>
  );
}

// ─── FAB Chooser Modal ────────────────────────────────────────────
function FabChooserModal({ onClose, onChoose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, padding:"20px 16px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>إضافة ليد جديد</div>
          <div onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".75rem", color:C.gray }}>✕</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { label:"+ Facebook", key:"facebook", color:"#60a5fa", bg:"#1877f215", bd:"#1877f228", icon:"📘" },
            { label:"+ Excel",    key:"excel",    color:"#34d399", bg:"#10b98112", bd:"#10b98128", icon:"📊" },
            { label:"+ يدوي",    key:"manual",   color:C.red,    bg:`${C.red}12`, bd:`${C.red}28`, icon:"✏️" },
          ].map(b => (
            <div key={b.key} className="tap-btn" onClick={() => { onClose(); onChoose(b.key); }} style={{
              display:"flex", alignItems:"center", gap:12,
              background:b.bg, color:b.color,
              border:`1px solid ${b.bd}`, borderRadius:12, padding:"13px 16px",
              fontSize:".78rem", fontWeight:800, cursor:"pointer",
              fontFamily:"Archivo,sans-serif",
            }}>
              <span style={{ fontSize:"1.1rem" }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AdminLeadsPage({ onModalChange }) {
  const [leads, setLeads]       = useState([]);
  const [team, setTeam]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [showFilters, setFilters] = useState(false);
  const [filterAgent, setFilterAgent] = useState("all");
  const [modal, setModal]       = useState(null);
  const [selectedLead, setSelected] = useState(null);
  const [detailOpen, setDetail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pullY, setPullY]       = useState(0);
  const [pulling, setPulling]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const bodyRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, teamData] = await Promise.all([fetchLeads(), fetchTeam()]);
    setLeads(leadsData); setTeam(teamData); setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Hide BottomNav when any modal is open
  const anyModalOpen = detailOpen || !!modal || !!deleteTarget;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.setAttribute("data-modal-open", "true");
    } else {
      document.body.removeAttribute("data-modal-open");
    }
    return () => document.body.removeAttribute("data-modal-open");
  }, [anyModalOpen]);

  const handleTouchStart = useCallback(e => {
    if (bodyRef.current?.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
    else touchStartY.current = 0;
  }, []);

  const handleTouchMove = useCallback(e => {
    if (!touchStartY.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && delta < 90) { setPulling(true); setPullY(delta); }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullY > 60) {
      setRefreshing(true); setPullY(0); setPulling(false);
      await loadData(); setRefreshing(false);
    } else { setPullY(0); setPulling(false); }
    touchStartY.current = 0;
  }, [pullY, loadData]);

  const handleAddLead = async data => {
    const newLead = await dbAddLead({ ...data, status:"new", priority:"medium", assignedTo:null, callbackDate:"", callbackTime:"", clientInfo:{ type:"", budget:"" } });
    if (newLead) setLeads(prev => [newLead, ...prev]);
  };

  const handleUpdateLead = async updated => {
    const result = await dbUpdateLead(updated);
    if (result) {
      setLeads(prev => prev.map(l => l.id===updated.id ? { ...result, comments:updated.comments } : l));
      setSelected({ ...result, comments:updated.comments });
    }
  };

  const handleDeleteLead = async id => {
    await dbDeleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setDeleteTarget(null); setDetail(false);
  };

  const requestDelete = useCallback(id => {
    const lead = leads.find(l => l.id === id);
    if (lead) setDeleteTarget(lead);
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const ms = !q || (l.name||"").toLowerCase().includes(q) || (l.phone||"").includes(q) || (l.project||"").toLowerCase().includes(q);
      const mst = statusFilter==="all" || l.status===statusFilter;
      const ma  = filterAgent==="all" || (filterAgent==="unassigned" ? !l.assignedTo : l.assignedTo===Number(filterAgent));
      return ms && mst && ma;
    });
  }, [leads, search, statusFilter, filterAgent]);

  const counts = useMemo(() =>
    ALL_STATUSES.reduce((acc,s) => {
      acc[s] = s==="all" ? leads.length : leads.filter(l=>l.status===s).length;
      return acc;
    }, {}), [leads]);

  const page = (
    <div style={{
      fontFamily:"Archivo, sans-serif",
      background:C.surface, height:"100dvh",
      color:C.white, maxWidth:430, margin:"0 auto",
      colorScheme:"dark",
      userSelect:"none", WebkitUserSelect:"none",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      <style>{STYLES}</style>
      <link href={FONT_URL} rel="stylesheet" />

      <LoadingBar show={loading} />

      <AdminLeadDetailModal
        lead={selectedLead} open={detailOpen}
        onClose={() => setDetail(false)}
        onUpdate={handleUpdateLead}
        onDelete={requestDelete}
        team={team}
      />

      {modal==="manual"   && <AddManualModal  onClose={()=>setModal(null)} onAdd={handleAddLead} />}
      {modal==="excel"    && <ExcelModal       onClose={()=>setModal(null)} onAdd={handleAddLead} />}
      {modal==="facebook" && <FacebookModal    onClose={()=>setModal(null)} />}
      {modal==="fab"      && <FabChooserModal  onClose={()=>setModal(null)} onChoose={k=>setModal(k)} />}

      {deleteTarget && (
        <DeletePopup lead={deleteTarget}
          onConfirm={() => handleDeleteLead(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── BODY ── */}
      <div
        ref={bodyRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ flex:1, overflowY:"auto", padding:"12px 14px 0", display:"flex", flexDirection:"column", gap:9, WebkitOverflowScrolling:"touch" }}
      >
        {/* Pull-to-refresh indicator */}
        <div style={{
          height: pulling || refreshing ? Math.min(pullY, 60) : 0,
          display:"flex", alignItems:"center", justifyContent:"center",
          overflow:"hidden", transition: pulling ? "none" : "height .25s ease",
          marginBottom: pulling || refreshing ? 4 : 0,
        }}>
          <div style={{
            width:28, height:28, borderRadius:"50%",
            border:`2.5px solid ${C.red}`, borderTopColor:"transparent",
            animation: refreshing ? "spin .7s linear infinite" : "none",
            transform: !refreshing ? `rotate(${pullY * 3}deg)` : undefined,
            opacity: Math.min(pullY / 60, 1),
          }} />
        </div>

        {/* Search */}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.gray, pointerEvents:"none" }}>
            <svg width="13" height="13" viewBox="0 0 256 256" fill={C.gray}><path d="M229.66,218.34l-50.07-50.06a88.21,88.21,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, phone, project…"
            style={{ ...inputBase, width:"100%", padding:"11px 36px 11px 38px", borderRadius:12, background:C.card, boxShadow:"0 2px 10px rgba(0,0,0,.3)" }}
          />
          {search && (
            <div onClick={()=>setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:C.gray, cursor:"pointer", fontSize:".75rem" }}>✕</div>
          )}
        </div>

        {/* Filter row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:".72rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>
            {filtered.length} results
            {statusFilter!=="all" && <span style={{ color:C.gray }}> · {STATUS_META[statusFilter]?.label}</span>}
          </div>
          <button className="tap-btn" onClick={()=>setFilters(v=>!v)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"6px 12px", borderRadius:9,
            border:`1px solid ${showFilters ? C.red+"44" : C.border}`,
            background: showFilters ? `${C.red}12` : C.card,
            color: showFilters ? C.red : C.gray,
            fontFamily:"Archivo,sans-serif", fontSize:".65rem", fontWeight:700, cursor:"pointer",
          }}>
            <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor"><path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53Z"/></svg>
            Filter {showFilters ? "▲" : "▼"}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px", display:"flex", flexDirection:"column", gap:9 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {ALL_STATUSES.map(s => {
                const m = s!=="all" ? STATUS_META[s] : null;
                const active = statusFilter===s;
                return (
                  <button key={s} className="chip-btn" onClick={()=>setStatus(s)} style={{
                    padding:"5px 11px", borderRadius:99,
                    border:`1px solid ${active ? (m?m.color:C.red) : C.border}`,
                    cursor:"pointer", fontFamily:"Archivo,sans-serif", fontSize:".62rem", fontWeight:700,
                    background: active ? (m?m.color:C.red) : C.cardAlt,
                    color: active ? "#fff" : (m?m.color:C.silver),
                    boxShadow: active ? `0 2px 8px ${m?m.color:C.red}44` : "none",
                  }}>{s==="all" ? `All (${counts.all})` : `${m.label} (${counts[s]})`}</button>
                );
              })}
            </div>
            <select value={filterAgent} onChange={e=>setFilterAgent(e.target.value)}
              style={{ ...inputBase, appearance:"none", cursor:"pointer" }}>
              <option value="all">كل السيلز</option>
              <option value="unassigned">غير موزع</option>
              {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Lead list */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, paddingBottom:80 }}>
          {loading
            ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif", animation:"pulse 1.5s ease infinite" }}>⏳ جاري التحميل...</div>
            : filtered.length===0
              ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif" }}>No leads found 🔍</div>
              : filtered.map((lead,i) => (
                  <div key={lead.id} className="lead-item" style={{ animationDelay:`${i*22}ms` }}>
                    <AdminLeadCard
                      lead={lead}
                      onClick={() => { setSelected(lead); setDetail(true); }}
                      onDelete={requestDelete}
                      team={team}
                    />
                  </div>
                ))
          }
        </div>
      </div>

    </div>
  );

  return (
    <>
      {page}
      {!anyModalOpen && createPortal(
        <div onClick={() => setModal("fab")} className="tap-btn" style={{
          position:"fixed", bottom:78, right:20,
          width:54, height:54, borderRadius:"50%",
          background:C.red, boxShadow:`0 6px 24px ${C.red}66`,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", zIndex:9999,
        }}>
          <svg width="22" height="22" viewBox="0 0 256 256" fill="#fff"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        </div>,
        document.body
      )}
    </>
  );
}
