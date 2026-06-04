// ── ProjectsPage.jsx ─────────────────────────────────────────
// صفحة المشاريع - ONYX CRM
// Features:
//   - Cover video from Google Drive (click to open in popup)
//   - Profile picture as story (click opens Instagram-style story viewer)
//   - Project details below
//   - View only (data added from owner dashboard)

import { useState, useRef, useEffect } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal from "./ProfileModal";
import Icons from "./Icons";

// ─── Sample Data ────────────────────────────────────────────
const SAMPLE_PROJECT = {
  id: 1,
  name: "Nile Heights Tower",
  developer: "Arabella Developments",
  location: "New Cairo — 5th Settlement",
  category: "Residential",
  projectType: "سكني",           // سكني | تجاري | إداري | سكني تجاري | إداري تجاري
  status: "Under Construction",
  statusColor: "#f97316",
  coverVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
  coverThumb: null,
  price: "Starting from 2,500,000 EGP",
  area: "120 – 320 m²",
  delivery: "Q4 2027",
  description:
    "برج نايل هايتس هو مشروع سكني فاخر في قلب القاهرة الجديدة، يضم ٣ أبراج شاهقة بإطلالات بانورامية خلابة. يتميز المشروع بأنظمة المنازل الذكية وأحدث التقنيات العصرية، ويوفر لسكانه تجربة معيشية راقية على مساحات تبدأ من ١٢٠ م² وحتى ٣٢٠ م² بتشطيبات سوبر لوكس.",
  amenities: ["Swimming Pool", "Gym", "Kids Area", "Security 24/7", "Underground Parking", "Rooftop Garden"],
  units: [
    { type: "Studio", size: "60 m²", price: "1.2M EGP", available: 4 },
    { type: "1 Bedroom", size: "90 m²", price: "1.8M EGP", available: 7 },
    { type: "2 Bedrooms", size: "140 m²", price: "2.5M EGP", available: 3 },
    { type: "3 Bedrooms", size: "210 m²", price: "3.9M EGP", available: 2 },
  ],
  stories: [
    "https://picsum.photos/seed/story1/400/700",
    "https://picsum.photos/seed/story2/400/700",
    "https://picsum.photos/seed/story3/400/700",
    "https://picsum.photos/seed/story4/400/700",
  ],
  profilePic: "https://picsum.photos/seed/proj1/200/200",
  agent: { name: "Ahmed Hassan", title: "Senior Broker", phone: "+20 101 234 5678" },
  stats: { leads: 47, deals: 3 },
};

const NOTIFICATIONS = [
  { id: 1, text: "New lead on Nile Heights Tower", time: "2 min ago", color: "#4f46e5", unread: true },
  { id: 2, text: "Meeting scheduled for tomorrow", time: "1 hr ago", color: "#10b981", unread: true },
  { id: 3, text: "Project updated by owner", time: "3 hrs ago", color: "#f97316", unread: false },
];

// ─── Story Viewer ────────────────────────────────────────────
function StoryViewer({ stories, open, onClose }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef  = useRef(null);
  const touchRef  = useRef({ startY: 0, startX: 0 });
  const DURATION  = 4000;

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

  // Swipe up/down → close, swipe left/right → next/prev
  const onTouchStart = (e) => {
    touchRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX };
  };
  const onTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (Math.abs(dy) > 60) onClose(); // swipe up or down → close
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

      {/* Gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 25%, transparent 70%, rgba(0,0,0,.6) 100%)",
      }} />

      {/* Progress bars */}
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

      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: 48, right: 16,
        background: "rgba(0,0,0,.4)", border: "none", color: "#fff",
        borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {Icons.x}
      </button>

      {/* Counter */}
      <div style={{ position: "absolute", top: 62, left: 16, color: "rgba(255,255,255,.8)", fontSize: ".7rem", fontWeight: 700 }}>
        {current + 1} / {stories.length}
      </div>

      {/* Swipe hint */}
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

      {/* Tap zones */}
      <div onClick={goPrev} style={{ position: "absolute", left: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} />
      <div onClick={goNext} style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} />

      {/* Arrows */}
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

// ─── Main Page ───────────────────────────────────────────────
export default function ProjectsPage({ onTabChange, onSignOut }) {
  const [notifOpen, setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs]         = useState(NOTIFICATIONS);
  const [storyOpen, setStoryOpen]   = useState(false);
  const [videoOpen, setVideoOpen]   = useState(false);
  const [activeTab, setActiveTab]   = useState(3); // Projects tab

  const unread = notifs.filter(n => n.unread).length;
  const p = SAMPLE_PROJECT;

  const handleTabChange = (i) => {
    setActiveTab(i);
    onTabChange?.(i);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f7ff",
      fontFamily: "Inter, sans-serif",
      paddingBottom: 100,
    }}>
      {/* Header */}
      <AppHeader
        unreadCount={unread}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ── COVER SECTION ── */}
      <div style={{ position: "relative" }}>

        {/* Cover video thumbnail / click area */}
        <div
          onClick={() => setVideoOpen(true)}
          style={{
            position: "relative", width: "100%", height: 220,
            background: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#7c3aed 100%)",
            cursor: "pointer", overflow: "hidden",
          }}
        >
          {/* Video preview (muted autoplay as cover bg) */}
          <video
            src={p.coverVideo}
            muted
            autoPlay
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
          />

          {/* Play button overlay */}
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

          {/* Status badge */}
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: p.statusColor, color: "#fff",
            fontSize: ".62rem", fontWeight: 800,
            padding: "4px 10px", borderRadius: 99,
            boxShadow: "0 2px 8px rgba(0,0,0,.25)",
          }}>
            {p.status}
          </div>

          {/* Tap to watch label */}
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,.45)", color: "#fff",
            fontSize: ".62rem", fontWeight: 700,
            padding: "4px 12px", borderRadius: 99, backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
          }}>
            Tap to watch project video
          </div>
        </div>

        {/* ── Profile Story Picture ── */}
        <div style={{ position: "absolute", bottom: -34, left: 18 }}>
          {/* Story ring */}
          <div
            onClick={() => setStoryOpen(true)}
            style={{
              width: 72, height: 72, borderRadius: "50%", cursor: "pointer",
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
          {/* "Story" dot */}
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
        </div>
      </div>

      {/* ── PROJECT IDENTITY ── */}
      <div style={{ padding: "46px 18px 0" }}>
        {/* Name + Developer */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1e1b4b", lineHeight: 1.2 }}>
              {p.name}
            </div>
            <div style={{ fontSize: ".75rem", color: "#4f46e5", fontWeight: 700, marginTop: 2 }}>
              {p.developer}
            </div>
          </div>
          <div style={{
            background: "#ede9fe", color: "#4f46e5",
            fontSize: ".6rem", fontWeight: 800,
            padding: "5px 12px", borderRadius: 99, letterSpacing: 0.4,
            marginTop: 4, whiteSpace: "nowrap",
          }}>
            {p.category}
          </div>
        </div>

        {/* Location */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          marginTop: 6, color: "#64748b", fontSize: ".76rem", fontWeight: 600,
        }}>
          <svg width="13" height="13" viewBox="0 0 256 256" fill="#4f46e5">
            <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Zm0-104a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V96A8,8,0,0,0,128,88Zm0-32a12,12,0,1,0,12,12A12,12,0,0,0,128,56Z"/>
          </svg>
          {p.location}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {/* Project Type */}
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
          <StatChip icon={Icons.users} value={p.stats.leads} label="Leads" color="#10b981" />
          <StatChip icon={Icons.handshake} value={p.stats.deals} label="Deals" color="#f97316" />
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
              { label: "Starting Price", value: p.price, icon: Icons.currency, color: "#10b981" },
              { label: "Unit Size", value: p.area, icon: Icons.building, color: "#4f46e5" },
              { label: "Delivery", value: p.delivery, icon: Icons.calendarCheck, color: "#f97316" },
              { label: "Status", value: p.status, icon: Icons.flag, color: p.statusColor },
            ].map((item, i) => (
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

      {/* ── FACILITIES ── */}
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

      {/* ── AVAILABLE UNITS ── */}
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

      {/* Bottom padding */}
      <div style={{ height: 20 }} />

      {/* ── Modals & Panels ── */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={() => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))}
      />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />
      <StoryViewer stories={p.stories} open={storyOpen} onClose={() => setStoryOpen(false)} />
      <VideoPopup src={p.coverVideo} open={videoOpen} onClose={() => setVideoOpen(false)} />

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
