// ✅ ADDED: استبدلنا كل الـ Icons object بـ imports من ملفات مشتركة
import Icons             from "./Icons";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ❌ REMOVED: const Icons = { ... }  ← اتنقلت بالكامل لملف Icons.jsx

const STATUS_META = {
  "New":         { color:"#10b981", bg:"#d1fae5", icon:"sparkle"   },
  "Call Back":   { color:"#f59e0b", bg:"#fef3c7", icon:"callback"  },
  "Meeting":     { color:"#4f46e5", bg:"#ede9fe", icon:"meeting"   },
  "Deal":        { color:"#ef4444", bg:"#fee2e2", icon:"handshake" },
  "Not Interest":{ color:"#94a3b8", bg:"#f1f5f9", icon:"prohibit"  },
};

const STATUS_ORDER = ["Call Back", "Meeting", "Deal", "Not Interest"];
const ALL_STATUSES = ["All", ...STATUS_ORDER];
const PRIORITY_COLOR = { high:"#ef4444", medium:"#f59e0b", low:"#0ea5e9" };
const PRIORITY_BG    = { high:"#fee2e2", medium:"#fef3c7", low:"#e0f2fe" };

const LEADS_INIT = [
  { id:1, name:"Mohamed Abdullah", phone:"+20 101 234 5678", source:"Facebook Ad", status:"New",       project:"Scenario – New Capital", priority:"high", comments:[], callbackDate:"", callbackTime:"", clientInfo:{ type:"", budget:"", notes:"" } },
  { id:2, name:"Sara Hassan",      phone:"+20 112 345 6789", source:"Website",     status:"Call Back", project:"Azha – North Coast",     priority:"high", comments:[], callbackDate:"2026-06-02", callbackTime:"10:00", clientInfo:{ type:"", budget:"", notes:"" } },
];

// ❌ REMOVED: NAV_ITEMS  ← مش محتاجها، BottomNav بتستخدم default items

// ── CSS injected once
const STYLES = `
  :root { color-scheme: light only; }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: light; }
  @keyframes slideUp   { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
  @keyframes fadeInUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  .modal-overlay { animation: fadeIn .22s ease both }
  .modal-sheet   { animation: slideUp .28s cubic-bezier(.32,0,.16,1) both }
  .lead-card     { transition: box-shadow .18s ease, transform .18s ease }
  .lead-card:active { transform: scale(.98) !important }
  .status-btn    { transition: background .15s ease, color .15s ease, box-shadow .15s ease, transform .1s ease }
  .status-btn:active { transform: scale(.95) }
  .send-btn      { transition: background .15s ease, color .15s ease, transform .1s ease }
  .send-btn:active   { transform: scale(.92) }
  .filter-chip   { transition: background .15s ease, color .15s ease, box-shadow .15s ease }
  .save-btn      { transition: opacity .15s ease, transform .1s ease }
  .save-btn:active   { transform: scale(.97) }
  @keyframes navBubble { from{transform:translateX(-50%) scale(.5);opacity:0} to{transform:translateX(-50%) scale(1);opacity:1} }
  .lead-item     { animation: fadeInUp .2s ease both }
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator { opacity:.5; cursor:pointer }
  ::-webkit-scrollbar { width:0; height:0 }
`;

const inputBase = {
  width:"100%", padding:"10px 14px", borderRadius:12,
  border:"1.5px solid #e8eaf6", outline:"none",
  fontSize:".85rem", fontWeight:600, color:"#1e1b4b",
  fontFamily:"Inter,sans-serif", background:"#f8f9ff",
};

// ── LEAD DETAIL MODAL
function LeadDetailModal({ lead, open, onClose, onUpdate }) {
  const [local, setLocal]       = useState(null);
  const [comment, setComment]   = useState("");
  const prevId                  = useRef(null);
  const inputRef                = useRef(null);

  // sync local only when a new lead is opened
  useEffect(() => {
    if (open && lead && lead.id !== prevId.current) {
      setLocal({ ...lead, comments: [...lead.comments] });
      setComment("");
      prevId.current = lead.id;
    }
    if (!open) prevId.current = null;
  }, [open, lead]);

  const setField = useCallback((key, val) =>
    setLocal(l => ({ ...l, [key]: val })), []);

  const addComment = useCallback(() => {
    const text = comment.trim();
    if (!text) return;
    const entry = {
      id: Date.now(),
      text,
      time: new Date().toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" }),
    };
    setLocal(l => ({ ...l, comments: [entry, ...l.comments] }));
    setComment("");
    inputRef.current?.focus();
  }, [comment]);

  const handleSave = useCallback(() => {
    onUpdate(local);
    onClose();
  }, [local, onUpdate, onClose]);

  const meta        = local ? (STATUS_META[local.status] || STATUS_META["New"]) : STATUS_META["New"];
  const isCallback  = local?.status === "Call Back";
  const isMeeting   = local?.status === "Meeting";

  return (
    <>
      <style>{STYLES}</style>
      {/* overlay — always rendered when open, click closes */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(30,27,75,.45)", backdropFilter:"blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition:"opacity .25s",
        }}
      />
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:201,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        pointerEvents: open ? "all" : "none",
        opacity: open ? 1 : 0,
        transition:"opacity .25s",
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:"100%", maxWidth:430,
            background:"#fff", borderRadius:"24px 24px 0 0",
            boxShadow:"0 -8px 48px rgba(79,70,229,.18)",
            display:"flex", flexDirection:"column", maxHeight:"92vh",
            transform: open ? "translateY(0)" : "translateY(100%)",
            transition:"transform .3s cubic-bezier(.32,0,.16,1)",
          }}
        >
          {local && <>
          {/* handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0", flexShrink:0 }}>
            <div style={{ width:40, height:4, borderRadius:99, background:"#e8eaf6" }} />
          </div>

          {/* profile strip */}
          <div style={{
            background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
            padding:"16px 18px 18px", margin:"10px 16px 0", borderRadius:18, flexShrink:0,
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{
              width:50, height:50, borderRadius:15, flexShrink:0,
              background:"rgba(255,255,255,.2)", border:"2px solid rgba(255,255,255,.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.25rem", fontWeight:900, color:"#fff",
            }}>{local.name.charAt(0)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:".95rem", fontWeight:800, color:"#fff",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{local.name}</div>
              <div style={{ fontSize:".68rem", color:"rgba(255,255,255,.72)", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                {Icons.phone} {local.phone}
              </div>
              <div style={{ fontSize:".64rem", color:"rgba(255,255,255,.6)", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                {Icons.house} {local.project}
              </div>
            </div>
            <div style={{
              background:"rgba(255,255,255,.18)", borderRadius:99, padding:"4px 10px",
              display:"flex", alignItems:"center", gap:5, flexShrink:0,
            }}>
              <span style={{ color:"#fff" }}>{Icons[meta.icon]}</span>
              <span style={{ fontSize:".68rem", fontWeight:700, color:"#fff" }}>{local.status}</span>
            </div>
          </div>

          {/* scrollable */}
          <div style={{ overflowY:"auto", padding:"14px 16px 8px", display:"flex", flexDirection:"column", gap:14, WebkitOverflowScrolling:"touch" }}>

            {/* status buttons */}
            <div>
              <div style={{ fontSize:".63rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
                Change Status
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"nowrap", overflowX:"auto", paddingBottom:2 }}>
                {STATUS_ORDER.map(s => { const m = STATUS_META[s];
                  const active = local.status === s;
                  return (
                    <button key={s} className="status-btn" onClick={() => setField("status", s)} style={{
                      padding:"6px 10px", borderRadius:99, border:"none", cursor:"pointer",
                      fontFamily:"Inter,sans-serif", fontSize:".68rem", fontWeight:700,
                      background: active ? m.color : m.bg,
                      color:      active ? "#fff"  : m.color,
                      boxShadow:  active ? `0 3px 10px ${m.color}55` : "none",
                      display:"flex", alignItems:"center", gap:3, flexShrink:0, whiteSpace:"nowrap",
                    }}>
                      {Icons[m.icon]} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* callback picker */}
            {isCallback && (
              <div style={{ background:"#fef9ec", border:"1.5px solid #fde68a", borderRadius:14, padding:"12px 14px" }}>
                <div style={{ fontSize:".63rem", fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:.5, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                  {Icons.callback} Callback Schedule
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".62rem", color:"#92400e", fontWeight:600, marginBottom:4 }}>Date</div>
                    <input type="date" value={local.callbackDate}
                      onChange={e => setField("callbackDate", e.target.value)}
                      style={{ ...inputBase, background:"#fff", border:"1.5px solid #fde68a", fontSize:".82rem" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".62rem", color:"#92400e", fontWeight:600, marginBottom:4 }}>Time</div>
                    <input type="time" value={local.callbackTime}
                      onChange={e => setField("callbackTime", e.target.value)}
                      style={{ ...inputBase, background:"#fff", border:"1.5px solid #fde68a", fontSize:".82rem" }} />
                  </div>
                </div>
                {local.callbackDate && local.callbackTime && (
                  <div style={{ marginTop:8, fontSize:".72rem", color:"#d97706", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                    {Icons.meeting} Scheduled:{" "}
                    {new Date(`${local.callbackDate}T${local.callbackTime}`).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })}
                  </div>
                )}
              </div>
            )}

            {/* meeting picker */}
            {isMeeting && (
              <div style={{ background:"#eef2ff", border:"1.5px solid #c7d2fe", borderRadius:14, padding:"12px 14px" }}>
                <div style={{ fontSize:".63rem", fontWeight:700, color:"#3730a3", textTransform:"uppercase", letterSpacing:.5, marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                  {Icons.meeting} Meeting Schedule
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".62rem", color:"#3730a3", fontWeight:600, marginBottom:4 }}>Date</div>
                    <input type="date" value={local.meetingDate || ""}
                      onChange={e => setField("meetingDate", e.target.value)}
                      style={{ ...inputBase, background:"#fff", border:"1.5px solid #c7d2fe", fontSize:".82rem" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".62rem", color:"#3730a3", fontWeight:600, marginBottom:4 }}>Time</div>
                    <input type="time" value={local.meetingTime || ""}
                      onChange={e => setField("meetingTime", e.target.value)}
                      style={{ ...inputBase, background:"#fff", border:"1.5px solid #c7d2fe", fontSize:".82rem" }} />
                  </div>
                </div>
                {local.meetingDate && local.meetingTime && (
                  <div style={{ marginTop:8, fontSize:".72rem", color:"#4f46e5", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                    {Icons.meeting} Scheduled:{" "}
                    {new Date(`${local.meetingDate}T${local.meetingTime}`).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })}
                  </div>
                )}
              </div>
            )}

            {/* client info */}
            <div style={{ background:"#f8f9ff", border:"1.5px solid #e8eaf6", borderRadius:16, padding:"14px" }}>
              <div style={{ fontSize:".63rem", fontWeight:700, color:"#4f46e5", textTransform:"uppercase", letterSpacing:.5, marginBottom:12, display:"flex", alignItems:"center", gap:5 }}>
                {Icons.building} Client Information
              </div>

              {/* property type */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:".62rem", color:"#94a3b8", fontWeight:600, marginBottom:6 }}>Property Type</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[
                    { key:"residential", label:"سكني",  color:"#10b981", bg:"#d1fae5" },
                    { key:"commercial",  label:"تجاري",  color:"#f59e0b", bg:"#fef3c7" },
                    { key:"admin",       label:"إداري",  color:"#4f46e5", bg:"#ede9fe" },
                  ].map(t => {
                    const active = local.clientInfo?.type === t.key;
                    return (
                      <button key={t.key} onClick={() => setField("clientInfo", { ...local.clientInfo, type: t.key })} style={{
                        flex:1, padding:"7px 4px", borderRadius:10, border:"none", cursor:"pointer",
                        fontFamily:"Inter,sans-serif", fontSize:".72rem", fontWeight:700,
                        background: active ? t.color : t.bg,
                        color:      active ? "#fff"  : t.color,
                        boxShadow:  active ? `0 3px 10px ${t.color}44` : "none",
                        transition:"all .15s",
                      }}>{t.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* budget */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:".62rem", color:"#94a3b8", fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
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
              <div style={{ fontSize:".63rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.5, marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
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
                  background: comment.trim() ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#eef1fb",
                  color:      comment.trim() ? "#fff" : "#c7d2fe",
                  cursor:     comment.trim() ? "pointer" : "default",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>{Icons.send}</button>
              </div>
            </div>

            {/* comments list */}
            {local.comments.length > 0
              ? local.comments.map(c => (
                  <div key={c.id} style={{ background:"#f8f9ff", border:"1px solid #e8eaf6", borderRadius:12, padding:"10px 13px" }}>
                    <div style={{ fontSize:".82rem", color:"#1e1b4b", fontWeight:600, lineHeight:1.5 }}>{c.text}</div>
                    <div style={{ fontSize:".62rem", color:"#94a3b8", marginTop:4 }}>{c.time}</div>
                  </div>
                ))
              : (
                <div style={{ textAlign:"center", padding:"8px 0 4px", color:"#c7d2fe", fontSize:".78rem", fontWeight:600 }}>
                  No comments yet
                </div>
              )
            }
          </div>

          {/* footer */}
          <div style={{ padding:"12px 16px 16px", flexShrink:0, borderTop:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={onClose} style={{
                flex:1, padding:12, borderRadius:12, border:"1px solid #e8eaf6",
                background:"#f8f9ff", color:"#94a3b8",
                fontFamily:"Inter,sans-serif", fontSize:".85rem", fontWeight:700, cursor:"pointer",
              }}>Close</button>
              <button className="save-btn" onClick={handleSave} style={{
                flex:2, padding:12, borderRadius:12, border:"none",
                background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff",
                fontFamily:"Inter,sans-serif", fontSize:".85rem", fontWeight:700, cursor:"pointer",
              }}>Save Changes</button>
            </div>
          </div>
          </>}
        </div>
      </div>
    </>
  );
}

// ── SHARE MODAL (in-app send lead to sales)
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
      background:"rgba(30,27,75,.5)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:430, background:"#fff",
        borderRadius:"22px 22px 0 0", padding:"20px 18px 32px",
        boxShadow:"0 -8px 40px rgba(79,70,229,.18)",
      }}>
        {/* handle */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"#e8eaf6" }} />
        </div>

        {/* ── Step 3: confirmed */}
        {confirmed ? (
          <div style={{ padding:"8px 0 12px" }}>
            {/* gradient strip — same as profile strip in LeadDetailModal */}
            <div style={{
              background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
              borderRadius:18, padding:"20px 20px 22px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:10,
            }}>
              {/* check circle */}
              <div style={{
                width:52, height:52, borderRadius:16,
                background:"rgba(255,255,255,.2)", border:"2px solid rgba(255,255,255,.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="26" height="26" viewBox="0 0 256 256" fill="#fff">
                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
                </svg>
              </div>
              <div style={{ fontSize:"1rem", fontWeight:800, color:"#fff" }}>Lead Sent Successfully!</div>
              <div style={{ fontSize:".72rem", color:"rgba(255,255,255,.75)", textAlign:"center", lineHeight:1.6 }}>
                <span style={{ color:"#fff", fontWeight:700 }}>{lead.name}</span>
                {" "}has been assigned to{" "}
                <span style={{ color:"#fff", fontWeight:700 }}>{sentTo?.name}</span>
              </div>
            </div>
            {/* status chip below strip */}
            <div style={{
              display:"flex", justifyContent:"center", marginTop:14,
            }}>
              <span style={{
                background:"#d1fae5", color:"#065f46",
                fontSize:".7rem", fontWeight:700, padding:"5px 16px", borderRadius:99,
                display:"flex", alignItems:"center", gap:5,
              }}>
                <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
                </svg>
                Delivered · {sentTo?.role}
              </span>
            </div>
          </div>

        /* ── Step 2: confirm dialog */
        ) : sentTo ? (
          <>
            <div style={{ fontSize:".65rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.6, marginBottom:14 }}>
              Confirm Transfer
            </div>
            <div style={{ background:"#f8f9ff", border:"1.5px solid #e8eaf6", borderRadius:14, padding:"14px 16px", marginBottom:18 }}>
              <div style={{ fontSize:".65rem", color:"#94a3b8", fontWeight:600, marginBottom:2 }}>Lead</div>
              <div style={{ fontWeight:800, fontSize:".92rem", color:"#1e1b4b" }}>{lead.name}</div>
              <div style={{ fontSize:".7rem", color:"#64748b", marginTop:2 }}>{lead.phone}</div>
              <div style={{ height:1, background:"#e8eaf6", margin:"10px 0" }} />
              <div style={{ fontSize:".65rem", color:"#94a3b8", fontWeight:600, marginBottom:2 }}>Send to</div>
              <div style={{ fontWeight:800, fontSize:".92rem", color:"#4f46e5" }}>{sentTo.name}</div>
              <div style={{ fontSize:".67rem", color:"#94a3b8" }}>{sentTo.role}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setSentTo(null)} style={{
                flex:1, padding:"11px 0", borderRadius:12, border:"1.5px solid #e8eaf6",
                background:"#f8f9ff", color:"#94a3b8",
                fontFamily:"Inter,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer",
              }}>Back</button>
              <button onClick={handleConfirm} style={{
                flex:2, padding:"11px 0", borderRadius:12, border:"none",
                background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff",
                fontFamily:"Inter,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}>
                {SEND_ICON} Confirm Send
              </button>
            </div>
          </>

        /* ── Step 1: pick sales person */
        ) : (
          <>
            <div style={{ fontSize:".65rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.6, marginBottom:6 }}>
              Send lead to
            </div>
            <div style={{ fontWeight:800, fontSize:".95rem", color:"#1e1b4b", marginBottom:3 }}>{lead.name}</div>
            <div style={{ fontSize:".72rem", color:"#64748b", marginBottom:18 }}>{lead.phone}</div>

            {SALES_LIST.map(s => (
              <button key={s.id} onClick={() => setSentTo(s)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:12,
                padding:"11px 14px", borderRadius:13,
                border:"1.5px solid #e8eaf6", background:"#f8f9ff",
                cursor:"pointer", marginBottom:8, fontFamily:"Inter,sans-serif",
              }}>
                <div style={{
                  width:38, height:38, borderRadius:11, flexShrink:0,
                  background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1rem", fontWeight:900, color:"#fff",
                }}>{s.name.charAt(0)}</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontWeight:700, fontSize:".83rem", color:"#1e1b4b" }}>{s.name}</div>
                  <div style={{ fontSize:".67rem", color:"#94a3b8" }}>{s.role}</div>
                </div>
                <span style={{
                  fontSize:".68rem", fontWeight:700, padding:"5px 11px", borderRadius:99,
                  background:"#ede9fe", color:"#4f46e5",
                  display:"flex", alignItems:"center", gap:5,
                }}>
                  Send {SEND_ICON}
                </span>
              </button>
            ))}

            <button onClick={onClose} style={{
              width:"100%", padding:"11px 0", borderRadius:12, border:"1px solid #e8eaf6",
              background:"#f1f5f9", color:"#94a3b8",
              fontFamily:"Inter,sans-serif", fontSize:".82rem", fontWeight:700, cursor:"pointer", marginTop:4,
            }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── LEAD CARD  (memo → no re-render unless lead changes)
const LeadCard = ({ lead, onClick, onShare }) => {
  const meta        = STATUS_META[lead.status] || STATUS_META["New"];
  const hasCallback  = lead.status === "Call Back" && lead.callbackDate && lead.callbackTime;
  const hasMeeting   = lead.status === "Meeting"   && lead.meetingDate  && lead.meetingTime;
  const scheduleDate = hasCallback
    ? new Date(`${lead.callbackDate}T${lead.callbackTime}`)
    : hasMeeting
    ? new Date(`${lead.meetingDate}T${lead.meetingTime}`)
    : null;

  const rawPhone = lead.phone.replace(/\s+/g, "");
  const waNum    = rawPhone.replace(/^\+/, "");
  const [callCopied, setCallCopied] = useState(false);

  const handleCall = (e) => {
    e.stopPropagation();
    // Try tel: link first; if it fails (e.g. inside webview), copy number + show feedback
    const a = document.createElement("a");
    a.href = `tel:${rawPhone}`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Also copy to clipboard as fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone).catch(() => {});
    }
    setCallCopied(true);
    setTimeout(() => setCallCopied(false), 2500);
  };

  return (
    <div className="lead-card" style={{
      background:"#fff", border:"1px solid #e8eaf6", borderRadius:18,
      overflow:"hidden", cursor:"pointer", boxShadow:"0 2px 10px rgba(79,70,229,.05)",
    }}>

      {/* ── Status strip */}
      <div onClick={onClick} style={{
        background:meta.bg,
        borderBottom:`1.5px solid ${meta.color}25`,
        padding:"5px 13px",
        display:"flex", alignItems:"center", gap:6,
      }}>
        <span style={{ fontSize:".78rem", color:meta.color, lineHeight:1 }}>{Icons[meta.icon]}</span>
        <span style={{
          fontSize:".72rem", fontWeight:900, color:meta.color, letterSpacing:.8,
          textTransform:"uppercase",
        }}>
          {lead.status}
        </span>
        {scheduleDate && (
          <span style={{ marginLeft:"auto", fontSize:".6rem", color:meta.color, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
            {Icons.callback}{" "}
            {scheduleDate.toLocaleString("en-GB", { dateStyle:"short", timeStyle:"short" })}
          </span>
        )}
      </div>

      {/* ── Body */}
      <div style={{ padding:"11px 13px 12px" }}>

        {/* Name row: name left + share button right — same line */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6, width:"100%" }}>
          <div onClick={onClick} style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontWeight:800, fontSize:".92rem", color:"#1e1b4b",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              textAlign:"left",
            }}>{lead.name}</div>
          </div>
          {/* share button — right of name, same row */}
          <button
            onClick={e => { e.stopPropagation(); onShare && onShare(lead); }}
            title="إرسال لسيلز"
            style={{
              flexShrink:0, width:30, height:30, borderRadius:8, border:"none",
              background:"#ede9fe", color:"#4f46e5", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {/* PaperPlaneTilt — Phosphor style SVG, matches project icon library */}
            <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
              <path d="M227.3,28.7a16,16,0,0,0-15.7-4.2l-.2.06L22.6,82.34a16,16,0,0,0-2.1,29.87l85.1,40,40,85.1a15.79,15.79,0,0,0,14.42,9.29,16.06,16.06,0,0,0,15.41-11.3l58-188.61A16,16,0,0,0,227.3,28.7Zm-69.93,203L118,148.74l44.69-44.69a8,8,0,0,0-11.31-11.31L106.69,137,24.28,97.63,212.72,39.32Z"/>
            </svg>
          </button>
        </div>

        {/* phone + comments below name */}
        <div onClick={onClick} style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:10 }}>
          <div style={{ fontSize:".7rem", color:"#64748b", display:"flex", alignItems:"center", gap:4, fontWeight:600, textAlign:"left" }}>
            {Icons.phone} {lead.phone}
          </div>
          {lead.comments.length > 0 && (
            <div style={{ fontSize:".67rem", color:"#94a3b8", display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
              {Icons.chat} {lead.comments.length} comment{lead.comments.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* client info chips */}
        {(lead.clientInfo?.type || lead.clientInfo?.budget) && (
          <div onClick={onClick} style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {lead.clientInfo?.type && (() => {
              const typeMap = { residential:{ label:"سكني", color:"#10b981", bg:"#d1fae5" }, commercial:{ label:"تجاري", color:"#f59e0b", bg:"#fef3c7" }, admin:{ label:"إداري", color:"#4f46e5", bg:"#ede9fe" } };
              const t = typeMap[lead.clientInfo.type];
              return t ? (
                <span style={{ fontSize:".62rem", fontWeight:700, padding:"3px 9px", borderRadius:99, background:t.bg, color:t.color }}>
                  🏠 {t.label}
                </span>
              ) : null;
            })()}
            {lead.clientInfo?.budget && (
              <span style={{ fontSize:".62rem", fontWeight:700, padding:"3px 9px", borderRadius:99, background:"#f0fdf4", color:"#15803d" }}>
                💰 {lead.clientInfo.budget}
              </span>
            )}
          </div>
        )}

        {/* action buttons */}
        <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={handleCall}
            style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              padding:"7px 0", borderRadius:11, cursor:"pointer", border:"none",
              background: callCopied ? "#bbf7d0" : "#e0f2fe",
              color: callCopied ? "#15803d" : "#0284c7",
              fontFamily:"Inter,sans-serif", fontSize:".72rem", fontWeight:700,
              transition:"background .2s, color .2s",
            }}
          >
            {callCopied ? "✓ Copied!" : <>{Icons.phoneCall} Call</>}
          </button>
          <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              padding:"7px 0", borderRadius:11, cursor:"pointer", textDecoration:"none",
              background:"#dcfce7", color:"#16a34a",
              fontFamily:"Inter,sans-serif", fontSize:".72rem", fontWeight:700,
            }}
          >
            {Icons.whatsapp} WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

// ── MAIN PAGE
export default function LeadsPage({ activeTab = 1, onTabChange, onSignOut, leads: externalLeads, onUpdateLead: externalUpdateLead }) {
  // Use shared leads from App.jsx if provided (Admin+Sales sync)
  const [localLeads, setLocalLeads] = useState(() => {
    try {
      const saved = localStorage.getItem("onyx_leads");
      return saved ? JSON.parse(saved) : LEADS_INIT;
    } catch { return LEADS_INIT; }
  });
  const leads = externalLeads ?? localLeads;
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [selectedLead, setSelected] = useState(null);
  const [detailOpen, setDetail]     = useState(false);
  const [showFilters, setFilters]   = useState(false);
  // ✅ ADDED: state للهيدر والـ panels المشتركة
  const [shareTarget, setShareTarget] = useState(null); // lead being shared
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id:1, text:"New lead assigned: Mohamed Abdullah",   time:"2 min ago",  color:"#4f46e5", unread:true  },
    { id:2, text:"Sara Hassan replied to your proposal",  time:"18 min ago", color:"#10b981", unread:true  },
    { id:3, text:"Meeting reminder: Site visit at 10 AM", time:"1 hr ago",   color:"#f59e0b", unread:true  },
    { id:4, text:"Deal closed with Khaled Ibrahim 🎉",    time:"Yesterday",  color:"#ef4444", unread:false },
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

  // scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // freeze body scroll when modal open
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
    <div style={{ fontFamily:"Inter,sans-serif", background:"#f5f7ff", minHeight:"100vh", color:"#1e1b4b", maxWidth:430, margin:"0 auto", position:"relative", colorScheme:"light", userSelect:"none", WebkitUserSelect:"none" }}>
      <style>{STYLES}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />

      <LeadDetailModal lead={selectedLead} open={detailOpen} onClose={closeDetail} onUpdate={updateLead} />
      {/* ✅ ADDED: الـ panels المشتركة */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} notifs={notifs} onMarkAll={markAllRead} />
      <ProfileModal      open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />

      {/* ✅ ADDED: AppHeader بدل الـ header اليدوي ← سطر واحد بدل 20 سطر */}
      <AppHeader
        unreadCount={unreadCount}
        onBellClick={()    => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* BODY */}
      <div style={{ padding:"20px 16px 110px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* search */}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}>{Icons.search}</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, project…"
            style={{
              ...inputBase, width:"100%", padding:"11px 40px",
              borderRadius:14, border:"1.5px solid #e8eaf6",
              background:"#fff", boxShadow:"0 2px 10px rgba(79,70,229,.06)",
            }}
          />
          {search && (
            <div onClick={() => setSearch("")} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", cursor:"pointer" }}>{Icons.x}</div>
          )}
        </div>

        {/* filter row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:".78rem", fontWeight:700 }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "All" && <span style={{ color:"#94a3b8" }}> · {statusFilter}</span>}
          </div>
          <button className="filter-chip" onClick={() => setFilters(v => !v)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"6px 12px", borderRadius:10, border:"1px solid #e8eaf6",
            background: showFilters ? "#ede9fe" : "#fff",
            color:      showFilters ? "#4f46e5" : "#94a3b8",
            fontFamily:"Inter,sans-serif", fontSize:".72rem", fontWeight:700, cursor:"pointer",
          }}>
            {Icons.funnel} Filter {showFilters ? Icons.caretDown : Icons.caret}
          </button>
        </div>

        {/* chips */}
        {showFilters && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {ALL_STATUSES.map(s => {
              const m      = s !== "All" ? STATUS_META[s] : null;
              const active = statusFilter === s;
              return (
                <button key={s} className="filter-chip" onClick={() => setStatus(s)} style={{
                  padding:"6px 13px", borderRadius:99, border:"none", cursor:"pointer",
                  fontFamily:"Inter,sans-serif", fontSize:".73rem", fontWeight:700,
                  background: active ? (m ? m.color : "#4f46e5") : (m ? m.bg : "#ede9fe"),
                  color:       active ? "#fff" : (m ? m.color : "#4f46e5"),
                  boxShadow:   active ? "0 3px 10px rgba(79,70,229,.22)" : "none",
                }}>
                  {s} ({counts[s]})
                </button>
              );
            })}
          </div>
        )}

        {/* list */}
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {filtered.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:".88rem", fontWeight:600 }}>No leads found 🔍</div>
            : filtered.map((lead, i) => (
                <div key={lead.id} className="lead-item" style={{ animationDelay:`${i * 30}ms` }}>
                  <LeadCard lead={lead} onClick={() => openDetail(lead)} onShare={setShareTarget} />
                </div>
              ))
          }
        </div>
      </div>

      {/* ── In-App Share Modal */}
      {shareTarget && (
        <ShareModal lead={shareTarget} onClose={() => setShareTarget(null)} />
      )}

      {/* ✅ ADDED: BottomNav بدل الـ floating nav اليدوي ← سطر واحد بدل 60 سطر */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
