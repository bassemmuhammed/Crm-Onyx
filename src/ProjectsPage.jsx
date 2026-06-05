// ── ProjectsPage.jsx ─────────────────────────────────────────
// صفحة المشاريع - ONYX CRM
// Features:
//   - Cover video from Google Drive (click to open in popup)
//   - Profile picture as story (click opens Instagram-style story viewer)
//   - Project details below
//   - View only — data comes from AddProjectPage (passed as `project` prop)
//   - Shows empty state if no project is passed

import { useState, useRef, useEffect } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal from "./ProfileModal";
import Icons from "./Icons";

// ─── Notifications (static) ─────────────────────────────────
const DEFAULT_NOTIFICATIONS = [
  { id: 1, text: "New lead on your project", time: "2 min ago", color: "#4f46e5", unread: true },
  { id: 2, text: "Meeting scheduled for tomorrow", time: "1 hr ago", color: "#10b981", unread: true },
  { id: 3, text: "Project updated by owner", time: "3 hrs ago", color: "#f97316", unread: false },
];

// ─── Story Viewer ────────────────────────────────────────────
function StoryViewer({ stories, open, onClose }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const touchRef = useRef({ startY: 0, startX: 0 });
  const DURATION = 4000;

  useEffect(() => {
    if (!open) { setProgress(0); setCurrent(0); return; }
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        if (current < stories.length - 1) setCurrent(c => c + 1);
        else onClose();
      }
    }, 30);
    return () => clearInterval(timerRef.current);
  }, [open, current]);

  const goNext = () => { clearInterval(timerRef.current); if (current < stories.length - 1) setCurrent(c => c + 1); else onClose(); };
  const goPrev = () => { clearInterval(timerRef.current); if (current > 0) setCurrent(c => c - 1); };

  const onTouchStart = (e) => {
    touchRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX };
  };
  const onTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (Math.abs(dy) > 60) onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <img src={stories[current]} alt="story" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 25%, transparent 70%, rgba(0,0,0,.6) 100%)",
      }} />

      <div style={{ position: "absolute", top: 52, left: 12, right: 12, display: "flex", gap: 4 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 99, background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "#fff",
              width: i < current ? "100%" : i === current ? `${progress}%` : "0%",
            }} />
          </div>
        ))}
      </div>

      <button onClick={onClose} style={{
        position: "absolute", top: 48, right: 16,
        background: "rgba(0,0,0,.4)", border: "none", color: "#fff",
        borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {Icons.x}
      </button>

      <div style={{ position: "absolute", top: 62, left: 16, color: "rgba(255,255,255,.8)", fontSize: ".7rem", fontWeight: 700 }}>
        {current + 1} / {stories.length}
      </div>

      <div style={{
        position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
        color: "rgba(255,255,255,.45)", fontSize: ".6rem", fontWeight: 600,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      }}>
        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
        </svg>
        اسحب للإغلاق
      </div>

      <div onClick={goPrev} style={{ position: "absolute", left: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} />
      <div onClick={goNext} style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} />

      {current > 0 && (
        <div onClick={goPrev} style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,.15)", borderRadius: "50%",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)",
        }}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
            <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
          </svg>
        </div>
      )}
      {current < stories.length - 1 && (
        <div onClick={goNext} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,.15)", borderRadius: "50%",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)",
        }}>
          {Icons.caretRight}
        </div>
      )}
    </div>
  );
}

// ─── Video Popup ─────────────────────────────────────────────
function VideoPopup({ src, open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "92%", maxWidth: 440,
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,.6)",
        background: "#000",
      }}>
        <video
          src={src}
          controls
          autoPlay
          style={{ width: "100%", display: "block", maxHeight: "70vh" }}
        />
        <button onClick={onClose} style={{
          width: "100%", padding: "14px",
          background: "#1e1b4b", border: "none",
          color: "#fff", fontFamily: "Inter,sans-serif",
          fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {Icons.x} Close Video
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
function StatChip({ icon, value, label, color }) {
  return (
    <div style={{
      flex: 1, background: "#fff", borderRadius: 14,
      padding: "12px 10px", textAlign: "center",
      border: "1px solid #e8eaf6",
      boxShadow: "0 2px 12px rgba(79,70,229,.06)",
    }}>
      <div style={{ color, display: "flex", justifyContent: "center", marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1e1b4b" }}>{value}</div>
      <div style={{ fontSize: ".58rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

// ─── ONYX Design Tokens ──────────────────────────────────────
const C = {
  black:   "#000000",
  surface: "#0A0A0A",
  card:    "#111111",
  border:  "#1E1E1E",
  cardAlt: "#252525",
  gray:    "#595A5F",
  silver:  "#CECECE",
  white:   "#FFFFFF",
  red:     "#CC1515",
  redLight:"#FF2020",
};

const ONYX_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
  :root { color-scheme: dark only; }
  html,body { margin:0; padding:0; background:#0A0A0A; }
  *, *::before, *::after { -webkit-tap-highlight-color:transparent; box-sizing:border-box; color-scheme:dark; }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.12);opacity:1} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .onyx-empty-icon { animation: float 3s ease-in-out infinite; }
  .onyx-empty-wrap  { animation: fadeInUp .4s ease both; }
`;

// ─── Empty State ─────────────────────────────────────────────
function EmptyState() {
  return (
    <>
      <style>{ONYX_STYLES}</style>
      <div className="onyx-empty-wrap" style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "62vh", padding: "40px 28px", textAlign: "center",
        fontFamily: "Archivo, sans-serif",
      }}>

        {/* Icon container */}
        <div className="onyx-empty-icon" style={{ marginBottom: 28, position: "relative" }}>
          {/* Outer pulse ring */}
          <div style={{
            position: "absolute", inset: -14, borderRadius: "50%",
            border: `1px solid ${C.red}33`,
            animation: "pulse-ring 2.8s ease-in-out infinite",
          }} />
          {/* Inner ring */}
          <div style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: `1px solid ${C.border}`,
          }} />
          {/* Icon circle */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderLeft: `2px solid ${C.red}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 32px ${C.red}22, 0 8px 32px rgba(0,0,0,.5)`,
          }}>
            <svg width="32" height="32" viewBox="0 0 256 256" fill={C.red}>
              <path d="M240,208H224V96a16,16,0,0,0-16-16H144V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V208H8a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM144,208H112V168a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8Zm64,0H160V168a24,24,0,0,0-24-24H120a24,24,0,0,0-24,24v40H32V48H128V96h0a16,16,0,0,0,16,16h64Z"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: "1.15rem", fontWeight: 900, color: C.white,
          letterSpacing: 0.2, marginBottom: 10,
        }}>
          No Project Added Yet
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: ".78rem", color: C.gray, fontWeight: 600,
          lineHeight: 1.7, maxWidth: 250, marginBottom: 28,
        }}>
          أضف مشروعك الأول من صفحة{" "}
          <span style={{ color: C.silver, fontWeight: 700 }}>"Add Project"</span>
          {" "}وسيظهر هنا تلقائياً
        </div>

        {/* Divider hint */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 220,
        }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <div style={{ fontSize: ".55rem", fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase" }}>
            waiting
          </div>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Dots indicator */}
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 18 : 6, height: 6, borderRadius: 99,
              background: i === 1 ? C.red : C.border,
              transition: "all .3s ease",
            }} />
          ))}
        </div>

      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────
// Props:
//   project     — object from AddProjectPage (see shape below), or null/undefined
//   onTabChange — (index) => void
//   onSignOut   — () => void
//
// Expected `project` shape (mirrors AddProjectPage output):
// {
//   name, developer, location, category, projectType, status, statusColor,
//   coverVideo, profilePic, price, area, delivery, description,
//   amenities: string[],
//   units: [{ type, size, price, available }],
//   stories: string[],
//   stats: { leads, deals },
// }

export default function ProjectsPage({ projects = [], onTabChange, onSignOut, onEditProject, onAddProject }) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(DEFAULT_NOTIFICATIONS);
  const [storyOpen,   setStoryOpen]   = useState(false);
  const [videoOpen,   setVideoOpen]   = useState(false);
  const [activeTab,   setActiveTab]   = useState(3); // Projects tab
  const [selectedIdx, setSelectedIdx] = useState(0);

  const unread = notifs.filter(n => n.unread).length;
  // Pick the currently selected project from the array
  const p = projects.length > 0 ? (projects[selectedIdx] ?? projects[0]) : null;

  const handleTabChange = (i) => {
    setActiveTab(i);
    onTabChange?.(i);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.surface,
      fontFamily: "Archivo, sans-serif",
      paddingBottom: 100,
    }}>
      {/* Header */}
      <AppHeader
        unreadCount={unread}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ── PROJECT TABS (if multiple projects) ── */}
      {projects.length > 1 && (
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px",
          borderBottom: `1px solid ${C.border}`,
          scrollbarWidth: "none",
        }}>
          {projects.map((proj, i) => {
            const active = i === selectedIdx;
            return (
              <button key={proj.id ?? i} onClick={() => setSelectedIdx(i)} style={{
                flexShrink: 0, padding: "5px 13px", borderRadius: 6,
                border: `1px solid ${active ? C.red + "66" : C.border}`,
                background: active ? `${C.red}18` : C.cardAlt,
                color: active ? C.white : C.gray,
                fontSize: ".63rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                fontFamily: "Archivo, sans-serif",
              }}>
                {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />}
                {proj.name || `Project ${i + 1}`}
              </button>
            );
          })}
        </div>
      )}

      {/* ── NO PROJECT → Empty State ── */}
      {!p ? (
        <EmptyState />
      ) : (
        <>
          {/* ── COVER SECTION ── */}
          <div style={{ position: "relative" }}>

            {/* Cover video thumbnail / click area */}
            <div
              onClick={() => p.coverVideo && setVideoOpen(true)}
              style={{
                position: "relative", width: "100%", height: 220,
                background: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#7c3aed 100%)",
                cursor: p.coverVideo ? "pointer" : "default",
                overflow: "hidden",
              }}
            >
              {p.coverVideo ? (
                <video
                  src={p.coverVideo}
                  muted autoPlay loop playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                />
              ) : p.coverThumb ? (
                <img
                  src={p.coverThumb}
                  alt="cover"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                />
              ) : null}

              {/* Play button overlay — only if video exists */}
              {p.coverVideo && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,.25)",
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "rgba(255,255,255,.2)",
                    border: "2.5px solid rgba(255,255,255,.7)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(0,0,0,.3)",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 256 256" fill="white">
                      <path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Status badge */}
              {p.status && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: p.statusColor || "#4f46e5", color: "#fff",
                  fontSize: ".62rem", fontWeight: 800,
                  padding: "4px 10px", borderRadius: 99,
                  boxShadow: "0 2px 8px rgba(0,0,0,.25)",
                }}>
                  {p.status}
                </div>
              )}

              {/* Edit button — top left, only if handler exists */}
              {onEditProject && (
                <button
                  onClick={e => { e.stopPropagation(); onEditProject(p); }}
                  style={{
                    position: "absolute", top: 12, left: 12,
                    background: "rgba(0,0,0,.55)", border: `1px solid ${C.border}`,
                    backdropFilter: "blur(6px)",
                    color: C.silver, borderRadius: 8,
                    padding: "5px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: ".6rem", fontWeight: 700, fontFamily: "Archivo, sans-serif",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
                  </svg>
                  Edit
                </button>
              )}

              {/* Tap to watch label */}
              {p.coverVideo && (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                  background: "rgba(0,0,0,.45)", color: "#fff",
                  fontSize: ".62rem", fontWeight: 700,
                  padding: "4px 12px", borderRadius: 99, backdropFilter: "blur(4px)",
                  whiteSpace: "nowrap",
                }}>
                  Tap to watch project video
                </div>
              )}
            </div>

            {/* ── Profile Story Picture ── */}
            {p.profilePic && (
              <div style={{ position: "absolute", bottom: -34, left: 18 }}>
                <div
                  onClick={() => p.stories?.length && setStoryOpen(true)}
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    cursor: p.stories?.length ? "pointer" : "default",
                    background: "linear-gradient(135deg,#4f46e5,#f97316,#ec4899)",
                    padding: 3,
                    boxShadow: "0 4px 20px rgba(79,70,229,.45)",
                  }}
                >
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    border: "2.5px solid #f5f7ff", overflow: "hidden",
                  }}>
                    <img
                      src={p.profilePic}
                      alt="project"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>
                {/* Story dot indicator */}
                {p.stories?.length > 0 && (
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    border: "2px solid #f5f7ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="7" height="7" viewBox="0 0 256 256" fill="white">
                      <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/>
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── PROJECT IDENTITY ── */}
          <div style={{ padding: "46px 18px 0" }}>
            {/* Name + Developer */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1e1b4b", lineHeight: 1.2 }}>
                  {p.name}
                </div>
                {p.developer && (
                  <div style={{ fontSize: ".75rem", color: "#4f46e5", fontWeight: 700, marginTop: 2 }}>
                    {p.developer}
                  </div>
                )}
              </div>
              {p.category && (
                <div style={{
                  background: "#ede9fe", color: "#4f46e5",
                  fontSize: ".6rem", fontWeight: 800,
                  padding: "5px 12px", borderRadius: 99, letterSpacing: 0.4,
                  marginTop: 4, whiteSpace: "nowrap",
                }}>
                  {p.category}
                </div>
              )}
            </div>

            {/* Location */}
            {p.location && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                marginTop: 6, color: "#64748b", fontSize: ".76rem", fontWeight: 600,
              }}>
                <svg width="13" height="13" viewBox="0 0 256 256" fill="#4f46e5">
                  <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Zm0-104a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V96A8,8,0,0,0,128,88Zm0-32a12,12,0,1,0,12,12A12,12,0,0,0,128,56Z"/>
                </svg>
                {p.location}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              {/* Project Type */}
              {p.projectType && (
                <div style={{
                  flex: 1, background: "#fff", borderRadius: 14,
                  padding: "12px 10px", textAlign: "center",
                  border: "1px solid #e8eaf6",
                  boxShadow: "0 2px 12px rgba(79,70,229,.06)",
                }}>
                  <div style={{ color: "#7c3aed", display: "flex", justifyContent: "center", marginBottom: 4 }}>
                    {Icons.building}
                  </div>
                  <div style={{ fontSize: ".95rem", fontWeight: 900, color: "#1e1b4b" }}>{p.projectType}</div>
                  <div style={{ fontSize: ".58rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>النوع</div>
                </div>
              )}
              <StatChip icon={Icons.users}     value={p.stats?.leads ?? 0} label="Leads"  color="#10b981" />
              <StatChip icon={Icons.handshake} value={p.stats?.deals ?? 0} label="Deals"  color="#f97316" />
            </div>
          </div>

          {/* ── KEY INFO CARDS ── */}
          <div style={{ padding: "16px 18px 0" }}>
            <div style={{
              background: "#fff", borderRadius: 18, padding: "16px",
              border: "1px solid #e8eaf6",
              boxShadow: "0 4px 20px rgba(79,70,229,.06)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Starting Price", value: p.price,    icon: Icons.currency,     color: "#10b981" },
                  { label: "Unit Size",       value: p.area,     icon: Icons.building,     color: "#4f46e5" },
                  { label: "Delivery",        value: p.delivery, icon: Icons.calendarCheck, color: "#f97316" },
                  { label: "Status",          value: p.status,   icon: Icons.flag,          color: p.statusColor || "#4f46e5" },
                ].filter(item => item.value).map((item, i) => (
                  <div key={i} style={{
                    background: "#f8f9ff", borderRadius: 12, padding: "10px 12px",
                    border: "1px solid #e8eaf6",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <span style={{ fontSize: ".58rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        {item.label}
                      </span>
                    </div>
                    <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          {p.description && (
            <div style={{ padding: "16px 18px 0" }}>
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px",
                border: "1px solid #e8eaf6",
                boxShadow: "0 4px 20px rgba(79,70,229,.06)",
              }}>
                <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b", marginBottom: 8 }}>
                  About This Project
                </div>
                <div style={{ fontSize: ".8rem", color: "#475569", lineHeight: 1.65, fontWeight: 500 }}>
                  {p.description}
                </div>
              </div>
            </div>
          )}

          {/* ── FACILITIES ── */}
          {p.amenities?.length > 0 && (
            <div style={{ padding: "16px 18px 0" }}>
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px",
                border: "1px solid #e8eaf6",
                boxShadow: "0 4px 20px rgba(79,70,229,.06)",
              }}>
                <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b", marginBottom: 10 }}>
                  Facilities
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {p.amenities.map((a, i) => (
                    <div key={i} style={{
                      background: "#ede9fe", color: "#4f46e5",
                      fontSize: ".68rem", fontWeight: 700,
                      padding: "5px 11px", borderRadius: 99,
                    }}>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AVAILABLE UNITS ── */}
          {p.units?.length > 0 && (
            <div style={{ padding: "16px 18px 0" }}>
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px",
                border: "1px solid #e8eaf6",
                boxShadow: "0 4px 20px rgba(79,70,229,.06)",
              }}>
                <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b", marginBottom: 10 }}>
                  Available Units
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.units.map((u, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 12,
                      background: "#f8f9ff", border: "1px solid #e8eaf6",
                    }}>
                      <div>
                        <div style={{ fontSize: ".82rem", fontWeight: 800, color: "#1e1b4b" }}>{u.type}</div>
                        <div style={{ fontSize: ".65rem", color: "#94a3b8", fontWeight: 600, marginTop: 1 }}>{u.size}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#4f46e5" }}>{u.price}</div>
                        <div style={{
                          fontSize: ".6rem", fontWeight: 700, marginTop: 2,
                          color: u.available > 3 ? "#10b981" : "#f97316",
                        }}>
                          {u.available} available
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height: 20 }} />

          {/* ── Modals ── */}
          <StoryViewer
            stories={p.stories || []}
            open={storyOpen && p.stories?.length > 0}
            onClose={() => setStoryOpen(false)}
          />
          <VideoPopup
            src={p.coverVideo}
            open={videoOpen && !!p.coverVideo}
            onClose={() => setVideoOpen(false)}
          />
        </>
      )}

      {/* ── Always visible panels ── */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={() => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))}
      />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
