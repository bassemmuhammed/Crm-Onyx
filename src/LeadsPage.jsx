import Icons             from "./Icons";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ─── ONYX Design Tokens ──────────────────────────────────────────
const C = {
  black:    "#000000",
  surface:  "#0D0D0D",
  card:     "#161618",
  border:   "#2A2A2E",
  cardAlt:  "#1E1E22",
  gray:     "#6B6C73",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  blue:     "#253FF6",
  cardGrad1: "linear-gradient(145deg,#1A1A1E 0%,#141416 100%)",
  cardGrad2: "linear-gradient(145deg,#1C1C22 0%,#141418 100%)",
};

// ─── نفس الـ statuses بالظبط زي AdminLeadsPage ───────────────────
const STATUS_META = {
  new:             { label: "New",             color: "#10b981", bg: "#10b98120" },
  callback:        { label: "Call Back",       color: "#f59e0b", bg: "#f59e0b20" },
  pendingMeeting:  { label: "Pending Meeting", color: "#253FF6", bg: "#253FF620" },
  meetingDone:     { label: "Meeting Done",    color: "#a855f7", bg: "#a855f720" },
  deal:            { label: "Deal",            color: "#CC1515", bg: "#CC151520" },
  onGoing:         { label: "On Going",        color: "#06b6d4", bg: "#06b6d420" },
  lowBudget:       { label: "Low Budget",      color: "#f97316", bg: "#f9731620" },
  noAnswer:        { label: "No Answer",       color: "#8b949e", bg: "#8b949e20" },
  notInterested:   { label: "Not Interested",  color: "#6b7280", bg: "#6b728020" },
  chooseCompetitor:{ label: "Competitor",      color: "#ec4899", bg: "#ec489920" },
  longTerm:        { label: "Long Term",       color: "#8b5cf6", bg: "#8b5cf620" },
  closed:          { label: "Closed",          color: "#374151", bg: "#37415130" },
};

const STATUS_ORDER = ["new","callback","pendingMeeting","meetingDone","deal","onGoing","lowBudget","noAnswer","notInterested","chooseCompetitor","longTerm","closed"];
const ALL_STATUSES = ["all", ...STATUS_ORDER];

const LEADS_INIT = [
  { id:1, name:"Mohamed Abdullah", phone:"+20 101 234 5678", source:"Facebook Ad", status:"new",      project:"Scenario – New Capital", priority:"high", comments:[], callbackDate:"", callbackTime:"", clientInfo:{ type:"", budget:"" } },
  { id:2, name:"Sara Hassan",      phone:"+20 112 345 6789", source:"Website",     status:"callback", project:"Azha – North Coast",     priority:"high", comments:[], callbackDate:"2026-06-02", callbackTime:"10:00", clientInfo:{ type:"", budget:"" } },
];

const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";

const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
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
  input, select { color-scheme: dark }
  ::placeholder { color:#595A5F !important; opacity:1 }
  select option { background:#252525; color:#fff }
`;

const inputBase = {
  width:"100%", padding:"10px 14px", borderRadius:10,
  border:`1.5px solid ${C.border}`, outline:"none",
  fontSize:".82rem", fontWeight:600, color:C.white,
  fontFamily:"Archivo, sans-serif", background:C.cardAlt,
};

// ─── Divider (نفس الريفرنس) ───────────────────────────────────────
const Div = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    {label && <span style={{ fontSize:".55rem", fontWeight:700, color:C.gray, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{label}</span>}
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ─── LeadDetailModal ─────────────────────────────────────────────
function LeadDetailModal({ lead, open, onClose, onUpdate }) {
  const [local, setLocal]     = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const prevId                = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    if (open && lead && lead.id !== prevId.current) {
      setLocal({ ...lead, comments: [...lead.comments] });
      setComment("");
      prevId.current = lead.id;
    }
    if (!open) prevId.current = null;
  }, [open, lead]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const set = useCallback((k, v) => setLocal(l => ({ ...l, [k]: v })), []);

  const handleAddComment = useCallback(() => {
    const text = comment.trim();
    if (!text || !local) return;
    const entry = { id: Date.now(), text, by: "Me", time: new Date().toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" }) };
    setLocal(l => ({ ...l, comments: [entry, ...l.comments] }));
    setComment("");
    inputRef.current?.focus();
  }, [comment, local]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await onUpdate(local);
    setSaving(false);
    onClose();
  }, [local, onUpdate, onClose]);

  if (!open || !local) return null;

  const meta       = STATUS_META[local.status] || STATUS_META.new;
  const isCallback = local.status === "callback";

  return (
    <>
      <style>{STYLES}</style>
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:200,
        background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)",
      }} />
      <div onClick={onClose} style={{
        position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width:"100%", maxWidth:430,
          background:C.card, borderRadius:"22px 22px 0 0",
          borderTop:`2px solid transparent`,
          backgroundImage:`linear-gradient(${C.card}, ${C.card}), linear-gradient(90deg, ${C.red} 0%, ${C.red} 40%, transparent 100%)`,
          backgroundOrigin:"border-box",
          backgroundClip:"padding-box, border-box",
          boxShadow:`0 -8px 48px rgba(204,21,21,.18)`,
          display:"flex", flexDirection:"column", maxHeight:"calc(100dvh - 60px)",
          overflow:"hidden",
        }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
            <div style={{ width:36, height:4, borderRadius:99, background:C.border }} />
          </div>

          {/* Lead header */}
          <div style={{ padding:"16px 18px 0", flexShrink:0 }}>
            <div style={{
              background:C.cardAlt, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${C.red}`,
              borderRadius:14, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{
                width:46, height:46, borderRadius:12, flexShrink:0,
                background:C.black, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.1rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif",
              }}>{(local.name || "?").charAt(0)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".95rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{local.name}</div>
                <div style={{ fontSize:".68rem", color:C.gray, marginTop:3, fontFamily:"Archivo,sans-serif" }}>{local.phone}</div>
              </div>
              <div style={{ background:C.card, borderRadius:6, padding:"5px 11px", border:`1px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:meta.color }} />
                <span style={{ fontSize:".6rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>{meta.label}</span>
              </div>
            </div>

            {/* Action buttons: Call + WhatsApp + Share */}
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <a href={`tel:${local.phone}`} style={{
                flex:1, height:40, borderRadius:10, flexShrink:0,
                background:C.cardAlt, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                textDecoration:"none",
              }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l-21.1-47.2a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>
                <span style={{ fontSize:".65rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>Call</span>
              </a>
              <a href={`https://wa.me/${(local.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{
                flex:1, height:40, borderRadius:10, flexShrink:0,
                background:C.cardAlt, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                textDecoration:"none",
              }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72,24,24,0,0,1,19.29-23.54l11.48,22.94L101,117.11a8,8,0,0,0-.73,7.65,56.58,56.58,0,0,0,30.15,30.23,8,8,0,0,0,7.64-.87l14.24-9.5,22.87,11.43A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88,88,0,0,1-43.06-11.27,8,8,0,0,0-6.54-.67L40,216l12.94-38.4a8,8,0,0,0-.67-6.54A88,88,0,1,1,128,216Z"/></svg>
                <span style={{ fontSize:".65rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>WhatsApp</span>
              </a>
              <button className="tap-btn" style={{
                flex:1, height:40, borderRadius:10, flexShrink:0,
                background:C.cardAlt, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                cursor:"pointer",
              }}>
                <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M229.66,109.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,112H165a88.21,88.21,0,0,0-85.23,65.31,8,8,0,0,1-15.5-4A104.06,104.06,0,0,1,165,96h39.71L170.34,62.34a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,109.66ZM88,208H72a40,40,0,0,1,0-80H88a8,8,0,0,0,0-16H72a56,56,0,0,0,0,112H88a8,8,0,0,0,0-16Z"/></svg>
                <span style={{ fontSize:".65rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>Share</span>
              </button>
            </div>
          </div>

          {/* Scrollable */}
          <div style={{ overflowY:"auto", padding:"14px 18px 16px", display:"flex", flexDirection:"column", gap:10, WebkitOverflowScrolling:"touch" }}>

            {/* Status */}
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
              <span style={{ fontSize:".55rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>STATUS</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.red}88 0%, transparent 100%)` }} />
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {STATUS_ORDER.filter(s => s !== "new").map(s => {
                const m = STATUS_META[s];
                const active = local.status === s;
                return (
                  <button key={s} className="chip-btn" onClick={() => set("status", s)} style={{
                    padding:"6px 12px", borderRadius:6,
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

            {/* Callback */}
            {isCallback && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
                  <span style={{ fontSize:".55rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>CALLBACK SCHEDULE</span>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.red}88 0%, transparent 100%)` }} />
                </div>
                <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:12, padding:"14px 16px" }}>
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
                      {new Date(`${local.callbackDate}T${local.callbackTime}`).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Client */}
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
              <span style={{ fontSize:".55rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>CLIENT</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.red}88 0%, transparent 100%)` }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[
                  { key:"residential", label:"Residential" },
                  { key:"commercial",  label:"Commercial"  },
                  { key:"admin",       label:"Admin"       },
                ].map(t => {
                  const active = local.clientInfo?.type === t.key;
                  return (
                    <button key={t.key} className="chip-btn" onClick={() => set("clientInfo", { ...local.clientInfo, type: t.key })} style={{
                      flex:1, padding:"8px 4px", borderRadius:9,
                      border:`1px solid ${active ? C.red+"66" : C.border}`, cursor:"pointer",
                      fontFamily:"Archivo,sans-serif", fontSize:".68rem", fontWeight:700,
                      background: active ? `${C.red}18` : C.cardAlt,
                      color: active ? C.white : C.gray,
                    }}>{t.label}</button>
                  );
                })}
              </div>
              <input
                value={local.clientInfo?.budget || ""}
                onChange={e => set("clientInfo", { ...local.clientInfo, budget: e.target.value })}
                placeholder="💰 Budget e.g. 2,500,000 EGP"
                style={{ ...inputBase }}
              />
            </div>

            {/* Comments */}
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
              <span style={{ fontSize:".55rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>COMMENTS</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.red}88 0%, transparent 100%)` }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input
                ref={inputRef}
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddComment()}
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
                  <div key={c.id} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderLeft:`2px solid ${C.red}44`, borderRadius:7, padding:"8px 12px 6px" }}>
                    <div style={{ fontSize:".68rem", color:C.silver, fontWeight:600, lineHeight:1.4, fontFamily:"Archivo,sans-serif" }}>{c.text}</div>
                    <div style={{ fontSize:".52rem", color:C.gray, marginTop:3, display:"flex", justifyContent:"space-between", fontFamily:"Archivo,sans-serif" }}>
                      <span>{c.by || "Me"}</span><span>{c.time}</span>
                    </div>
                  </div>
                ))
              : <div style={{ textAlign:"center", padding:"8px 0", color:C.gray, fontSize:".68rem", fontFamily:"Archivo,sans-serif" }}>No comments yet</div>
            }

            <div style={{ height:8 }} />
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 18px 14px", flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.card }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={onClose} style={{
                flex:1, padding:"11px 0", borderRadius:10,
                border:`1px solid ${C.border}`, background:C.cardAlt, color:C.gray,
                fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:700, cursor:"pointer",
              }}>Close</button>
              <button className="tap-btn" onClick={handleSave} disabled={saving} style={{
                flex:2, padding:"11px 0", borderRadius:10, border:"none",
                background: saving ? C.gray : C.red,
                color:"#fff", boxShadow: saving ? "none" : `0 4px 14px ${C.red}44`,
                fontFamily:"Archivo,sans-serif", fontSize:".75rem", fontWeight:800, cursor:"pointer",
              }}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Lead Card (نفس AdminLeadCard بالظبط) ───────────────────────
const LeadCard = ({ lead, onClick }) => {
  const meta        = STATUS_META[lead.status] || STATUS_META.new;
  const hasCallback = lead.status === "callback" && lead.callbackDate && lead.callbackTime;
  const initial     = (lead.name || "?").charAt(0).toUpperCase();

  return (
    <div className="lead-card" onClick={onClick} style={{
      background: C.cardGrad1,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.red}`,
      borderRadius: 14,
      cursor: "pointer",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
    }}>
      <div style={{ padding:"13px 14px", display:"flex", flexDirection:"column", gap:10 }}>

        {/* Row 1: Avatar + Name/Phone (half) + Call + WA */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>

          {/* Avatar */}
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background: C.black, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:".95rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif",
          }}>{initial}</div>

          {/* Name + phone — capped at ~half card width */}
          <div style={{ flex:1, minWidth:0, maxWidth:"45%" }}>
            <div style={{ fontFamily:"Archivo,sans-serif", fontWeight:800, fontSize:".88rem", color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.name}</div>
            <div style={{ fontFamily:"Archivo,sans-serif", fontSize:".65rem", color:C.gray, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.phone}</div>
          </div>

          {/* Call */}
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background:C.cardAlt, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            textDecoration:"none",
          }}>
            <svg width="15" height="15" viewBox="0 0 256 256" fill={C.silver}><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l-21.1-47.2a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>
          </a>

          {/* WhatsApp */}
          <a href={`https://wa.me/${(lead.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
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

        {/* Row 2: Status + Callback */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <div style={{
            fontSize:".6rem", fontWeight:700, color:C.silver,
            background:C.cardAlt, padding:"4px 10px", borderRadius:6,
            border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            display:"flex", alignItems:"center", gap:4,
          }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:meta.color, flexShrink:0 }} />
            {meta.label}
          </div>

          {hasCallback && (
            <div style={{
              fontSize:".6rem", fontWeight:600, color:C.silver,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            }}>
              {new Date(`${lead.callbackDate}T${lead.callbackTime}`).toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" })}
            </div>
          )}

          {lead.clientInfo?.budget && (
            <div style={{
              fontSize:".6rem", fontWeight:600, color:C.silver,
              background:C.cardAlt, padding:"4px 10px", borderRadius:6,
              border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif",
            }}>💰 {lead.clientInfo.budget}</div>
          )}
        </div>

      </div>
    </div>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function LeadsPage({ activeTab = 1, onTabChange, onSignOut, leads: externalLeads, onUpdateLead: externalUpdateLead, initialFilter }) {
  const [localLeads, setLocalLeads] = useState(() => {
    try { const saved = localStorage.getItem("onyx_leads"); return saved ? JSON.parse(saved) : LEADS_INIT; }
    catch { return LEADS_INIT; }
  });
  const leads = externalLeads ?? localLeads;

  const [search,       setSearch]   = useState("");
  const [statusFilter, setStatus]   = useState(initialFilter || "all");
  const [selectedLead, setSelected] = useState(null);
  const [detailOpen,   setDetail]   = useState(false);
  const [showFilters,  setFilters]  = useState(false);
  const [notifOpen,    setNotifOpen]   = useState(false);
  const [profileOpen,  setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id:1, text:"New lead assigned: Mohamed Abdullah",   time:"2 min ago",  color:C.blue,    unread:true  },
    { id:2, text:"Sara Hassan replied to your proposal",  time:"18 min ago", color:"#10b981", unread:true  },
    { id:3, text:"Meeting reminder: Site visit at 10 AM", time:"1 hr ago",   color:"#f59e0b", unread:true  },
    { id:4, text:"Deal closed with Khaled Ibrahim 🎉",    time:"Yesterday",  color:C.red,     unread:false },
  ]);
  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread:false })));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const ms  = !q || (l.name||"").toLowerCase().includes(q) || (l.phone||"").includes(q) || (l.project||"").toLowerCase().includes(q);
      const mst = statusFilter === "all" || l.status === statusFilter;
      return ms && mst;
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() =>
    ALL_STATUSES.reduce((acc, s) => {
      acc[s] = s === "all" ? leads.length : leads.filter(l => l.status === s).length;
      return acc;
    }, {}),
  [leads]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Apply filter from HomePage card tap
  useEffect(() => {
    if (initialFilter) setStatus(initialFilter);
    else setStatus("all");
  }, [initialFilter]);

  const openDetail  = useCallback((lead) => { setSelected(lead); setDetail(true); }, []);
  const closeDetail = useCallback(() => setDetail(false), []);

  const updateLead = useCallback((updated) => {
    if (externalUpdateLead) {
      externalUpdateLead(updated);
    } else {
      setLocalLeads(prev => {
        const next = prev.map(l => l.id === updated.id ? updated : l);
        try { localStorage.setItem("onyx_leads", JSON.stringify(next)); } catch {}
        return next;
      });
    }
    setSelected(updated);
  }, [externalUpdateLead]);

  return (
    <div style={{
      fontFamily:"Archivo,sans-serif", background:C.surface,
      minHeight:"100vh", color:C.white,
      colorScheme:"dark", userSelect:"none", WebkitUserSelect:"none",
    }}>
      <style>{STYLES}</style>
      <link href={FONT_URL} rel="stylesheet" />

      <LeadDetailModal lead={selectedLead} open={detailOpen} onClose={closeDetail} onUpdate={updateLead} />
      <NotificationPanel open={notifOpen}   onClose={() => setNotifOpen(false)}   notifs={notifs} onMarkAll={markAllRead} />
      <ProfileModal      open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />

      <AppHeader
        unreadCount={unreadCount}
        onBellClick={()    => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      <div style={{ padding:"12px 14px 0", display:"flex", flexDirection:"column", gap:9 }}>

        {/* Search */}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.gray, pointerEvents:"none" }}>
            <svg width="13" height="13" viewBox="0 0 256 256" fill={C.gray}><path d="M229.66,218.34l-50.07-50.06a88.21,88.21,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, project…"
            style={{ ...inputBase, width:"100%", padding:"11px 36px 11px 38px", borderRadius:12, background:C.card, boxShadow:"0 2px 10px rgba(0,0,0,.3)" }}
          />
          {search && (
            <div onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:C.gray, cursor:"pointer", fontSize:".75rem" }}>✕</div>
          )}
        </div>

        {/* Filter row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:".72rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>
            {filtered.length} results
            {statusFilter !== "all" && <span style={{ color:C.gray }}> · {STATUS_META[statusFilter]?.label}</span>}
          </div>
          <button className="tap-btn" onClick={() => setFilters(v => !v)} style={{
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
          <div style={{ background:C.cardGrad2, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:14, padding:"12px", display:"flex", flexDirection:"column", gap:9 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {ALL_STATUSES.map(s => {
                const m = s !== "all" ? STATUS_META[s] : null;
                const active = statusFilter === s;
                return (
                  <button key={s} className="chip-btn" onClick={() => setStatus(s)} style={{
                    padding:"5px 10px", borderRadius:6,
                    border:`1px solid ${active ? C.red+"66" : C.border}`,
                    cursor:"pointer", fontFamily:"Archivo,sans-serif", fontSize:".62rem", fontWeight:700,
                    background: active ? `${C.red}15` : C.cardAlt,
                    color: active ? C.white : C.gray,
                    display:"flex", alignItems:"center", gap:5,
                  }}>
                    {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />}
                    {s === "all" ? `All (${counts.all})` : `${m.label} (${counts[s]})`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lead list */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, paddingBottom:140 }}>
          {filtered.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif" }}>No leads found 🔍</div>
            : filtered.map((lead, i) => (
                <div key={lead.id} className="lead-item" style={{ animationDelay:`${i * 22}ms` }}>
                  <LeadCard lead={lead} onClick={() => openDetail(lead)} />
                </div>
              ))
          }
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
