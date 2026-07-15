// ── AdminLeadsPage.jsx — ONYX Design System ──────────────────────
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  PROJECTS, fetchTeam, fetchLeads,
  addLead as dbAddLead, updateLead as dbUpdateLead, deleteLead as dbDeleteLead,
  addComment as dbAddComment, subscribeToLeads,
  // P0-3: bulk operations
  bulkUpdateStatus as dbBulkUpdateStatus,
  bulkAssign as dbBulkAssign,
  bulkDelete as dbBulkDelete,
  exportLeadsToCsv,
} from "./sharedLeadsData";
import { BulkActionBar, SelectionCheckbox } from "./BulkOperations";

// ─── ONYX Design Tokens ──────────────────────────────────────────
const C = {
  black:    "#000000",
  surface:  "#0D0D0D",
  card:     "#161618",
  border:   "#2A2A2E",
  cardAlt:  "#1E1E22",
  cardHover:"#2E2E2E",
  gray:     "#6B6C73",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  redLight: "#FF2020",
  blue:     "#253FF6",
  cardGrad1: "linear-gradient(145deg,#1A1A1E 0%,#141416 100%)",
  cardGrad2: "linear-gradient(145deg,#1C1C22 0%,#141418 100%)",
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
  ::-webkit-scrollbar { width:0px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:transparent }
  input,select { color-scheme:dark }
  ::placeholder { color:${C.gray} !important; opacity:1 }
  select option { background:${C.cardAlt}; color:${C.white} }

  @keyframes spin { to { transform:rotate(360deg) } }

  /* Body lock without layout shift */
  body.modal-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
  }
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

// ─── Section Header (نفس LeadsPage بالظبط) ───────────────────────
const SectionHeader = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    <span style={{ fontSize:".6rem", fontWeight:700, color:C.white, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{label}</span>
    <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.red}88 0%, transparent 100%)` }} />
  </div>
);

// ─── AdminLeadDetailModal ─────────────────────────────────────────
function AdminLeadDetailModal({ lead, open, onClose, onUpdate, onDelete, team, changedBy = "Admin" }) {
  const [local, setLocal]   = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const prevId  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && lead && lead.id !== prevId.current) {
      setLocal({ ...lead, comments:[...lead.comments] });
      setComment(""); setConfirmDel(false);
      prevId.current = lead.id;
    }
    if (!open) { prevId.current = null; setAssignOpen(false); setCommentOpen(false); setConfirmDel(false); }
  }, [open, lead]);

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.classList.add("modal-open");
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = parseInt(document.body.style.top || "0") * -1;
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || "0") * -1;
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      if (scrollY) window.scrollTo(0, scrollY);
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
    setSaving(true); await onUpdate(local, changedBy, null); setSaving(false); onClose();
  }, [local, onUpdate, onClose, changedBy]);

  const handleDelete = useCallback(async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true); await onDelete(local.id); setDeleting(false); onClose();
  }, [confirmDel, local, onDelete, onClose]);

  if (!open || !local) return null;

  const meta       = STATUS_META[local.status] || STATUS_META.new;
  const isCallback = local.status === "callback";
  const agent      = team.find(t => t.id === local.assignedTo);

  return createPortal(
    <>
      <style>{STYLES}</style>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:200,
        background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)",
        opacity: 1,
      }} />

      {/* Sheet */}
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}>
        <div onClick={e=>e.stopPropagation()} style={{
          width:"100%", maxWidth:430,
          borderRadius:"22px 22px 0 0",
          border:`1px solid ${C.border}`,
          borderTop:`3px solid transparent`,
          backgroundImage:`linear-gradient(145deg,#1C1C22 0%,#141418 100%), linear-gradient(90deg, ${C.red} 0%, 60%, transparent 100%)`,
          backgroundOrigin:"border-box",
          backgroundClip:"padding-box, border-box",
          boxShadow:`0 -8px 48px rgba(204,21,21,.18)`,
          display:"flex", flexDirection:"column", maxHeight:"calc(100dvh - 60px)",
          overflow:"hidden",
        }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
            <div style={{ width:36, height:4, borderRadius:99, background:C.border }} />
          </div>

          {/* Lead header */}
          <div style={{ padding:"16px 18px 0", flexShrink:0 }}>
            <div style={{
              background:C.cardAlt, border:`1px solid ${C.border}`,
              borderRadius:14, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:14,
              position:"relative", overflow:"hidden",
            }}>
              {/* Gradient left border — thick top fades down */}
              <div style={{
                position:"absolute", left:0, top:0, bottom:0, width:3,
                background:`linear-gradient(180deg, ${C.red} 0%, transparent 100%)`,
                borderRadius:"14px 0 0 14px",
              }} />

              {/* Avatar */}
              <div style={{
                width:46, height:46, borderRadius:12, flexShrink:0,
                background:C.black, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.1rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif",
              }}>{(local.name||"?").charAt(0)}</div>

              {/* Name + phone — CENTERED */}
              <div style={{ flex:1, minWidth:0, textAlign:"center" }}>
                <div style={{ fontSize:".95rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{local.name}</div>
                <div style={{ fontSize:".68rem", color:C.gray, marginTop:3, fontFamily:"Archivo,sans-serif" }}>{local.phone}</div>
              </div>

              {/* Status pill */}
              <div style={{ background:C.card, borderRadius:6, padding:"5px 11px", border:`1px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:meta.color }} />
                <span style={{ fontSize:".6rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>{meta.label}</span>
              </div>
            </div>
          </div>

          {/* Scrollable */}
          <div
            style={{ overflowY:"auto", padding:"14px 18px 16px", display:"flex", flexDirection:"column", gap:10, WebkitOverflowScrolling:"touch" }}
            onTouchMove={e => e.stopPropagation()}
          >

            {/* ── ACTIONS SECTION ── */}
            <SectionHeader label="Actions" />

            {/* Assign */}
            <div onClick={() => setAssignOpen(true)} className="tap-btn" style={{
              display:"flex", alignItems:"center", gap:10,
              background:C.cardAlt, borderRadius:12, padding:"10px 14px",
              cursor:"pointer", border:`1px solid ${C.border}`,
              position:"relative", paddingLeft:17,
            }}>
              {/* Gradient left border */}
              <div style={{
                position:"absolute", left:0, top:0, bottom:0, width:3,
                background:`linear-gradient(180deg, ${C.red} 0%, transparent 100%)`,
                borderRadius:"12px 0 0 12px",
                pointerEvents:"none",
              }} />
              <div style={{ width:30, height:30, borderRadius:8, background:"#1a1a1a", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={C.white}><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
              </div>
              <span style={{ fontSize:".75rem", fontWeight:700, color: agent ? C.silver : C.gray, fontFamily:"Archivo,sans-serif", flex:1 }}>
                {agent ? agent.name : "Assign Sales"}
              </span>
              {agent && <span style={{ fontSize:".6rem", color:C.gray, fontWeight:700, fontFamily:"Archivo,sans-serif" }}>Change →</span>}
              {!agent && <svg width="12" height="12" viewBox="0 0 256 256" fill={C.gray}><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>}
            </div>

            {/* ── STATUS SECTION ── */}
            <SectionHeader label="Status" />
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {STATUS_ORDER.filter(s => s !== "new").map(s => {
                const m = STATUS_META[s];
                const active = local.status === s;
                return (
                  <button key={s} className="chip-btn" onClick={() => set("status", s)} style={{
                    padding:"5px 10px", borderRadius:6,
                    border:`1px solid ${active ? C.red+"66" : C.border}`,
                    cursor:"pointer", fontFamily:"Archivo,sans-serif",
                    fontSize:".63rem", fontWeight:700,
                    background: active ? `${C.red}18` : C.cardAlt,
                    color: active ? C.white : C.gray,
                    display:"flex", alignItems:"center", gap:5,
                  }}>
                    {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />}
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Callback schedule */}
            {isCallback && (
              <>
                <SectionHeader label="Callback Schedule" />
                <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".6rem", color:C.gray, fontWeight:700, marginBottom:5, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>DATE</div>
                      <input type="date" value={local.callbackDate||""} onChange={e => set("callbackDate", e.target.value)} style={{ ...inputBase, fontSize:".8rem" }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".6rem", color:C.gray, fontWeight:700, marginBottom:5, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>TIME</div>
                      <input type="time" value={local.callbackTime||""} onChange={e => set("callbackTime", e.target.value)} style={{ ...inputBase, fontSize:".8rem" }} />
                    </div>
                  </div>
                  {local.callbackDate && local.callbackTime && (
                    <div style={{ marginTop:8, fontSize:".7rem", color:C.silver, fontWeight:700, fontFamily:"Archivo,sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:C.red }} />
                      {new Date(`${local.callbackDate}T${local.callbackTime}`).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── BUDGET SECTION ── */}
            <SectionHeader label="Client" />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Property type */}
              <div style={{ display:"flex", gap:6 }}>
                {[
                  { key:"residential", label:"Residential" },
                  { key:"commercial",  label:"Commercial"  },
                  { key:"admin",       label:"Admin"       },
                ].map(t => {
                  const active = local.clientInfo?.type === t.key;
                  return (
                    <button key={t.key} className="chip-btn" onClick={() => set("clientInfo",{...local.clientInfo, type:t.key})} style={{
                      flex:1, padding:"7px 4px", borderRadius:9,
                      border:`1px solid ${active ? C.red+"66" : C.border}`, cursor:"pointer",
                      fontFamily:"Archivo,sans-serif", fontSize:".68rem", fontWeight:700,
                      background: active ? `${C.red}18` : C.cardAlt,
                      color: active ? C.white : C.gray,
                      transition:"all .15s",
                    }}>{t.label}</button>
                  );
                })}
              </div>
              {/* Budget */}
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", display:"flex", alignItems:"center" }}>
                  <svg width="13" height="13" viewBox="0 0 256 256" fill={C.gray}><path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48H136V24a8,8,0,0,0-16,0V40H104A48.05,48.05,0,0,0,56,88c0,30.88,26.28,48,48,48h16v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-48,0c-16.36,0-32-10.28-32-32a32,32,0,0,1,32-32h16v64Zm48,80H136V136h16a32,32,0,0,1,0,64Z"/></svg>
                </div>
                <input value={local.clientInfo?.budget||""} onChange={e => {
                  const val = e.target.value.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
                  set("clientInfo",{...local.clientInfo, budget:val});
                }} placeholder="Budget e.g. 2,500,000 EGP" style={{ ...inputBase, paddingLeft:32 }} />
              </div>
            </div>

            {/* ── COMMENTS SECTION ── */}
            <SectionHeader label="Comments" />
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
                  <div key={c.id} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`2px solid ${C.red}44`, borderRadius:7, padding:"5px 9px 3px" }}>
                    <div style={{ fontSize:".68rem", color:C.silver, fontWeight:600, lineHeight:1.4, fontFamily:"Archivo,sans-serif" }}>{c.text}</div>
                    <div style={{ fontSize:".52rem", color:C.gray, marginTop:1, display:"flex", justifyContent:"space-between", fontFamily:"Archivo,sans-serif" }}>
                      <span>{c.by}</span><span>{c.time}</span>
                    </div>
                  </div>
                ))
              : <div style={{ textAlign:"center", padding:"4px 0", color:C.gray, fontSize:".68rem", fontFamily:"Archivo,sans-serif" }}>No comments yet</div>
            }

            <div style={{ height:2 }} />

            {/* ── CHANGELOG SECTION ── */}
            {local.changelog && local.changelog.length > 0 && (
              <>
                <SectionHeader label="Edit History" />
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {local.changelog.map((entry, i) => {
                    const hasChanges = entry.changes && entry.changes.length > 0;
                    return (
                      <div key={i} style={{
                        background: C.cardAlt,
                        border: `1px solid ${C.border}`,
                        borderLeft: `3px solid #f59e0b`,
                        borderRadius: 10,
                        padding: "9px 11px",
                        fontFamily: "Archivo, sans-serif",
                      }}>
                        {/* Header: من + امتى */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: hasChanges || entry.comment ? 7 : 0 }}>
                          <span style={{ fontSize:".63rem", fontWeight:800, color:"#f59e0b", display:"flex", alignItems:"center", gap:4 }}>
                            <svg width="10" height="10" viewBox="0 0 256 256" fill="#f59e0b"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
                            {entry.by || "Unknown"}
                          </span>
                          <span style={{ fontSize:".58rem", color: C.gray, fontFamily:"Archivo,sans-serif" }}>
                            {new Date(entry.at).toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" })}
                          </span>
                        </div>

                        {/* التغييرات: من → إلى */}
                        {hasChanges && entry.changes.map((c, j) => (
                          <div key={j} style={{
                            display:"flex", alignItems:"center", gap:5, flexWrap:"wrap",
                            fontSize:".65rem", marginBottom: j < entry.changes.length - 1 ? 4 : 0,
                            fontFamily:"Archivo,sans-serif",
                          }}>
                            <span style={{ color: C.gray, minWidth:60 }}>{c.field}:</span>
                            <span style={{
                              background:"#ef444420", border:"1px solid #ef444440",
                              color:"#ef4444", padding:"1px 7px", borderRadius:4, fontWeight:700,
                              maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{String(c.from || "—")}</span>
                            <span style={{ color: C.gray, fontSize:".6rem" }}>→</span>
                            <span style={{
                              background:"#10b98120", border:"1px solid #10b98140",
                              color:"#10b981", padding:"1px 7px", borderRadius:4, fontWeight:700,
                              maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{String(c.to || "—")}</span>
                          </div>
                        ))}

                        {/* كومنت مع التعديل لو فيه */}
                        {entry.comment && (
                          <div style={{
                            marginTop: hasChanges ? 7 : 0,
                            fontSize: ".64rem", color: C.silver,
                            background: C.card,
                            borderRadius: 6, padding: "5px 9px",
                            borderLeft: `2px solid ${C.blue}`,
                            lineHeight: 1.5,
                            fontFamily:"Archivo,sans-serif",
                          }}>
                            <span style={{ color: C.blue, fontWeight:700, marginRight:4 }}>💬</span>
                            {entry.comment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ height:2 }} />
          </div>

          {/* Footer */}
          <div style={{ padding:"8px 16px 10px", flexShrink:0, borderTop:`1px solid ${C.border}`, background:"#141418" }}>
            {confirmDel && (
              <div style={{ background:`${C.red}12`, border:`1px solid ${C.red}33`, borderLeft:`3px solid ${C.red}`, borderRadius:10, padding:"9px 12px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:".7rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif" }}>Confirm permanent delete?</span>
                <button onClick={() => setConfirmDel(false)} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray, fontSize:".68rem", fontFamily:"Archivo,sans-serif", fontWeight:700 }}>Cancel ✕</button>
              </div>
            )}
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              {/* Trash button */}
              <button className="tap-btn" onClick={handleDelete} disabled={deleting} style={{
                width:38, height:38, borderRadius:9,
                border:`1px solid ${confirmDel ? C.red : C.border}`,
                background: confirmDel ? `${C.red}18` : C.cardAlt,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", flexShrink:0, transition:"all .15s",
              }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={confirmDel ? C.red : C.gray}>
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z"/>
                </svg>
              </button>
              {/* Close */}
              <button onClick={onClose} style={{
                flex:1, padding:"9px 0", borderRadius:9,
                border:`1px solid ${C.border}`, background:C.cardAlt, color:C.gray,
                fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:700, cursor:"pointer",
              }}>Close</button>
              {/* Save */}
              <button className="tap-btn" onClick={handleSave} disabled={saving} style={{
                flex:2, padding:"9px 0", borderRadius:9, border:"none",
                background: saving ? C.gray : C.red,
                color:"#fff", boxShadow: saving ? "none" : `0 4px 14px ${C.red}44`,
                fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:800, cursor:"pointer",
              }}>{saving ? "Saving..." : "Save Changes"}</button>
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

      {commentOpen && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={e => { if (e.target===e.currentTarget) { setCommentOpen(false); setComment(""); } }}
        >
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, padding:"16px 16px 28px", boxShadow:`0 -8px 40px rgba(204,21,21,.15)` }}>
            {/* Handle */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
              <div style={{ width:32, height:3, borderRadius:99, background:C.border }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>Add Comment</div>
              <div onClick={() => { setCommentOpen(false); setComment(""); }} style={{ width:28, height:28, borderRadius:8, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".75rem", color:C.gray }}>✕</div>
            </div>
            <textarea
              ref={inputRef}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment…"
              rows={4}
              style={{ ...inputBase, resize:"none", lineHeight:1.6, fontSize:".8rem", WebkitUserSelect:"text", userSelect:"text", borderRadius:12 }}
              autoFocus
            />
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <button onClick={() => { setCommentOpen(false); setComment(""); }} style={{
                flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${C.border}`,
                background:C.cardAlt, color:C.gray, fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:700, cursor:"pointer",
              }}>Cancel</button>
              <button className="tap-btn" onClick={handleAddComment} disabled={!comment.trim()} style={{
                flex:2, padding:"10px 0", borderRadius:10, border:"none",
                background: comment.trim() ? C.red : C.cardAlt,
                color: comment.trim() ? "#fff" : C.gray,
                fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:800, cursor: comment.trim() ? "pointer" : "default",
                boxShadow: comment.trim() ? `0 4px 14px ${C.red}44` : "none",
              }}>Add Comment</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────
function AssignModal({ lead, onClose, onAssign, onUnassign, team }) {
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, maxHeight:"50vh", overflowY:"auto", boxShadow:`0 -8px 40px rgba(204,21,21,.15)` }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
          <div style={{ width:32, height:3, borderRadius:99, background:C.border }} />
        </div>
        <div style={{ padding:"12px 16px 24px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
            <div style={{ fontSize:".8rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>Assign Sales</div>
            <div onClick={onClose} style={{ width:26, height:26, borderRadius:7, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".7rem", color:C.gray }}>✕</div>
          </div>
          {/* Agent chips — same style as status chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {team.map(agent => {
              const active = lead.assignedTo === agent.id;
              return (
                <div key={agent.id} className="chip-btn" onClick={() => active ? onUnassign() : onAssign(agent.id)} style={{
                  display:"flex", alignItems:"center", gap:5,
                  padding:"5px 10px", borderRadius:6,
                  background: active ? `${C.red}18` : C.cardAlt,
                  border: active ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
                  cursor:"pointer",
                }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
                  <span style={{ fontSize:".63rem", fontWeight:700, color: active ? C.white : C.gray, fontFamily:"Archivo,sans-serif" }}>{agent.name}</span>
                </div>
              );
            })}
          </div>
          {lead.assignedTo && (
            <div onClick={onUnassign} style={{ textAlign:"center", fontSize:".62rem", color:C.red, fontWeight:700, cursor:"pointer", padding:"4px 0", fontFamily:"Archivo,sans-serif" }}>
              Remove Assignment ✕
            </div>
          )}
        </div>
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
      background: C.cardGrad1,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      cursor: "pointer",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
      position: "relative",
    }}>
      {/* Left gradient border — thick at top, fades down */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${C.red} 0%, transparent 100%)`,
        borderRadius: "14px 0 0 14px",
      }} />
      <div style={{ padding:"13px 14px 13px 17px", display:"flex", flexDirection:"column", gap:10 }}>

        {/* Row 1: Avatar + Name/Phone + Call + WA */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Avatar */}
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:"#1a1a1a", border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:".95rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif",
          }}>{initial}</div>

          {/* Name + phone */}
          <div style={{ flex:1, minWidth:0, textAlign:"center" }}>
            <div style={{ fontFamily:"Archivo,sans-serif", fontWeight:800, fontSize:".88rem", color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.name}</div>
            <div style={{ fontFamily:"Archivo,sans-serif", fontSize:".65rem", color:C.gray, marginTop:2 }}>{lead.phone}</div>
          </div>

          {/* Call button */}
          <a href={`tel:${lead.phone}`} onClick={e=>e.stopPropagation()} style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background:C.cardAlt, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            textDecoration:"none",
          }}>
            <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l-21.1-47.2a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>
          </a>

          {/* WhatsApp button */}
          <a href={`https://wa.me/${(lead.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background:C.cardAlt, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            textDecoration:"none",
          }}>
            <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72,24,24,0,0,1,19.29-23.54l11.48,22.94L101,117.11a8,8,0,0,0-.73,7.65,56.58,56.58,0,0,0,30.15,30.23,8,8,0,0,0,7.64-.87l14.24-9.5,22.87,11.43A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88,88,0,0,1-43.06-11.27,8,8,0,0,0-6.54-.67L40,216l12.94-38.4a8,8,0,0,0-.67-6.54A88,88,0,1,1,128,216Z"/></svg>
          </a>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:C.border }} />

        {/* Row 2: Status + Callback + Agent */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>

          {/* Status */}
          <div style={{
            fontSize:".68rem", fontWeight:700, color:C.white,
            background:C.cardAlt, padding:"6px 12px", borderRadius:7,
            border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            display:"flex", alignItems:"center", gap:6,
          }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:meta.color, flexShrink:0 }} />
            {meta.label}
          </div>

          {/* Callback date */}
          {hasCallback && (
            <div style={{
              fontSize:".6rem", fontWeight:600, color:C.silver,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            }}>
              {new Date(`${lead.callbackDate}T${lead.callbackTime}`).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"})}
            </div>
          )}

          {/* Agent */}
          {agent ? (
            <div style={{
              fontSize:".6rem", fontWeight:600, color:C.silver,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            }}>{agent.name.split(" ")[0]}</div>
          ) : (
            <div style={{
              fontSize:".6rem", color:C.gray,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px dashed ${C.border}`, fontFamily:"Archivo,sans-serif",
            }}>غير موزع</div>
          )}

          {/* Budget badge */}
          {lead.clientInfo?.budget && (
            <div style={{
              fontSize:".6rem", fontWeight:600, color:C.silver,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <svg width="9" height="9" viewBox="0 0 256 256" fill={C.gray}><path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48H136V24a8,8,0,0,0-16,0V40H104A48.05,48.05,0,0,0,56,88c0,30.88,26.28,48,48,48h16v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-48,0c-16.36,0-32-10.28-32-32a32,32,0,0,1,32-32h16v64Zm48,80H136V136h16a32,32,0,0,1,0,64Z"/></svg>
              {lead.clientInfo.budget}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ─── Modals ───────────────────────────────────────────────────────
function ModalWrap({ onClose, title, children }) {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        onTouchMove={e=>e.stopPropagation()}
        style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, maxHeight:"88vh", overflowY:"auto", padding:"20px 16px 24px", boxShadow:`0 -8px 40px rgba(204,21,21,.18)` }}>
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
    <ModalWrap onClose={onClose} title="Add Lead Manually">
      <Field label="Name"    value={form.name}  onChange={v=>set("name",v)}  placeholder="Full name" />
      <Field label="Phone"   value={form.phone} onChange={v=>set("phone",v)} placeholder="010XXXXXXXX" type="tel" />
      <Field label="Note (optional)" value={form.note} onChange={v=>set("note",v)} placeholder="..." />
      <PrimaryBtn label={loading ? "Adding..." : "Add Lead"} disabled={loading} onClick={async () => {
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
    <ModalWrap onClose={onClose} title="Upload Excel File">
      {!done ? (
        <>
          <div onClick={() => fileRef.current.click()} style={{ border:`1px dashed ${C.border}`, borderRadius:12, padding:"24px 16px", textAlign:"center", cursor:"pointer", marginBottom:12, background:C.cardAlt }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
              <svg width="28" height="28" viewBox="0 0 256 256" fill={C.white}><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-45.54-48.87L136,195.31l-18.46-28.18a8,8,0,1,0-13.08,9.18L124.69,208l-20.23,31.69a8,8,0,1,0,13.08,9.18L136,220.69l18.46,28.18a8,8,0,0,0,13.08-9.18L147.31,208l20.23-31.69a8,8,0,0,0-13.08-9.18Z"/></svg>
            </div>
            <div style={{ fontSize:".72rem", fontWeight:700, color:C.white, fontFamily:"Archivo,sans-serif" }}>Tap to upload CSV</div>
            <div style={{ fontSize:".58rem", color:C.gray, marginTop:2, fontFamily:"Archivo,sans-serif" }}>CSV (name, phone, project)</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleFile} />
          {rows.length > 0 && (
            <>
              <div style={{ fontSize:".62rem", color:C.red, fontWeight:700, marginBottom:8, fontFamily:"Archivo,sans-serif" }}>✓ {rows.length} leads ready</div>
              {rows.slice(0,4).map((r,i) => (
                <div key={i} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`2px solid ${C.red}44`, borderRadius:8, padding:"7px 10px", marginBottom:5, fontSize:".62rem", color:C.silver, fontFamily:"Archivo,sans-serif" }}>{r.name} — {r.phone}</div>
              ))}
              {rows.length > 4 && <div style={{ fontSize:".58rem", color:C.gray, marginBottom:8, fontFamily:"Archivo,sans-serif" }}>and {rows.length - 4} more...</div>}
              <PrimaryBtn label={loading ? "Importing..." : `Import ${rows.length} Leads`} disabled={loading} onClick={async () => {
                setLoading(true); for (const r of rows) await onAdd({...r,source:"excel"}); setLoading(false); setDone(true);
              }} />
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <svg width="36" height="36" viewBox="0 0 256 256" fill={C.red}><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
          </div>
          <div style={{ fontSize:".8rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", marginBottom:14 }}>Import successful!</div>
          <PrimaryBtn label="Close" onClick={onClose} />
        </div>
      )}
    </ModalWrap>
  );
}

function FacebookModal({ onClose }) {
  return (
    <ModalWrap onClose={onClose} title="Facebook Leads">
      <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:12, padding:"18px 16px", textAlign:"center", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#1a1a1a", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" viewBox="0 0 256 256" fill={C.white}><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"/></svg>
          </div>
        </div>
        <div style={{ fontSize:".75rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", marginBottom:4 }}>Facebook Lead Ads</div>
        <div style={{ fontSize:".62rem", color:C.gray, fontFamily:"Archivo,sans-serif" }}>Facebook API integration coming soon</div>
      </div>
      <PrimaryBtn label="Close" onClick={onClose} />
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
    const scrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const options = [
    {
      key:"facebook", label:"Facebook Leads",
      icon: <svg width="16" height="16" viewBox="0 0 256 256" fill={C.white}><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"/></svg>,
    },
    {
      key:"excel", label:"Excel / CSV",
      icon: <svg width="16" height="16" viewBox="0 0 256 256" fill={C.white}><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-45.54-48.87L136,195.31l-18.46-28.18a8,8,0,1,0-13.08,9.18L124.69,208l-20.23,31.69a8,8,0,1,0,13.08,9.18L136,220.69l18.46,28.18a8,8,0,0,0,13.08-9.18L147.31,208l20.23-31.69a8,8,0,0,0-13.08-9.18Z"/></svg>,
    },
    {
      key:"manual", label:"Add Manually",
      icon: <svg width="16" height="16" viewBox="0 0 256 256" fill={C.white}><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>,
    },
  ];

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:62, zIndex:300, background:"rgba(0,0,0,.75)", backdropFilter:"blur(10px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:"22px 22px 0 0", width:"100%", maxWidth:430, padding:"16px 16px 28px", boxShadow:`0 -8px 40px rgba(204,21,21,.18)` }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
          <div style={{ width:32, height:3, borderRadius:99, background:C.border }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:".82rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>Add New Lead</div>
          <div onClick={onClose} style={{ width:26, height:26, borderRadius:7, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".7rem", color:C.gray }}>✕</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {options.map(b => (
            <div key={b.key} className="tap-btn" onClick={() => { onClose(); onChoose(b.key); }} style={{
              display:"flex", alignItems:"center", gap:12,
              background:C.cardAlt, borderRadius:12, padding:"11px 14px",
              border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`,
              cursor:"pointer",
            }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"#1a1a1a", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {b.icon}
              </div>
              <span style={{ fontSize:".75rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif", flex:1 }}>{b.label}</span>
              <svg width="11" height="11" viewBox="0 0 256 256" fill={C.gray}><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AdminLeadsPage({ onModalChange, externalModalOpen = false, initialFilter = null }) {
  const [leads, setLeads]       = useState([]);
  const [team, setTeam]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatus] = useState(initialFilter?.status || "all");
  const [showFilters, setFilters] = useState(false);
  const [filterAgent, setFilterAgent] = useState(initialFilter?.agent_id ? String(initialFilter.agent_id) : "all");
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [modal, setModal]       = useState(null);
  const [selectedLead, setSelected] = useState(null);
  const [detailOpen, setDetail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pullY, setPullY]       = useState(0);
  const [pulling, setPulling]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const bodyRef = useRef(null);

  // ✅ P0-3: Bulk Operations State (مطابق AdminLeadsController في Flutter)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [longPressTimer, setLongPressTimer] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, teamData] = await Promise.all([fetchLeads(), fetchTeam()]);
    setLeads(leadsData); setTeam(teamData); setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ✅ Realtime: أي تغيير في DB يظهر فورًا (INSERT / UPDATE / DELETE)
  useEffect(() => {
    const unsub = subscribeToLeads(({ type, lead, id }) => {
      if (type === "INSERT") {
        setLeads(prev => {
          // امنع التكرار لو الليد موجود أصلًا (من handleAddLead optimistic update)
          if (prev.some(l => l.id === lead.id)) return prev;
          return [lead, ...prev];
        });
      }
      if (type === "UPDATE") {
        setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        // لو المودال مفتوح على نفس الليد، حدّث الـ selected عشان الـ changelog يظهر
        setSelected(prev => prev && prev.id === lead.id ? { ...lead, comments: lead.comments } : prev);
      }
      if (type === "DELETE") {
        setLeads(prev => prev.filter(l => l.id !== id));
      }
    });
    return unsub;
  }, []);

  // Hide BottomNav when any modal is open
  const anyModalOpen = detailOpen || !!modal || !!deleteTarget || externalModalOpen;
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
    // Only activate pull indicator after intentional downward drag (>12px) at the very top
    if (delta > 12 && delta < 90) { setPulling(true); setPullY(delta); }
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

  const handleUpdateLead = async (updated, changedBy = "Admin", comment = null) => {
    const result = await dbUpdateLead(updated, changedBy, comment);
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

  // ✅ Move filtered/counts here (before bulk handlers that depend on `filtered`)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const ms = !q || (l.name||"").toLowerCase().includes(q) || (l.phone||"").includes(q) || (l.project||"").toLowerCase().includes(q);
      const mst = statusFilter==="all" || l.status===statusFilter;
      const ma  = filterAgent==="all" || (filterAgent==="unassigned" ? !l.assignedTo : String(l.assignedTo)===String(filterAgent));
      return ms && mst && ma;
    });
  }, [leads, search, statusFilter, filterAgent]);

  const counts = useMemo(() =>
    ALL_STATUSES.reduce((acc,s) => {
      acc[s] = s==="all" ? leads.length : leads.filter(l=>l.status===s).length;
      return acc;
    }, {}), [leads]);

  // ════════════════════════════════════════════════════════════════
  // ✅ P0-3: BULK OPERATIONS (مطابق AdminLeadsController في Flutter)
  // ════════════════════════════════════════════════════════════════

  // تفعيل/إلغاء وضع التحديد
  const enterSelectionMode = useCallback((leadId) => {
    setSelectionMode(true);
    setSelectedIds(new Set([leadId]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // تحديد/إلغاء تحديد lead واحد
  const toggleLeadSelection = useCallback((leadId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      // لو كل المحدد اتمسح، اخرج من وضع التحديد
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  }, []);

  // تحديد/إلغاء تحديد كل الـ filtered
  const selectAllFiltered = useCallback(() => {
    setSelectedIds(prev => {
      // لو كلهم محددين بالفعل → إلغاء التحديد
      if (prev.size === filtered.length) {
        setSelectionMode(false);
        return new Set();
      }
      return new Set(filtered.map(l => l.id));
    });
  }, [filtered]);

  // Long-press handlers (للدخول لوضع التحديد)
  const handleCardLongPress = useCallback((leadId) => {
    if (!selectionMode) enterSelectionMode(leadId);
  }, [selectionMode, enterSelectionMode]);

  const handleCardClick = useCallback((lead) => {
    if (selectionMode) {
      toggleLeadSelection(lead.id);
    } else {
      setSelected(lead);
      setDetail(true);
    }
  }, [selectionMode, toggleLeadSelection]);

  // ── Bulk Status Update ──
  const handleBulkStatus = useCallback(async (newStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setLoading(true);
    const result = await dbBulkUpdateStatus(ids, newStatus, "Admin");
    if (result.ok) {
      // تحديث local state (optimistic)
      setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l));
    }
    exitSelectionMode();
    setLoading(false);
  }, [selectedIds, exitSelectionMode]);

  // ── Bulk Assign ──
  const handleBulkAssign = useCallback(async (agentId) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setLoading(true);
    const result = await dbBulkAssign(ids, agentId, "Admin");
    if (result.ok) {
      setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, assignedTo: agentId } : l));
    }
    exitSelectionMode();
    setLoading(false);
  }, [selectedIds, exitSelectionMode]);

  // ── Bulk Delete ──
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setLoading(true);
    const result = await dbBulkDelete(ids);
    if (result.ok) {
      setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    }
    exitSelectionMode();
    setLoading(false);
  }, [selectedIds, exitSelectionMode]);

  // ── Export CSV (للمحددين أو للـ filtered كاملة لو مفيش تحديد) ──
  const handleExportCsv = useCallback(() => {
    const ids = Array.from(selectedIds);
    const leadsToExport = ids.length > 0
      ? leads.filter(l => ids.includes(l.id))
      : filtered;
    // team map لتحويل assigned_id إلى اسم
    const teamMap = {};
    team.forEach(t => { teamMap[t.id] = t; });
    exportLeadsToCsv(leadsToExport, teamMap);
    if (ids.length > 0) exitSelectionMode();
  }, [selectedIds, leads, filtered, team, exitSelectionMode]);

  const page = (
    <div style={{
      fontFamily:"Archivo, sans-serif",
      background:"transparent",
      color:C.white,
      colorScheme:"dark",
      userSelect:"none", WebkitUserSelect:"none",
      display:"flex", flexDirection:"column",
      minHeight:"100%",
      position:"relative",
    }}>
      <style>{STYLES}</style>

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
        style={{
          flex:1, padding:"12px 14px 0",
          display:"flex", flexDirection:"column", gap:9,
        }}
      >
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
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:14, padding:"12px", display:"flex", flexDirection:"column", gap:9 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {ALL_STATUSES.map(s => {
                const m = s!=="all" ? STATUS_META[s] : null;
                const active = statusFilter===s;
                return (
                  <button key={s} className="chip-btn" onClick={()=>setStatus(s)} style={{
                    padding:"5px 10px", borderRadius:6,
                    border:`1px solid ${active ? C.red+"66" : C.border}`,
                    cursor:"pointer", fontFamily:"Archivo,sans-serif", fontSize:".62rem", fontWeight:700,
                    background: active ? `${C.red}15` : C.cardAlt,
                    color: active ? C.white : C.gray,
                    display:"flex", alignItems:"center", gap:5,
                  }}>
                    {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />}
                    {s==="all" ? `All (${counts.all})` : `${m.label} (${counts[s]})`}
                  </button>
                );
              })}
            </div>
            {/* Agent picker button */}
            <div onClick={() => setAgentPickerOpen(true)} className="tap-btn" style={{
              display:"flex", alignItems:"center", gap:5,
              background: filterAgent!=="all" ? `${C.red}12` : C.card,
              borderRadius:9, padding:"6px 12px",
              border:`1px solid ${filterAgent!=="all" ? C.red+"44" : C.border}`,
              cursor:"pointer", alignSelf:"flex-start",
            }}>
              <svg width="10" height="10" viewBox="0 0 256 256" fill={filterAgent!=="all" ? C.red : C.gray}><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
              <span style={{ fontSize:".65rem", fontWeight:700, color: filterAgent!=="all" ? C.red : C.gray, fontFamily:"Archivo,sans-serif" }}>
                {filterAgent==="all" ? "All Sales" : filterAgent==="unassigned" ? "Unassigned" : team.find(t=>t.id===filterAgent)?.name || "All Sales"}
              </span>
            </div>

            {/* Agent picker modal — centered */}
            {agentPickerOpen && (
              <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:400, background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px" }}
                onClick={e => { if (e.target===e.currentTarget) setAgentPickerOpen(false); }}
              >
                <div onClick={e=>e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.red}`, borderRadius:20, padding:"20px 16px", width:"100%", maxWidth:360, boxShadow:`0 8px 40px rgba(204,21,21,.2)` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ fontSize:".82rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>Filter by Sales</div>
                    <div onClick={() => setAgentPickerOpen(false)} style={{ width:26, height:26, borderRadius:7, background:C.cardAlt, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".7rem", color:C.gray }}>✕</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {[
                      { id:"all", name:"All Sales" },
                      { id:"unassigned", name:"Unassigned" },
                      ...team,
                    ].map(opt => {
                      const active = filterAgent === opt.id;
                      return (
                        <div key={opt.id} className="chip-btn" onClick={() => { setFilterAgent(opt.id); setAgentPickerOpen(false); }} style={{
                          display:"flex", alignItems:"center", gap:5,
                          padding:"5px 10px", borderRadius:6,
                          background: active ? `${C.red}18` : C.cardAlt,
                          border: active ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
                          cursor:"pointer",
                        }}>
                          {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />}
                          <span style={{ fontSize:".63rem", fontWeight:700, color: active ? C.white : C.gray, fontFamily:"Archivo,sans-serif" }}>{opt.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lead list */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, paddingBottom: selectionMode ? 180 : 100 }}>
          {loading
            ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif", animation:"pulse 1.5s ease infinite" }}>⏳ Loading...</div>
            : filtered.length===0
              ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif" }}>No leads found 🔍</div>
              : filtered.map((lead,i) => (
                  <div
                    key={lead.id}
                    className="lead-item"
                    style={{
                      animationDelay:`${i*22}ms`,
                      position: "relative",
                      // إبراز الـ card المحدد
                      outline: selectionMode && selectedIds.has(lead.id) ? `2px solid ${C.red}` : "none",
                      outlineOffset: -1,
                      borderRadius: 12,
                    }}
                    // ✅ P0-3: long-press لتفعيل وضع التحديد (مطابق Flutter)
                    onTouchStart={(e) => {
                      if (selectionMode) return;
                      const timer = setTimeout(() => {
                        handleCardLongPress(lead.id);
                        // vibration لو متاح
                        if (navigator.vibrate) navigator.vibrate(50);
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
                    }}
                    onTouchMove={() => {
                      if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
                    }}
                  >
                    {/* ✅ P0-3: checkbox overlay في وضع التحديد */}
                    {selectionMode && (
                      <SelectionCheckbox
                        checked={selectedIds.has(lead.id)}
                        onToggle={() => toggleLeadSelection(lead.id)}
                      />
                    )}
                    <AdminLeadCard
                      lead={lead}
                      onClick={() => handleCardClick(lead)}
                      onDelete={requestDelete}
                      team={team}
                    />
                  </div>
                ))
          }
        </div>
      </div>

      {/* ✅ P0-3: BulkActionBar — يظهر فقط في وضع التحديد */}
      {selectionMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalFiltered={filtered.length}
          team={team}
          onBulkStatus={handleBulkStatus}
          onBulkAssign={handleBulkAssign}
          onBulkDelete={handleBulkDelete}
          onExportCsv={handleExportCsv}
          onSelectAll={selectAllFiltered}
          onClear={exitSelectionMode}
        />
      )}

    </div>
  );

  return (
    <>
      {page}
      {/* FAB — fixed so it always floats above BottomNav regardless of scroll container */}
      {/* ✅ P0-3: إخفاء الـ FAB في وضع التحديد */}
      {!anyModalOpen && !selectionMode && (
        <div
          onClick={() => setModal("fab")}
          className="tap-btn"
          style={{
            position:"fixed",
            bottom:76,
            right:20,
            width:54, height:54, borderRadius:"50%",
            background:C.red, boxShadow:`0 6px 24px ${C.red}66`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", zIndex:200,
            touchAction:"none",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 256 256" fill="#fff"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        </div>
      )}
    </>
  );
}
