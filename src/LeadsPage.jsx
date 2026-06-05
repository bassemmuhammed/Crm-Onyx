import Icons             from "./Icons";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ─── ONYX Design Tokens ──────────────────────────────────────────
const C = {
  black:    "#000000",
  surface:  "#0A0A0A",
  card:     "#111111",
  border:   "#1E1E1E",
  cardAlt:  "#252525",
  cardHover:"#2E2E2E",
  gray:     "#595A5F",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  redLight: "#FF2020",
  blue:     "#253FF6",
};

const STATUS_META = {
  "New":         { color:"#10b981", bg:"#10b98120", icon:"sparkle"   },
  "Call Back":   { color:"#f59e0b", bg:"#f59e0b20", icon:"callback"  },
  "Meeting":     { color:"#253FF6", bg:"#253FF620", icon:"meeting"   },
  "Deal":        { color:"#CC1515", bg:"#CC151520", icon:"handshake" },
  "Not Interest":{ color:"#595A5F", bg:"#595A5F20", icon:"prohibit"  },
};

const STATUS_ORDER = ["Call Back", "Meeting", "Deal", "Not Interest"];
const ALL_STATUSES = ["All", ...STATUS_ORDER];
const PRIORITY_COLOR = { high:"#CC1515", medium:"#f59e0b", low:"#253FF6" };

const LEADS_INIT = [
  { id:1, name:"Mohamed Abdullah", phone:"+20 101 234 5678", source:"Facebook Ad", status:"New",       project:"Scenario – New Capital", priority:"high", comments:[], callbackDate:"", callbackTime:"", clientInfo:{ type:"", budget:"", notes:"" } },
  { id:2, name:"Sara Hassan",      phone:"+20 112 345 6789", source:"Website",     status:"Call Back", project:"Azha – North Coast",     priority:"high", comments:[], callbackDate:"2026-06-02", callbackTime:"10:00", clientInfo:{ type:"", budget:"", notes:"" } },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
  :root { color-scheme: dark only; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes slideUp   { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
  @keyframes fadeInUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
  .lead-card    { transition: transform .15s ease }
  .lead-card:active { transform: scale(.985) }
  .chip-btn     { transition: all .15s ease }
  .chip-btn:active { transform: scale(.93) }
  .tap-btn      { transition: all .15s ease }
  .tap-btn:active { transform: scale(.94) }
  .lead-item    { animation: fadeInUp .2s ease both }
  .status-btn   { transition: all .15s ease }
  .status-btn:active { transform: scale(.95) }
  .send-btn     { transition: all .15s ease }
  .send-btn:active { transform: scale(.92) }
  .save-btn     { transition: all .15s ease }
  .save-btn:active { transform: scale(.97) }
  .filter-chip  { transition: all .15s ease }
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer; filter:invert(1) }
  ::-webkit-scrollbar { width:0; height:0 }
  input, select { color-scheme: dark }
  ::placeholder { color:${C.gray} !important; opacity:1 }
  select option { background:${C.cardAlt}; color:${C.white} }
`;

const inputBase = {
  width:"100%", padding:"10px 14px", borderRadius:10,
  border:`1.5px solid ${C.border}`, outline:"none",
  fontSize:".82rem", fontWeight:600, color:C.white,
  fontFamily:"Archivo, sans-serif", background:C.cardAlt,
};

// ─── LeadDetailModal ─────────────────────────────────────────────
function LeadDetailModal({ lead, open, onClose, onUpdate }) {
  const [local, setLocal]     = useState(null);
  const [comment, setComment] = useState("");
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

  const setField = useCallback((key, val) =>
    setLocal(l => ({ ...l, [key]: val })), []);

  const addComment = useCallback(() => {
    const text = comment.trim();
    if (!text) return;
    const entry = { id: Date.now(), text, time: new Date().toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" }) };
    setLocal(l => ({ ...l, comments: [entry, ...l.comments] }));
    setComment("");
    inputRef.current?.focus();
  }, [comment]);

  const handleSave = useCallback(() => { onUpdate(local); onClose(); }, [local, onUpdate, onClose]);

  const meta       = local ? (STATUS_META[local.status] || STATUS_META["New"]) : STATUS_META["New"];
  const isCallback = local?.status === "Call Back";
  const isMeeting  = local?.status === "Meeting";

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
        transition:"opacity .25s",
      }} />
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        pointerEvents: open ? "all" : "none",
        opacity: open ? 1 : 0, transition:"opacity .25s",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width:"100%", maxWidth:430,
          background:C.card, borderRadius:"24px 24px 0 0",
          border:`1px solid ${C.border}`, borderBottom:"none",
          boxShadow:`0 -8px 48px rgba(204,21,21,.15)`,
          display:"flex", flexDirection:"column", maxHeight:"92vh",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition:"transform .3s cubic-bezier(.32,0,.16,1)",
        }}>
          {local && <>
            {/* handle */}
            <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0", flexShrink:0 }}>
              <div style={{ width:40, height:4, borderRadius:99, background:C.border }} />
            </div>

            {/* profile strip */}
            <div style={{
              background:`linear-gradient(135deg, ${C.red} 0%, #8b0000 100%)`,
              padding:"16px 18px 18px", margin:"10px 16px 0", borderRadius:18, flexShrink:0,
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{
                width:50, height:50, borderRadius:15, flexShrink:0,
                background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.25rem", fontWeight:900, color:"#fff",
              }}>{local.name.charAt(0)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".95rem", fontWeight:800, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{local.name}</div>
                <div style={{ fontSize:".68rem", color:"rgba(255,255,255,.72)", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                  {Icons.phone} {local.phone}
                </div>
                <div style={{ fontSize:".64rem", color:"rgba(255,255,255,.6)", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                  {Icons.house} {local.project}
                </div>
              </div>
              <div style={{
                background:"rgba(255,255,255,.15)", borderRadius:99, padding:"4px 10px",
                display:"flex", alignItems:"center", gap:5, flexShrink:0,
              }}>
                <span style={{ color:"#fff" }}>{Icons[meta.icon]}</span>
                <span style={{ fontSize:".68rem", fontWeight:700, color:"#fff" }}>{local.status}</span>
              </div>
            </div>

            {/* scrollable body */}
            <div style={{ overflowY:"auto", padding:"14px 16px 8px", display:"flex", flexDirection:"column", gap:14, WebkitOverflowScrolling:"touch" }}>

              {/* status buttons */}
              <div>
                <div style={{ fontSize:".63rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Change Status</div>
                <div style={{ display:"flex", gap:6, flexWrap:"nowrap", overflowX:"auto", paddingBottom:2 }}>
                  {STATUS_ORDER.map(s => { const m = STATUS_META[s]; const active = local.status === s;
                    return (
                      <button key={s} className="status-btn" onClick={() => setField("status", s)} style={{
                        padding:"6px 10px", borderRadius:99, border:`1px solid ${active ? m.color+"66" : C.border}`,
                        cursor:"pointer", fontFamily:"Archivo,sans-serif", fontSize:".68rem", fontWeight:700,
                        background: active ? `${m.color}22` : C.cardAlt,
                        color: active ? m.color : C.gray,
                        display:"flex", alignItems:"center", gap:3, flexShrink:0, whiteSpace:"nowrap",
                      }}>
                        {active && <div style={{ width:5, height:5, borderRadius:"50%", background:m.color, flexShrink:0 }} />}
                        {Icons[m.icon]} {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* callback picker */}
              {isCallback && (
                <div style={{ background:"#f59e0b12", border:`1.5px solid #f59e0b33`, borderRadius:14, padding:"12px 14px" }}>
                  <div style={{ fontSize:".63rem", fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:.5, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                    {Icons.callback} Callback Schedule
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".62rem", color:"#f59e0b", fontWeight:600, marginBottom:4 }}>Date</div>
                      <input type="date" value={local.callbackDate} onChange={e => setField("callbackDate", e.target.value)} style={{ ...inputBase }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".62rem", color:"#f59e0b", fontWeight:600, marginBottom:4 }}>Time</div>
                      <input type="time" value={local.callbackTime} onChange={e => setField("callbackTime", e.target.value)} style={{ ...inputBase }} />
                    </div>
                  </div>
                  {local.callbackDate && local.callbackTime && (
                    <div style={{ marginTop:8, fontSize:".72rem", color:"#f59e0b", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                      {Icons.meeting} Scheduled: {new Date(`${local.callbackDate}T${local.callbackTime}`).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })}
                    </div>
                  )}
                </div>
              )}

              {/* meeting picker */}
              {isMeeting && (
                <div style={{ background:`${C.blue}12`, border:`1.5px solid ${C.blue}33`, borderRadius:14, padding:"12px 14px" }}>
                  <div style={{ fontSize:".63rem", fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:.5, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                    {Icons.meeting} Meeting Schedule
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".62rem", color:C.blue, fontWeight:600, marginBottom:4 }}>Date</div>
                      <input type="date" value={local.meetingDate || ""} onChange={e => setField("meetingDate", e.target.value)} style={{ ...inputBase }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".62rem", color:C.blue, fontWeight:600, marginBottom:4 }}>Time</div>
                      <input type="time" value={local.meetingTime || ""} onChange={e => setField("meetingTime", e.target.value)} style={{ ...inputBase }} />
                    </div>
                  </div>
                  {local.meetingDate && local.meetingTime && (
                    <div style={{ marginTop:8, fontSize:".72rem", color:C.blue, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                      {Icons.meeting} Scheduled: {new Date(`${local.meetingDate}T${local.meetingTime}`).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })}
                    </div>
                  )}
                </div>
              )}

              {/* client info */}
              <div style={{ background:C.cardAlt, border:`1.5px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:16, padding:"14px" }}>
                <div style={{ fontSize:".63rem", fontWeight:700, color:C.silver, textTransform:"uppercase", letterSpacing:.5, marginBottom:12, display:"flex", alignItems:"center", gap:5 }}>
                  {Icons.building} Client Information
                </div>

                {/* property type */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:".62rem", color:C.gray, fontWeight:600, marginBottom:6 }}>Property Type</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[
                      { key:"residential", label:"سكني",  color:"#10b981" },
                      { key:"commercial",  label:"تجاري",  color:"#f59e0b" },
                      { key:"admin",       label:"إداري",  color:C.blue    },
                    ].map(t => {
                      const active = local.clientInfo?.type === t.key;
                      return (
                        <button key={t.key} onClick={() => setField("clientInfo", { ...local.clientInfo, type: t.key })} style={{
                          flex:1, padding:"7px 4px", borderRadius:10,
                          border:`1px solid ${active ? t.color+"66" : C.border}`,
                          cursor:"pointer", fontFamily:"Archivo,sans-serif", fontSize:".72rem", fontWeight:700,
                          background: active ? `${t.color}20` : C.card,
                          color: active ? t.color : C.gray,
                          transition:"all .15s",
                        }}>{t.label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* budget */}
                <div>
                  <div style={{ fontSize:".62rem", color:C.gray, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                    {Icons.currency} Budget
                  </div>
                  <input
                    value={local.clientInfo?.budget || ""}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = raw ? Number(raw).toLocaleString("en-EG") + " EGP" : "";
                      setField("clientInfo", { ...local.clientInfo, budget: formatted });
                    }}
                    placeholder="e.g. 2,500,000 EGP"
                    style={{ ...inputBase }}
                  />
                </div>
              </div>

              {/* add comment */}
              <div>
                <div style={{ fontSize:".63rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.5, marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                  {Icons.chat} Add Comment
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    ref={inputRef}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addComment()}
                    placeholder="Write a comment…"
                    style={{ ...inputBase, flex:1 }}
                  />
                  <button className="send-btn" onClick={addComment} style={{
                    width:42, height:42, borderRadius:12, border:"none", flexShrink:0,
                    background: comment.trim() ? C.red : C.cardAlt,
                    color: comment.trim() ? "#fff" : C.gray,
                    cursor: comment.trim() ? "pointer" : "default",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{Icons.send}</button>
                </div>
              </div>

              {/* comments list */}
              {local.comments.length > 0
                ? local.comments.map(c => (
                    <div key={c.id} style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 13px" }}>
                      <div style={{ fontSize:".82rem", color:C.white, fontWeight:600, lineHeight:1.5 }}>{c.text}</div>
                      <div style={{ fontSize:".62rem", color:C.gray, marginTop:4 }}>{c.time}</div>
                    </div>
                  ))
                : (
                  <div style={{ textAlign:"center", padding:"8px 0 4px", color:C.gray, fontSize:".78rem", fontWeight:600 }}>
                    No comments yet
                  </div>
                )
              }
            </div>

            {/* footer */}
            <div style={{ padding:"12px 16px 16px", flexShrink:0, borderTop:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={onClose} style={{
                  flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`,
                  background:C.cardAlt, color:C.gray,
                  fontFamily:"Archivo,sans-serif", fontSize:".85rem", fontWeight:700, cursor:"pointer",
                }}>Close</button>
                <button className="save-btn" onClick={handleSave} style={{
                  flex:2, padding:12, borderRadius:12, border:"none",
                  background:C.red, color:"#fff",
                  fontFamily:"Archivo,sans-serif", fontSize:".85rem", fontWeight:700, cursor:"pointer",
                  boxShadow:`0 4px 16px ${C.red}44`,
                }}>Save Changes</button>
              </div>
            </div>
          </>}
        </div>
      </div>
    </>
  );
}

// ─── ShareModal ──────────────────────────────────────────────────
const SEND_ICON = (
  <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
    <path d="M227.3,28.7a16,16,0,0,0-15.7-4.2l-.2.06L22.6,82.34a16,16,0,0,0-2.1,29.87l85.1,40,40,85.1a15.79,15.79,0,0,0,14.42,9.29,16.06,16.06,0,0,0,15.41-11.3l58-188.61A16,16,0,0,0,227.3,28.7Zm-69.93,203L118,148.74l44.69-44.69a8,8,0,0,0-11.31-11.31L106.69,137,24.28,97.63,212.72,39.32Z"/>
  </svg>
);

const SALES_LIST = [
  { id:"s1", name:"Ahmed Sales",   role:"Sales"   },
  { id:"s2", name:"Nour Broker",   role:"Broker"  },
  { id:"s3", name:"Karim Manager", role:"Manager" },
];

function ShareModal({ lead, onClose }) {
  const [sentTo,    setSentTo]    = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = useCallback(() => {
    setConfirmed(true);
    setTimeout(() => onClose(), 1800);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(0,0,0,.8)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:430,
        background:C.card, borderRadius:"22px 22px 0 0",
        border:`1px solid ${C.border}`, borderBottom:"none",
        padding:"20px 18px 32px",
        boxShadow:`0 -8px 40px rgba(204,21,21,.2)`,
      }}>
        {/* handle */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:C.border }} />
        </div>

        {/* confirmed */}
        {confirmed ? (
          <div style={{ padding:"8px 0 12px" }}>
            <div style={{
              background:`linear-gradient(135deg, ${C.red} 0%, #8b0000 100%)`,
              borderRadius:18, padding:"20px 20px 22px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:10,
            }}>
              <div style={{
                width:52, height:52, borderRadius:16,
                background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="26" height="26" viewBox="0 0 256 256" fill="#fff">
                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
                </svg>
              </div>
              <div style={{ fontSize:"1rem", fontWeight:800, color:"#fff" }}>Lead Sent Successfully!</div>
              <div style={{ fontSize:".72rem", color:"rgba(255,255,255,.75)", textAlign:"center", lineHeight:1.6 }}>
                <span style={{ color:"#fff", fontWeight:700 }}>{lead.name}</span> has been assigned to <span style={{ color:"#fff", fontWeight:700 }}>{sentTo?.name}</span>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"center", marginTop:14 }}>
              <span style={{ background:`${C.red}20`, color:C.red, fontSize:".7rem", fontWeight:700, padding:"5px 16px", borderRadius:99, display:"flex", alignItems:"center", gap:5 }}>
                ✓ Delivered · {sentTo?.role}
              </span>
            </div>
          </div>

        /* confirm step */
        ) : sentTo ? (
          <>
            <div style={{ fontSize:".65rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.6, marginBottom:14 }}>Confirm Transfer</div>
            <div style={{ background:C.cardAlt, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:18 }}>
              <div style={{ fontSize:".65rem", color:C.gray, fontWeight:600, marginBottom:2 }}>Lead</div>
              <div style={{ fontWeight:800, fontSize:".92rem", color:C.white }}>{lead.name}</div>
              <div style={{ fontSize:".7rem", color:C.silver, marginTop:2 }}>{lead.phone}</div>
              <div style={{ height:1, background:C.border, margin:"10px 0" }} />
              <div style={{ fontSize:".65rem", color:C.gray, fontWeight:600, marginBottom:2 }}>Send to</div>
              <div style={{ fontWeight:800, fontSize:".92rem", color:C.red }}>{sentTo.name}</div>
              <div style={{ fontSize:".67rem", color:C.gray }}>{sentTo.role}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setSentTo(null)} style={{
                flex:1, padding:"11px 0", borderRadius:12, border:`1px solid ${C.border}`,
                background:C.cardAlt, color:C.gray,
                fontFamily:"Archivo,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer",
              }}>Back</button>
              <button onClick={handleConfirm} style={{
                flex:2, padding:"11px 0", borderRadius:12, border:"none",
                background:C.red, color:"#fff",
                fontFamily:"Archivo,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                boxShadow:`0 4px 16px ${C.red}44`,
              }}>
                {SEND_ICON} Confirm Send
              </button>
            </div>
          </>

        /* pick sales */
        ) : (
          <>
            <div style={{ fontSize:".65rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.6, marginBottom:6 }}>Send lead to</div>
            <div style={{ fontWeight:800, fontSize:".95rem", color:C.white, marginBottom:3 }}>{lead.name}</div>
            <div style={{ fontSize:".72rem", color:C.silver, marginBottom:18 }}>{lead.phone}</div>

            {SALES_LIST.map(s => (
              <button key={s.id} onClick={() => setSentTo(s)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:12,
                padding:"11px 14px", borderRadius:13,
                border:`1.5px solid ${C.border}`, background:C.cardAlt,
                cursor:"pointer", marginBottom:8, fontFamily:"Archivo,sans-serif",
                transition:"border-color .15s",
              }}>
                <div style={{
                  width:38, height:38, borderRadius:11, flexShrink:0,
                  background:C.red, boxShadow:`0 4px 12px ${C.red}44`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1rem", fontWeight:900, color:"#fff",
                }}>{s.name.charAt(0)}</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontWeight:700, fontSize:".83rem", color:C.white }}>{s.name}</div>
                  <div style={{ fontSize:".67rem", color:C.gray }}>{s.role}</div>
                </div>
                <span style={{
                  fontSize:".68rem", fontWeight:700, padding:"5px 11px", borderRadius:99,
                  background:`${C.red}18`, color:C.red, border:`1px solid ${C.red}33`,
                  display:"flex", alignItems:"center", gap:5,
                }}>
                  Send {SEND_ICON}
                </span>
              </button>
            ))}

            <button onClick={onClose} style={{
              width:"100%", padding:"11px 0", borderRadius:12, border:`1px solid ${C.border}`,
              background:C.cardAlt, color:C.gray,
              fontFamily:"Archivo,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer", marginTop:4,
            }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LeadCard ────────────────────────────────────────────────────
const LeadCard = ({ lead, onClick, onShare }) => {
  const meta        = STATUS_META[lead.status] || STATUS_META["New"];
  const hasCallback = lead.status === "Call Back" && lead.callbackDate && lead.callbackTime;
  const hasMeeting  = lead.status === "Meeting"   && lead.meetingDate  && lead.meetingTime;
  const scheduleDate = hasCallback
    ? new Date(`${lead.callbackDate}T${lead.callbackTime}`)
    : hasMeeting ? new Date(`${lead.meetingDate}T${lead.meetingTime}`) : null;

  const rawPhone = lead.phone.replace(/\s+/g, "");
  const waNum    = rawPhone.replace(/^\+/, "");
  const [callCopied, setCallCopied] = useState(false);

  const handleCall = (e) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `tel:${rawPhone}`; a.style.display = "none";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (navigator.clipboard) navigator.clipboard.writeText(rawPhone).catch(() => {});
    setCallCopied(true);
    setTimeout(() => setCallCopied(false), 2500);
  };

  return (
    <div className="lead-card" style={{
      background:C.card, border:`1px solid ${C.border}`,
      borderRadius:16, overflow:"hidden", cursor:"pointer",
      boxShadow:"0 2px 12px rgba(0,0,0,.4)",
    }}>
      {/* status strip */}
      <div onClick={onClick} style={{
        background:`${meta.color}12`,
        borderBottom:`1.5px solid ${meta.color}25`,
        padding:"5px 13px",
        display:"flex", alignItems:"center", gap:6,
      }}>
        <span style={{ fontSize:".78rem", color:meta.color, lineHeight:1 }}>{Icons[meta.icon]}</span>
        <span style={{ fontSize:".72rem", fontWeight:900, color:meta.color, letterSpacing:.8, textTransform:"uppercase" }}>
          {lead.status}
        </span>
        {scheduleDate && (
          <span style={{ marginLeft:"auto", fontSize:".6rem", color:meta.color, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
            {Icons.callback} {scheduleDate.toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" })}
          </span>
        )}
      </div>

      {/* body */}
      <div style={{ padding:"11px 13px 12px" }}>
        {/* name + share */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6, width:"100%" }}>
          <div onClick={onClick} style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontWeight:800, fontSize:".92rem", color:C.white,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{lead.name}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); onShare && onShare(lead); }} style={{
            flexShrink:0, width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`,
            background:C.cardAlt, color:C.red, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
              <path d="M227.3,28.7a16,16,0,0,0-15.7-4.2l-.2.06L22.6,82.34a16,16,0,0,0-2.1,29.87l85.1,40,40,85.1a15.79,15.79,0,0,0,14.42,9.29,16.06,16.06,0,0,0,15.41-11.3l58-188.61A16,16,0,0,0,227.3,28.7Zm-69.93,203L118,148.74l44.69-44.69a8,8,0,0,0-11.31-11.31L106.69,137,24.28,97.63,212.72,39.32Z"/>
            </svg>
          </button>
        </div>

        {/* phone + comments */}
        <div onClick={onClick} style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:10 }}>
          <div style={{ fontSize:".7rem", color:C.silver, display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
            {Icons.phone} {lead.phone}
          </div>
          {lead.comments.length > 0 && (
            <div style={{ fontSize:".67rem", color:C.gray, display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
              {Icons.chat} {lead.comments.length} comment{lead.comments.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* client chips */}
        {(lead.clientInfo?.type || lead.clientInfo?.budget) && (
          <div onClick={onClick} style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {lead.clientInfo?.type && (() => {
              const typeMap = { residential:{ label:"سكني", color:"#10b981" }, commercial:{ label:"تجاري", color:"#f59e0b" }, admin:{ label:"إداري", color:C.blue } };
              const t = typeMap[lead.clientInfo.type];
              return t ? <span style={{ fontSize:".62rem", fontWeight:700, padding:"3px 9px", borderRadius:99, background:`${t.color}20`, color:t.color }}>🏠 {t.label}</span> : null;
            })()}
            {lead.clientInfo?.budget && (
              <span style={{ fontSize:".62rem", fontWeight:700, padding:"3px 9px", borderRadius:99, background:"#10b98120", color:"#10b981" }}>
                💰 {lead.clientInfo.budget}
              </span>
            )}
          </div>
        )}

        {/* action buttons */}
        <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
          <button onClick={handleCall} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            padding:"7px 0", borderRadius:11, cursor:"pointer", border:`1px solid ${C.border}`,
            background: callCopied ? "#10b98120" : C.cardAlt,
            color: callCopied ? "#10b981" : C.silver,
            fontFamily:"Archivo,sans-serif", fontSize:".72rem", fontWeight:700,
            transition:"background .2s, color .2s",
          }}>
            {callCopied ? "✓ Copied!" : <>{Icons.phoneCall} Call</>}
          </button>
          <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            padding:"7px 0", borderRadius:11, cursor:"pointer", textDecoration:"none",
            border:`1px solid ${C.border}`,
            background:"#10b98118", color:"#10b981",
            fontFamily:"Archivo,sans-serif", fontSize:".72rem", fontWeight:700,
          }}>
            {Icons.whatsapp} WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function LeadsPage({ activeTab = 1, onTabChange, onSignOut, leads: externalLeads, onUpdateLead: externalUpdateLead }) {
  const [localLeads, setLocalLeads] = useState(() => {
    try { const saved = localStorage.getItem("onyx_leads"); return saved ? JSON.parse(saved) : LEADS_INIT; }
    catch { return LEADS_INIT; }
  });
  const leads = externalLeads ?? localLeads;

  const [search,       setSearch]   = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [selectedLead, setSelected] = useState(null);
  const [detailOpen,   setDetail]   = useState(false);
  const [showFilters,  setFilters]  = useState(false);
  const [shareTarget,  setShareTarget] = useState(null);
  const [notifOpen,    setNotifOpen]   = useState(false);
  const [profileOpen,  setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id:1, text:"New lead assigned: Mohamed Abdullah",   time:"2 min ago",  color:C.blue, unread:true  },
    { id:2, text:"Sara Hassan replied to your proposal",  time:"18 min ago", color:"#10b981", unread:true  },
    { id:3, text:"Meeting reminder: Site visit at 10 AM", time:"1 hr ago",   color:"#f59e0b", unread:true  },
    { id:4, text:"Deal closed with Khaled Ibrahim 🎉",    time:"Yesterday",  color:C.red, unread:false },
  ]);
  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread:false })));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.project.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() =>
    ALL_STATUSES.reduce((acc, s) => {
      acc[s] = s === "All" ? leads.length : leads.filter(l => l.status === s).length;
      return acc;
    }, {}),
  [leads]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    document.body.style.overflow = detailOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailOpen]);

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
      maxWidth:430, margin:"0 auto", position:"relative",
      colorScheme:"dark", userSelect:"none", WebkitUserSelect:"none",
    }}>
      <style>{STYLES}</style>

      <LeadDetailModal lead={selectedLead} open={detailOpen} onClose={closeDetail} onUpdate={updateLead} />
      <NotificationPanel open={notifOpen}   onClose={() => setNotifOpen(false)}   notifs={notifs} onMarkAll={markAllRead} />
      <ProfileModal      open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />

      <AppHeader
        unreadCount={unreadCount}
        onBellClick={()    => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      <div style={{ padding:"20px 16px 110px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* search */}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.gray, pointerEvents:"none" }}>
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

        {/* filter row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:".72rem", fontWeight:700, color:C.silver, fontFamily:"Archivo,sans-serif" }}>
            {filtered.length} results
            {statusFilter !== "All" && <span style={{ color:C.gray }}> · {statusFilter}</span>}
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

        {/* filter chips */}
        {showFilters && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:14, padding:"12px", display:"flex", gap:5, flexWrap:"wrap" }}>
            {ALL_STATUSES.map(s => {
              const m = s !== "All" ? STATUS_META[s] : null;
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
                  {s === "All" ? `All (${counts["All"]})` : `${s} (${counts[s]})`}
                </button>
              );
            })}
          </div>
        )}

        {/* list */}
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {filtered.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif" }}>No leads found 🔍</div>
            : filtered.map((lead, i) => (
                <div key={lead.id} className="lead-item" style={{ animationDelay:`${i * 25}ms` }}>
                  <LeadCard lead={lead} onClick={() => openDetail(lead)} onShare={setShareTarget} />
                </div>
              ))
          }
        </div>
      </div>

      {shareTarget && <ShareModal lead={shareTarget} onClose={() => setShareTarget(null)} />}

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
