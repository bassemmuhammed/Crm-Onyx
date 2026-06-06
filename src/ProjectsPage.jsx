// ── ProjectsPage.jsx — ONYX Design System ────────────────────
import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal from "./ProfileModal";
import Icons from "./Icons";

// ─── ONYX Tokens ─────────────────────────────────────────────
const C = {
  black:    "#000000",
  surface:  "#0A0A0A",
  card:     "#111111",
  border:   "#1E1E1E",
  cardAlt:  "#252525",
  cardHov:  "#2E2E2E",
  gray:     "#595A5F",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  redLight: "#FF2020",
  blue:     "#253FF6",
  green:    "#10b981",
  orange:   "#f97316",
  amber:    "#f59e0b",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
  :root { color-scheme: dark only; }
  html,body { margin:0; padding:0; background:#0A0A0A; }
  *, *::before, *::after { -webkit-tap-highlight-color:transparent; box-sizing:border-box; color-scheme:dark; -webkit-user-select:none; user-select:none; }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse-ring{ 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.14);opacity:1} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .onyx-card  { animation: fadeInUp .35s ease both; }
  .tap-scale:active { transform:scale(.96); }
  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
`;

const DEFAULT_NOTIFS = [
  { id:1, text:"New lead on your project",      time:"2 min ago",  color:C.blue,   unread:true  },
  { id:2, text:"Meeting scheduled for tomorrow", time:"1 hr ago",   color:C.green,  unread:true  },
  { id:3, text:"Project updated by admin",       time:"3 hrs ago",  color:C.orange, unread:false },
];

// ─── Story Viewer ─────────────────────────────────────────────
function StoryViewer({ stories, open, onClose }) {
  const [current,  setCurrent]  = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef  = useRef(null);
  const touchRef  = useRef({ startX: 0, startY: 0 });
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
      onTouchStart={e => { touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY }; }}
      onTouchEnd={e => {
        const dy = e.changedTouches[0].clientY - touchRef.current.startY;
        if (Math.abs(dy) > 60) onClose();
      }}
      style={{ position:"fixed", inset:0, zIndex:600, background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}
    >
      <img src={stories[current]} alt="story" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,.6) 0%,transparent 25%,transparent 70%,rgba(0,0,0,.6) 100%)" }} />

      {/* Progress bars */}
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
      <div style={{ position:"absolute", top:62, left:16, color:"rgba(255,255,255,.7)", fontSize:".68rem", fontWeight:700, fontFamily:"Archivo,sans-serif" }}>
        {current+1} / {stories.length}
      </div>
      <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,.4)", fontSize:".6rem", fontWeight:600, fontFamily:"Archivo,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
        <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>
        اسحب للإغلاق
      </div>
      <div onClick={goPrev} style={{ position:"absolute", left:0, top:0, width:"40%", height:"100%" }} />
      <div onClick={goNext} style={{ position:"absolute", right:0, top:0, width:"40%", height:"100%" }} />
    </div>
  );
}

// ─── Video Popup ──────────────────────────────────────────────
function VideoPopup({ src, open, onClose }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,.88)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"92%", maxWidth:440, borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:`0 24px 80px rgba(204,21,21,.2)`, background:C.card }}>
        <video src={src} controls autoPlay style={{ width:"100%", display:"block", maxHeight:"70vh" }} />
        <button onClick={onClose} style={{ width:"100%", padding:"14px", background:C.cardAlt, border:"none", borderTop:`1px solid ${C.border}`, color:C.silver, fontFamily:"Archivo,sans-serif", fontSize:".85rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {Icons.x} إغلاق الفيديو
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"62vh", padding:"40px 28px", textAlign:"center", fontFamily:"Archivo,sans-serif" }}>
      <div style={{ marginBottom:28, position:"relative" }}>
        <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:`1px solid ${C.red}33`, animation:"pulse-ring 2.8s ease-in-out infinite" }} />
        <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1px solid ${C.border}` }} />
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.card, border:`1.5px solid ${C.border}`, borderLeft:`2px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 32px ${C.red}22`, animation:"float 3s ease-in-out infinite" }}>
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

// ─── Info Card ────────────────────────────────────────────────
function InfoCard({ label, value, color }) {
  return (
    <div style={{ background:C.cardAlt, borderRadius:12, padding:"10px 12px", border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:".55rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:.8, marginBottom:4, fontFamily:"Archivo,sans-serif" }}>{label}</div>
      <div style={{ fontSize:".8rem", fontWeight:800, color: color || C.white, fontFamily:"Archivo,sans-serif" }}>{value}</div>
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────
function StatChip({ icon, value, label, color }) {
  return (
    <div style={{ flex:1, background:C.card, borderRadius:14, padding:"12px 10px", textAlign:"center", border:`1px solid ${C.border}`, borderTop:`2px solid ${color}` }}>
      <div style={{ color, display:"flex", justifyContent:"center", marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:"1.1rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif" }}>{value}</div>
      <div style={{ fontSize:".58rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:.4, fontFamily:"Archivo,sans-serif" }}>{label}</div>
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <div style={{ width:4, height:14, borderRadius:99, background:C.red, flexShrink:0 }} />
      <span style={{ fontSize:".65rem", fontWeight:800, color:C.silver, textTransform:"uppercase", letterSpacing:.8, fontFamily:"Archivo,sans-serif" }}>{children}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ProjectsPage({ onTabChange, onSignOut, onEditProject }) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(DEFAULT_NOTIFS);
  const [storyOpen,   setStoryOpen]   = useState(false);
  const [videoOpen,   setVideoOpen]   = useState(false);
  const [activeTab,   setActiveTab]   = useState(3);
  const [selectedIdx, setSelectedIdx] = useState(0);
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
        stats:        r.stats         || { leads:0, deals:0 },
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

  const unread = notifs.filter(n => n.unread).length;
  const p = projects.length > 0 ? (projects[selectedIdx] ?? projects[0]) : null;
  const handleTabChange = (i) => { setActiveTab(i); onTabChange?.(i); };

  return (
    <div style={{ minHeight:"100vh", background:C.surface, fontFamily:"Archivo,sans-serif", paddingBottom:100 }}>
      <style>{STYLES}</style>

      {/* Red top accent */}
      <div style={{ height:2, background:`linear-gradient(90deg,${C.red} 0%,${C.redLight} 40%,transparent 100%)`, position:"sticky", top:0, zIndex:100 }} />

      <AppHeader
        unreadCount={unread}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ── Project Tabs ── */}
      {projects.length > 1 && (
        <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 14px", borderBottom:`1px solid ${C.border}`, scrollbarWidth:"none" }}>
          {projects.map((proj, i) => {
            const active = i === selectedIdx;
            return (
              <button key={proj.id ?? i} onClick={() => setSelectedIdx(i)} className="tap-scale" style={{
                flexShrink:0, padding:"5px 13px", borderRadius:6,
                border:`1px solid ${active ? C.red+"66" : C.border}`,
                background: active ? `${C.red}18` : C.cardAlt,
                color: active ? C.white : C.gray,
                fontSize:".63rem", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", gap:5,
                fontFamily:"Archivo,sans-serif", transition:"all .15s ease",
              }}>
                {active && <div style={{ width:5, height:5, borderRadius:"50%", background:C.red }} />}
                {proj.name || `Project ${i+1}`}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16, fontFamily:"Archivo,sans-serif" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${C.border}`, borderTop:`3px solid ${C.red}`, animation:"spin .8s linear infinite" }} />
          <div style={{ fontSize:".72rem", color:C.gray, fontWeight:700, letterSpacing:.5 }}>LOADING PROJECTS...</div>
        </div>
      ) : !p ? (
        <EmptyState />
      ) : (
        <>
          {/* ── COVER SECTION ── */}
          <div style={{ position:"relative" }}>
            <div
              onClick={() => p.coverVideo && setVideoOpen(true)}
              style={{
                position:"relative", width:"100%", height:220,
                background:`linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #2a0808 100%)`,
                cursor: p.coverVideo ? "pointer" : "default",
                overflow:"hidden",
              }}
            >
              {/* Cover media */}
              {p.coverVideo ? (
                <video src={p.coverVideo} muted autoPlay loop playsInline style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.65 }} />
              ) : p.coverThumb ? (
                <img src={p.coverThumb} alt="cover" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.65 }} />
              ) : (
                <div style={{ width:"100%", height:"100%", background:`radial-gradient(ellipse 80% 60% at 50% 50%, ${C.red}18 0%, transparent 70%)` }} />
              )}

              {/* Gradient overlay */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,.3) 0%, transparent 40%, rgba(0,0,0,.7) 100%)" }} />

              {/* Play button */}
              {p.coverVideo && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(204,21,21,.25)", border:`2px solid ${C.red}88`, backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 32px ${C.red}44` }}>
                    <svg width="22" height="22" viewBox="0 0 256 256" fill="white">
                      <path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Status badge */}
              {p.status && (
                <div style={{ position:"absolute", top:12, right:12, background: p.statusColor || C.red, color:"#fff", fontSize:".6rem", fontWeight:800, padding:"4px 10px", borderRadius:99, boxShadow:"0 2px 10px rgba(0,0,0,.4)", fontFamily:"Archivo,sans-serif" }}>
                  {p.status}
                </div>
              )}

              {/* Edit button */}
              {onEditProject && (
                <button onClick={e => { e.stopPropagation(); onEditProject(p); }} className="tap-scale" style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,.6)", border:`1px solid ${C.border}`, backdropFilter:"blur(6px)", color:C.silver, borderRadius:8, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:".6rem", fontWeight:700, fontFamily:"Archivo,sans-serif" }}>
                  <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
                  Edit
                </button>
              )}

              {/* Tap to watch */}
              {p.coverVideo && (
                <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,.55)", color:C.silver, fontSize:".6rem", fontWeight:700, padding:"4px 12px", borderRadius:99, backdropFilter:"blur(4px)", whiteSpace:"nowrap", fontFamily:"Archivo,sans-serif" }}>
                  اضغط لمشاهدة الفيديو
                </div>
              )}
            </div>

            {/* Profile Pic / Story */}
            {p.profilePic && (
              <div style={{ position:"absolute", bottom:-36, left:18 }}>
                <div
                  onClick={() => p.stories?.length && setStoryOpen(true)}
                  style={{ width:74, height:74, borderRadius:"50%", cursor: p.stories?.length ? "pointer":"default", background:`linear-gradient(135deg, ${C.red}, ${C.redLight}, ${C.orange})`, padding:3, boxShadow:`0 4px 20px ${C.red}55` }}
                >
                  <div style={{ width:"100%", height:"100%", borderRadius:"50%", border:`2.5px solid ${C.surface}`, overflow:"hidden" }}>
                    <img src={p.profilePic} alt="project logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
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
          <div className="onyx-card" style={{ padding:"46px 16px 0", animationDelay:"0ms" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"1.2rem", fontWeight:900, color:C.white, lineHeight:1.2, fontFamily:"Archivo,sans-serif" }}>{p.name}</div>
                {p.developer && <div style={{ fontSize:".75rem", color:C.red, fontWeight:700, marginTop:4, fontFamily:"Archivo,sans-serif" }}>{p.developer}</div>}
                {p.location && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6, color:C.gray, fontSize:".72rem", fontWeight:600, fontFamily:"Archivo,sans-serif" }}>
                    <svg width="11" height="11" viewBox="0 0 256 256" fill={C.gray}><path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Zm0-104a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V96A8,8,0,0,0,128,88Zm0-32a12,12,0,1,0,12,12A12,12,0,0,0,128,56Z"/></svg>
                    {p.location}
                  </div>
                )}
              </div>
              {p.category && (
                <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, color:C.silver, fontSize:".58rem", fontWeight:800, padding:"4px 10px", borderRadius:6, flexShrink:0, fontFamily:"Archivo,sans-serif", whiteSpace:"nowrap" }}>
                  {p.category}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <StatChip icon={Icons.users}     value={p.stats?.leads ?? 0} label="Leads"  color={C.green}  />
              <StatChip icon={Icons.handshake} value={p.stats?.deals ?? 0} label="Deals"  color={C.orange} />
            </div>
          </div>

          {/* ── KEY INFO ── */}
          <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"60ms" }}>
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}` }}>
              <SectionTitle>Key Info</SectionTitle>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"Starting Price", value:p.price,       color:C.green  },
                  { label:"Unit Size",      value:p.area,        color:C.blue   },
                  { label:"Delivery",       value:p.delivery,    color:C.orange },
                  { label:"Status",         value:p.status,      color: p.statusColor || C.red },
                  { label:"Project Area",   value:p.projectArea, color:C.silver },
                  { label:"Parking",        value:p.parking,     color:C.silver },
                  { label:"Maintenance",    value:p.maintenance, color:C.silver },
                  { label:"Previous Work",  value:p.prevWork,    color:C.silver },
                ].filter(x => x.value).map((item,i) => (
                  <InfoCard key={i} label={item.label} value={item.value} color={item.color} />
                ))}
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          {p.description && (
            <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"100ms" }}>
              <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}` }}>
                <SectionTitle>About This Project</SectionTitle>
                <div style={{ fontSize:".8rem", color:C.silver, lineHeight:1.7, fontWeight:500, fontFamily:"Archivo,sans-serif" }}>
                  {p.description}
                </div>
              </div>
            </div>
          )}

          {/* ── AMENITIES ── */}
          {p.amenities?.length > 0 && (
            <div className="onyx-card" style={{ padding:"14px 16px 0", animationDelay:"130ms" }}>
              <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}` }}>
                <SectionTitle>Facilities & Amenities</SectionTitle>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {p.amenities.map((a,i) => (
                    <div key={i} style={{ background:`${C.red}18`, border:`1px solid ${C.red}44`, color:C.white, fontSize:".63rem", fontWeight:700, padding:"4px 10px", borderRadius:6, fontFamily:"Archivo,sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:4, height:4, borderRadius:"50%", background:C.red, flexShrink:0 }} />
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
              <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}` }}>
                <SectionTitle>Available Units</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {p.units.filter(u=>u.type).map((u,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, background:C.cardAlt, border:`1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize:".82rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>{u.type}</div>
                        {u.size && <div style={{ fontSize:".65rem", color:C.gray, fontWeight:600, marginTop:1, fontFamily:"Archivo,sans-serif" }}>{u.size}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        {u.price && <div style={{ fontSize:".78rem", fontWeight:800, color:C.red, fontFamily:"Archivo,sans-serif" }}>{u.price}</div>}
                        {u.available !== undefined && (
                          <div style={{ fontSize:".6rem", fontWeight:700, marginTop:2, color: u.available > 3 ? C.green : C.orange, fontFamily:"Archivo,sans-serif" }}>
                            {u.available} available
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
              <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}` }}>
                <SectionTitle>Payment Plans</SectionTitle>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {p.paymentPlans.filter(pl=>pl.downPayment||pl.duration).map((pl,i) => (
                    <div key={i} style={{ background:C.cardAlt, borderRadius:10, padding:"12px", border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:".6rem", fontWeight:800, color:C.red, textTransform:"uppercase", letterSpacing:.6, fontFamily:"Archivo,sans-serif", marginBottom:8 }}>Plan {i+1}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {[
                          { label:"Down Payment",  value:pl.downPayment  },
                          { label:"Installment",   value:pl.installment  },
                          { label:"Duration",      value:pl.duration     },
                          { label:"On Delivery",   value:pl.onDelivery   },
                        ].filter(x=>x.value).map((item,j) => (
                          <div key={j}>
                            <div style={{ fontSize:".55rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, fontFamily:"Archivo,sans-serif" }}>{item.label}</div>
                            <div style={{ fontSize:".78rem", color:C.white, fontWeight:700, marginTop:2, fontFamily:"Archivo,sans-serif" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {pl.notes && <div style={{ marginTop:8, fontSize:".7rem", color:C.gray, fontWeight:600, fontFamily:"Archivo,sans-serif", borderTop:`1px solid ${C.border}`, paddingTop:8 }}>{pl.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ height:20 }} />

          <StoryViewer stories={p.stories||[]} open={storyOpen && p.stories?.length>0} onClose={()=>setStoryOpen(false)} />
          <VideoPopup src={p.coverVideo} open={videoOpen && !!p.coverVideo} onClose={()=>setVideoOpen(false)} />
        </>
      )}

      <NotificationPanel open={notifOpen} onClose={()=>setNotifOpen(false)} notifs={notifs} onMarkAll={()=>setNotifs(prev=>prev.map(n=>({...n,unread:false})))} />
      <ProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)} onSignOut={onSignOut} />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
