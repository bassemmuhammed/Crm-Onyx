// ── ProjectsPage.jsx — ONYX Design System (Updated v2) ────────
import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Icons from "./Icons";
import { C } from "./theme";

// ─── ONYX Tokens ──────────────────────────────────────────────

// ─── Convert Arabic/Eastern Arabic numerals to Western ────────
function toWesternNums(str) {
  if (!str && str !== 0) return str;
  return String(str)
    .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632)
    .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
}

// ─── Global Styles ────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700;800;900&display=swap');
  :root { color-scheme: light only; }
  html,body { margin:0; padding:0; background:#F5F6FA; }
  *, *::before, *::after {
    -webkit-tap-highlight-color:transparent;
    box-sizing:border-box;
    color-scheme:light;
    -webkit-user-select:none;
    user-select:none;
    font-family:'Archivo',sans-serif !important;
  }
  @keyframes fadeInUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInScale { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
  @keyframes spin        { to{transform:rotate(360deg)} }
  @keyframes pulse-ring  { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.14);opacity:1} }
  @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes swipeHint   { 0%{opacity:0} 15%{opacity:1} 65%{opacity:1;transform:translateX(0)} 85%{opacity:0;transform:translateX(-6px)} 100%{opacity:0} }
  .onyx-card  { animation: fadeInUp .35s ease both; }
  .card-enter { animation: fadeInScale .26s ease both; }
  .tap-scale:active { transform:scale(.96); transition:transform .1s ease; }
  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#DC2626; border-radius:99px }
  .swipe-hint { animation: swipeHint 2.4s ease 0.6s both; }
`;

// ─── ONYX Logo for empty cover ─────────────────────────────────
function OnyxLogo({ size = 90, opacity = 0.13 }) {
  return (
    <div style={{ opacity, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size * 2.6} height={size} viewBox="0 0 260 100" fill="none">
        <text x="2" y="82" fontSize="88" fontWeight="900" fill="white"
          fontFamily="Archivo,sans-serif" letterSpacing="-3">ONYX</text>
        <line x1="196" y1="8"  x2="252" y2="88" stroke="#DC2626" strokeWidth="7" strokeLinecap="round"/>
        <line x1="252" y1="8"  x2="196" y2="88" stroke="#DC2626" strokeWidth="7" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ─── Story Viewer ──────────────────────────────────────────────
function StoryViewer({ stories, open, onClose }) {
  const [current,  setCurrent]  = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef  = useRef(null);
  const touchRef  = useRef({ startY: 0 });
  const DURATION  = 4000;

  useEffect(() => {
    if (!open) { setProgress(0); setCurrent(0); return; }
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        if (current < stories.length - 1) setCurrent(c => c + 1);
        else onClose();
      }
    }, 30);
    return () => clearInterval(timerRef.current);
  }, [open, current]);

  if (!open) return null;
  const goNext = () => { clearInterval(timerRef.current); current < stories.length - 1 ? setCurrent(c=>c+1) : onClose(); };
  const goPrev = () => { clearInterval(timerRef.current); current > 0 && setCurrent(c=>c-1); };

  return (
    <div
      onTouchStart={e => { touchRef.current = { startY: e.touches[0].clientY }; }}
      onTouchEnd={e => { if (Math.abs(e.changedTouches[0].clientY - touchRef.current.startY) > 60) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:600, background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}
    >
      <img src={stories[current]} alt="story" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,.6) 0%,transparent 25%,transparent 70%,rgba(0,0,0,.6) 100%)" }} />
      <div style={{ position:"absolute", top:52, left:12, right:12, display:"flex", gap:4 }}>
        {stories.map((_,i) => (
          <div key={i} style={{ flex:1, height:2.5, borderRadius:99, background:"rgba(255,255,255,.25)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:99, background:C.red, width: i<current?"100%":i===current?`${progress}%`:"0%", transition:"width .03s linear" }} />
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ position:"absolute", top:48, right:16, background:"rgba(0,0,0,.5)", border:`1px solid ${C.border}`, color:C.white, borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {Icons.x}
      </button>
      <div onClick={goPrev} style={{ position:"absolute", left:0, top:0, width:"40%", height:"100%" }} />
      <div onClick={goNext} style={{ position:"absolute", right:0, top:0, width:"40%", height:"100%" }} />
    </div>
  );
}

// ─── Video Popup ───────────────────────────────────────────────
function VideoPopup({ src, open, onClose }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,.88)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"92%", maxWidth:440, borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`, background:C.card }}>
        <video src={src} controls autoPlay style={{ width:"100%", display:"block", maxHeight:"70vh" }} />
        <button onClick={onClose} style={{ width:"100%", padding:"14px", background:C.cardAlt, border:"none", borderTop:`1px solid ${C.border}`, color:C.silver, fontSize:".85rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {Icons.x} إغلاق الفيديو
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"62vh", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ marginBottom:28, position:"relative" }}>
        <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:`1px solid ${C.red}33`, animation:"pulse-ring 2.8s ease-in-out infinite" }} />
        <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1px solid ${C.border}` }} />
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.card, border:`1.5px solid ${C.border}`, borderLeft:`2px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", animation:"float 3s ease-in-out infinite" }}>
          <svg width="32" height="32" viewBox="0 0 256 256" fill={C.red}>
            <path d="M240,208H224V96a16,16,0,0,0-16-16H144V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V208H8a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM144,208H112V168a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8Zm64,0H160V168a24,24,0,0,0-24-24H120a24,24,0,0,0-24,24v40H32V48H128V96h0a16,16,0,0,0,16,16h64Z"/>
          </svg>
        </div>
      </div>
      <div style={{ fontSize:"1.1rem", fontWeight:900, color:C.white, marginBottom:10 }}>No Projects Yet</div>
      <div style={{ fontSize:".78rem", color:C.gray, fontWeight:600, lineHeight:1.7, maxWidth:250 }}>
        المشاريع هتظهر هنا أول ما الأدمن يضيفها
      </div>
    </div>
  );
}

// ─── Project Avatar ────────────────────────────────────────────
function ProjectAvatar({ project, size = 52 }) {
  const initials = (project.name || "P").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.22,
      background: project.profilePic ? "transparent" : C.cardAlt,
      border:`1.5px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      overflow:"hidden", flexShrink:0,
    }}>
      {project.profilePic
        ? <img src={project.profilePic} alt={project.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        : <span style={{ fontSize:size*0.28+"px", fontWeight:900, color:C.silver }}>{initials}</span>
      }
    </div>
  );
}

// ─── Status Badge — black bg, white text, red dot ─────────────
function StatusBadge({ label }) {
  if (!label) return null;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:C.black,
      border:`1px solid ${C.border}`,
      color:C.white,
      fontSize:".56rem", fontWeight:800,
      padding:"3px 9px", borderRadius:5,
      whiteSpace:"nowrap",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0, display:"inline-block" }} />
      {label}
    </span>
  );
}

// ─── Project List Card ─────────────────────────────────────────
function ProjectListCard({ project, index, onSelect }) {
  return (
    <div
      className="onyx-card tap-scale"
      onClick={() => onSelect(index)}
      style={{
        background:    C.cardGrad1,
        borderRadius:  16,
        border:        `1px solid ${C.border}`,
        overflow:      "hidden",
        position:      "relative",
        cursor:        "pointer",
        animationDelay:`${index * 70}ms`,
        boxShadow:     "0 4px 20px rgba(0,0,0,.4)",
      }}
    >
      {/* Left red accent bar — thick top, fades down */}
      <div style={{
        position:"absolute", top:0, left:0, bottom:0, width:3,
        background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`,
        borderRadius:"16px 0 0 16px",
      }} />

      <div style={{ padding:"14px 14px 12px 18px" }}>
        {/* Row 1: Avatar + Name/Developer + Chevron */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <ProjectAvatar project={project} size={52} />

          <div style={{ flex:1, minWidth:0 }}>
            {/* Project name */}
            <div style={{ fontSize:".95rem", fontWeight:900, color:C.white, lineHeight:1.2 }}>
              {toWesternNums(project.name)}
            </div>
            {/* Developer: white, inline with red dot */}
            {project.developer && (
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
                <span style={{ fontSize:".72rem", color:C.white, fontWeight:700 }}>
                  {toWesternNums(project.developer)}
                </span>
              </div>
            )}
            {/* Tags row */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7, alignItems:"center" }}>
              {project.location && (
                <span
                  onClick={project.locationUrl ? e => { e.stopPropagation(); window.open(project.locationUrl, "_blank"); } : undefined}
                  style={{ fontSize:".54rem", fontWeight:600, color: project.locationUrl ? C.white : C.gray, background:C.cardAlt, border:`1px solid ${project.locationUrl ? C.red+"55" : C.border}`, padding:"2px 8px", borderRadius:5, display:"flex", alignItems:"center", gap:4, cursor: project.locationUrl ? "pointer" : "default" }}
                >
                  <svg width="9" height="9" viewBox="0 0 256 256" fill={project.locationUrl ? C.red : C.gray}>
                    <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,168a8,8,0,0,1-6.93-4c-9-15.77-34.27-63.7-34.27-84a41.2,41.2,0,0,1,82.4,0c0,20.27-25.25,68.2-34.27,84A8,8,0,0,1,128,184Zm0-104a24,24,0,1,0,24,24A24,24,0,0,0,128,80Z"/>
                  </svg>
                  {toWesternNums(project.location)}
                  {project.locationUrl && (
                    <svg width="7" height="7" viewBox="0 0 256 256" fill={C.red} style={{ flexShrink:0 }}>
                      <path d="M224,104a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32-11.32L196.69,64H168a8,8,0,0,1,0-16h48a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/>
                    </svg>
                  )}
                </span>
              )}
              {project.category && (
                <span style={{ fontSize:".54rem", fontWeight:700, color:C.silver, background:C.cardAlt, border:`1px solid ${C.border}`, padding:"2px 8px", borderRadius:5 }}>
                  {project.category}
                </span>
              )}
              {/* Status badge — black bg, white text, red dot */}
              {project.status && <StatusBadge label={project.status} />}
            </div>
          </div>

          {/* Chevron */}
          <div style={{ color:C.gray, flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66A8,8,0,0,1,101.66,42.34l80,80A8,8,0,0,1,181.66,133.66Z"/>
            </svg>
          </div>
        </div>

        {/* Quick info chips — centered text */}
        {(project.price || project.delivery || project.area) && (
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {[
              { label:"Starting Price", value:project.price,    color:C.green  },
              { label:"Unit Size",      value:project.area,     color:C.blue   },
              { label:"Delivery",       value:project.delivery, color:C.orange },
            ].filter(d => d.value).map((d, i) => (
              <div key={i} style={{ flex:1, background:C.cardAlt, borderRadius:8, padding:"7px 6px", border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontSize:".43rem", color:d.color, fontWeight:800, textTransform:"uppercase", letterSpacing:.3, marginBottom:3 }}>{d.label}</div>
                <div style={{ fontSize:".67rem", color:C.white, fontWeight:800 }}>{toWesternNums(d.value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Info Card (Detail View) — centered, white text ───────────
function InfoCard({ label, value, color }) {
  return (
    <div style={{ background:C.cardAlt, borderRadius:12, padding:"10px 12px", border:`1px solid ${C.border}`, textAlign:"center" }}>
      <div style={{ fontSize:".52rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:".82rem", fontWeight:800, color: color || C.white }}>{toWesternNums(value)}</div>
    </div>
  );
}

// ─── Section Title ─────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <div style={{ width:3, height:14, borderRadius:99, background:C.red, flexShrink:0 }} />
      <span style={{ fontSize:".65rem", fontWeight:800, color:C.white, textTransform:"uppercase", letterSpacing:.8 }}>{children}</span>
    </div>
  );
}

// ─── Swipe Hook ────────────────────────────────────────────────
function useSwipe(onPrev, onNext) {
  const startX = useRef(null);
  const startY = useRef(null);
  const onTouchStart = e => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; };
  const onTouchEnd   = e => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
    if (Math.abs(dx) < 50 || dy > Math.abs(dx)) return;
    if (dx < 0) onNext(); else onPrev();
    startX.current = null;
  };
  return { onTouchStart, onTouchEnd };
}

// ─── Project Detail View ───────────────────────────────────────
function ProjectDetail({ project: p, onBack, onPrev, onNext, hasPrev, hasNext, onEditProject }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const swipe = useSwipe(onPrev, onNext);

  return (
    <div {...swipe} className="card-enter" style={{ color:C.white, paddingBottom:20 }}>

      {/* ── Back + swipe hint ── */}
      <div style={{ padding:"12px 16px 0", display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={onBack} className="tap-scale" style={{ display:"flex", alignItems:"center", gap:6, background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", color:C.silver, cursor:"pointer", fontSize:".68rem", fontWeight:700 }}>
          <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
            <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
          </svg>
          Back
        </button>
        {(hasPrev || hasNext) && (
          <div className="swipe-hint" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, fontSize:".58rem", color:C.gray, fontWeight:600 }}>
            <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,133.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,136H88a8,8,0,0,1,0-16H204.69L170.34,85.66A8,8,0,0,1,181.66,74.34l48,48A8,8,0,0,1,229.66,133.66ZM74.34,181.66a8,8,0,0,0-11.32-11.32L26.34,133.66a8,8,0,0,0,0-11.32L63,85.66A8,8,0,0,0,51.66,74.34l-48,48a8,8,0,0,0,0,11.32l48,48A8,8,0,0,0,74.34,181.66Z"/></svg>
            اسحب للتنقل
          </div>
        )}
      </div>

      {/* ── Cover ── */}
      <div style={{ position:"relative", marginTop:12 }}>
        <div
          onClick={() => p.coverVideo && setVideoOpen(true)}
          style={{ position:"relative", width:"100%", height:220, background:C.black, cursor:p.coverVideo?"pointer":"default", overflow:"hidden" }}
        >
          {p.coverVideo ? (
            <video src={p.coverVideo} muted autoPlay loop playsInline style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.65 }} />
          ) : p.coverThumb ? (
            <img src={p.coverThumb} alt="cover" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.65 }} />
          ) : (
            <div style={{ width:"100%", height:"100%", background:C.black, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <OnyxLogo size={70} opacity={0.14} />
            </div>
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,.25) 0%, transparent 40%, rgba(0,0,0,.65) 100%)" }} />

          {p.coverVideo && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(204,21,21,.25)", border:`2px solid ${C.red}88`, backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 256 256" fill="white"><path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"/></svg>
              </div>
            </div>
          )}

          {/* Status in cover — black bg, white text, red dot */}
          {p.status && (
            <div style={{ position:"absolute", top:12, right:12 }}>
              <StatusBadge label={p.status} />
            </div>
          )}

          {onEditProject && (
            <button onClick={e => { e.stopPropagation(); onEditProject(p); }} className="tap-scale" style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,.6)", border:`1px solid ${C.border}`, backdropFilter:"blur(6px)", color:C.silver, borderRadius:8, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:".6rem", fontWeight:700 }}>
              <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
              Edit
            </button>
          )}

          {p.coverVideo && (
            <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,.55)", color:C.silver, fontSize:".6rem", fontWeight:700, padding:"4px 12px", borderRadius:99, backdropFilter:"blur(4px)", whiteSpace:"nowrap" }}>
              اضغط لمشاهدة الفيديو
            </div>
          )}
        </div>

        {/* Profile ring */}
        {p.profilePic && (
          <div style={{ position:"absolute", bottom:-36, left:18 }}>
            <div onClick={() => p.stories?.length && setStoryOpen(true)} style={{ width:74, height:74, borderRadius:"50%", cursor:p.stories?.length?"pointer":"default", background:`linear-gradient(135deg, ${C.red}, ${C.redLight}, ${C.orange})`, padding:3, boxShadow:`0 4px 20px ${C.red}55` }}>
              <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:`2.5px solid ${C.surface}`, overflow:"hidden" }}>
                <img src={p.profilePic} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>
            {p.stories?.length > 0 && (
              <div style={{ position:"absolute", bottom:2, right:2, width:14, height:14, borderRadius:"50%", background:C.red, border:`2px solid ${C.surface}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="7" height="7" viewBox="0 0 256 256" fill="white"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/></svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PROJECT IDENTITY ── */}
      <div className="onyx-card" style={{ padding:`${p.profilePic ? "46px" : "14px"} 16px 0`, animationDelay:"0ms" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Name */}
            <div style={{ fontSize:"1.22rem", fontWeight:900, color:C.white, lineHeight:1.2 }}>
              {toWesternNums(p.name)}
            </div>
            {/* Developer — white, red dot, slightly larger */}
            {p.developer && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:C.red, flexShrink:0 }} />
                <span style={{ fontSize:".82rem", color:C.white, fontWeight:700 }}>
                  {toWesternNums(p.developer)}
                </span>
              </div>
            )}
            {p.location && (
              <div
                onClick={p.locationUrl ? () => window.open(p.locationUrl, "_blank") : undefined}
                style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:6, color: p.locationUrl ? C.white : C.gray, fontSize:".72rem", fontWeight:600, cursor: p.locationUrl ? "pointer" : "default", background: p.locationUrl ? C.cardAlt : "transparent", border: p.locationUrl ? `1px solid ${C.red}55` : "none", padding: p.locationUrl ? "3px 10px" : "3px 0", borderRadius:6 }}
              >
                <svg width="11" height="11" viewBox="0 0 256 256" fill={p.locationUrl ? C.red : C.gray}>
                  <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,168a8,8,0,0,1-6.93-4c-9-15.77-34.27-63.7-34.27-84a41.2,41.2,0,0,1,82.4,0c0,20.27-25.25,68.2-34.27,84A8,8,0,0,1,128,184Zm0-104a24,24,0,1,0,24,24A24,24,0,0,0,128,80Z"/>
                </svg>
                {toWesternNums(p.location)}
                {p.locationUrl && (
                  <svg width="8" height="8" viewBox="0 0 256 256" fill={C.red} style={{ flexShrink:0 }}>
                    <path d="M224,104a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32-11.32L196.69,64H168a8,8,0,0,1,0-16h48a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/>
                  </svg>
                )}
              </div>
            )}
          </div>
          {p.category && (
            <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, color:C.silver, fontSize:".58rem", fontWeight:800, padding:"4px 10px", borderRadius:6, flexShrink:0, whiteSpace:"nowrap" }}>
              {p.category}
            </div>
          )}
        </div>
      </div>

      {/* ── KEY INFO ── */}
      <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"60ms" }}>
        <div style={{ background:C.card, borderRadius:14, padding:"14px 14px 14px 17px", border:`1px solid ${C.border}`, position:"relative" }}>
          {/* Gradient left accent bar — thick red top, fades down */}
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`, borderRadius:"14px 0 0 14px" }} />
          <SectionTitle>Key Info</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Starting Price", value:p.price,       color:C.green  },
              { label:"Unit Size",      value:p.area,        color:C.blue   },
              { label:"Delivery",       value:p.delivery,    color:C.orange },
              { label:"Status",         value:p.status,      color:C.white  },
              { label:"Project Area",   value:p.projectArea, color:C.white  },
              { label:"Parking",        value:p.parking,     color:C.white  },
              { label:"Maintenance",    value:p.maintenance, color:C.white  },
              { label:"Previous Work",  value:p.prevWork,    color:C.white  },
            ].filter(x => x.value).map((item,i) => (
              <InfoCard key={i} label={item.label} value={item.value} color={item.color} />
            ))}
          </div>
        </div>
      </div>

      {/* ── DESCRIPTION ── */}
      {p.description && (
        <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"100ms" }}>
          <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`, borderRadius:"14px 0 0 14px" }} />
            <SectionTitle>About This Project</SectionTitle>
            <div style={{ fontSize:".8rem", color:C.white, lineHeight:1.7, fontWeight:500 }}>
              {toWesternNums(p.description)}
            </div>
          </div>
        </div>
      )}

      {/* ── AMENITIES — black bg, white text, red dot ── */}
      {p.amenities?.length > 0 && (
        <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"130ms" }}>
          <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`, borderRadius:"14px 0 0 14px" }} />
            <SectionTitle>Facilities & Amenities</SectionTitle>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {p.amenities.map((a,i) => (
                <div key={i} style={{
                  background: C.black,
                  border:`1px solid ${C.border}`,
                  color:C.white,
                  fontSize:".63rem", fontWeight:700,
                  padding:"5px 11px", borderRadius:6,
                  display:"flex", alignItems:"center", gap:6,
                }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AVAILABLE UNITS ── */}
      {p.units?.filter(u=>u.type).length > 0 && (
        <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"160ms" }}>
          <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`, borderRadius:"14px 0 0 14px" }} />
            <SectionTitle>Available Units</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {p.units.filter(u=>u.type).map((u,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, background:C.cardAlt, border:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:".82rem", fontWeight:800, color:C.white }}>{toWesternNums(u.type)}</div>
                    {u.size && <div style={{ fontSize:".65rem", color:C.gray, fontWeight:600, marginTop:1 }}>{toWesternNums(u.size)}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {u.price && <div style={{ fontSize:".78rem", fontWeight:800, color:C.white }}>{toWesternNums(u.price)}</div>}
                    {u.available !== undefined && (
                      <div style={{ fontSize:".6rem", fontWeight:700, marginTop:2, color:u.available > 3 ? C.green : C.orange }}>
                        {toWesternNums(u.available)} available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT PLANS ── */}
      {p.paymentPlans?.filter(pl=>pl.downPayment||pl.duration).length > 0 && (
        <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"190ms" }}>
          <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.04) 100%)`, borderRadius:"14px 0 0 14px" }} />
            <SectionTitle>Payment Plans</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {p.paymentPlans.filter(pl=>pl.downPayment||pl.duration).map((pl,i) => (
                <div key={i} style={{ background:C.cardAlt, borderRadius:10, padding:"12px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:".6rem", fontWeight:800, color:C.red, textTransform:"uppercase", letterSpacing:.6, marginBottom:8 }}>Plan {i+1}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, textAlign:"center" }}>
                    {[
                      { label:"Down Payment", value:pl.downPayment },
                      { label:"Installment",  value:pl.installment },
                      { label:"Duration",     value:pl.duration    },
                      { label:"On Delivery",  value:pl.onDelivery  },
                    ].filter(x=>x.value).map((item,j) => (
                      <div key={j}>
                        <div style={{ fontSize:".52rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>{item.label}</div>
                        <div style={{ fontSize:".8rem", color:C.white, fontWeight:700, marginTop:3 }}>{toWesternNums(item.value)}</div>
                      </div>
                    ))}
                  </div>
                  {pl.notes && <div style={{ marginTop:8, fontSize:".7rem", color:C.gray, fontWeight:600, borderTop:`1px solid ${C.border}`, paddingTop:8, textAlign:"center" }}>{pl.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ height:20 }} />
      <StoryViewer stories={p.stories||[]} open={storyOpen && p.stories?.length>0} onClose={()=>setStoryOpen(false)} />
      <VideoPopup src={p.coverVideo} open={videoOpen && !!p.coverVideo} onClose={()=>setVideoOpen(false)} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function ProjectsPage({ onTabChange, onSignOut, onEditProject }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending:false });
    if (!error && data) {
      setProjects(data.map(r => ({
        id:           r.id,
        name:         r.name,
        developer:    r.developer,
        location:     r.location,
        locationUrl:  r.location_url || null,
        category:     r.category,
        status:       r.status,
        statusColor:  r.status_color,
        isLaunch:     r.is_launch,
        price:        r.price,
        area:         r.area,
        delivery:     r.delivery,
        projectArea:  r.project_area,
        prevWork:     r.prev_work,
        maintenance:  r.maintenance,
        parking:      r.parking,
        description:  r.description,
        coverVideo:   r.cover_video,
        coverThumb:   r.cover_thumb,
        profilePic:   r.profile_pic,
        amenities:    r.amenities     || [],
        units:        r.units         || [],
        stories:      r.stories       || [],
        paymentPlans: r.payment_plans || [],
        agent:        r.agent         || {},
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    const ch = supabase.channel("projects-sales")
      .on("postgres_changes", { event:"*", schema:"public", table:"projects" }, fetchProjects)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const goToPrev = () => setSelectedIdx(i => Math.max(0, i - 1));
  const goToNext = () => setSelectedIdx(i => Math.min(projects.length - 1, i + 1));

  return (
    <div style={{ color:C.white }}>
      <style>{STYLES}</style>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${C.border}`, borderTop:`3px solid ${C.red}`, animation:"spin .8s linear infinite" }} />
          <div style={{ fontSize:".72rem", color:C.gray, fontWeight:700, letterSpacing:.5 }}>LOADING PROJECTS...</div>
        </div>

      ) : projects.length === 0 ? (
        <EmptyState />

      ) : selectedIdx === null ? (
        /* ── LIST VIEW ── */
        <div>
          {/* Header */}
          <div style={{ padding:"14px 16px 0", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:18, background:C.red, borderRadius:99 }} />
            <span style={{ fontSize:".72rem", fontWeight:900, color:C.white, textTransform:"uppercase", letterSpacing:"2px" }}>
              Projects
            </span>
            <span style={{ marginLeft:"auto", background:C.cardAlt, border:`1px solid ${C.border}`, color:C.gray, fontSize:".58rem", fontWeight:800, padding:"2px 10px", borderRadius:99 }}>
              {projects.length}
            </span>
          </div>

          {/* Cards */}
          <div style={{ padding:"12px 16px 110px", display:"flex", flexDirection:"column", gap:10 }}>
            {projects.map((proj, i) => (
              <ProjectListCard key={proj.id ?? i} project={proj} index={i} onSelect={setSelectedIdx} />
            ))}
          </div>
        </div>

      ) : (
        /* ── DETAIL VIEW ── */
        <ProjectDetail
          project={projects[selectedIdx]}
          onBack={() => setSelectedIdx(null)}
          onPrev={goToPrev}
          onNext={goToNext}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < projects.length - 1}
          onEditProject={onEditProject}
        />
      )}
    </div>
  );
}
