// ── components/Sidebar.jsx ──────────────────────────────────────────
// Sidebar — Dark Theme (مطابقة الموك أب)
// خلفية #12151C، active state بشريط أحمر 3px، خطوط Space Grotesk + Inter + JetBrains Mono

import { useState, useEffect } from "react";
import { Menu, X, Bell } from "lucide-react";

const C = {
  bgElevated:    "#12151C",
  surface:       "#171B24",
  surfaceHover:  "#1D2230",
  borderSoft:    "#1B1F2A",
  border:        "#242938",
  textPrimary:   "#F2F3F7",
  textSecondary: "#8B93A7",
  textTertiary:  "#5B6478",
  accent:        "#E23A4E",
  accentHover:   "#FF4C5E",
  accentDim:     "rgba(226,58,78,0.12)",
};

const F = {
  display: "'Space Grotesk', sans-serif",
  body:    "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const SIDEBAR_WIDTH = 264;
const MOBILE_BREAKPOINT = 1024;

export default function Sidebar({
  items = [],
  activeKey,
  onItemClick,
  currentUser,
  onBellClick,
  onProfileClick,
  unreadCount = 0,
  avatarUrl,
  logo,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById("onyx-sidebar");
      const hamburger = document.getElementById("onyx-sidebar-hamburger");
      if (sidebar && !sidebar.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, mobileOpen]);

  const handleItemClick = (item) => {
    if (onItemClick) onItemClick(item);
    setMobileOpen(false);
  };

  // ── Hamburger ──
  const HamburgerButton = () => (
    <div
      id="onyx-sidebar-hamburger"
      onClick={() => setMobileOpen(true)}
      style={{
        position: "fixed", top: 12, left: 12,
        width: 42, height: 42, borderRadius: 10,
        background: C.surface, border: `1px solid ${C.borderSoft}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", zIndex: 100,
      }}
    >
      <Menu size={20} color={C.textSecondary} />
    </div>
  );

  // ── Mobile Top Bar ──
  const MobileTopBar = () => (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 62,
      background: C.bgElevated, borderBottom: `1px solid ${C.borderSoft}`,
      display: isMobile ? "flex" : "none",
      alignItems: "center", justifyContent: "space-between",
      padding: "0 12px 0 70px", zIndex: 90,
    }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{logo}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBellClick} style={{
          width: 38, height: 38, borderRadius: 10,
          background: C.surface, border: `1px solid ${C.borderSoft}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
        }}>
          <Bell size={16} color={C.textSecondary} />
          {unreadCount > 0 && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              minWidth: 18, height: 18, padding: "0 4px", borderRadius: 20,
              background: C.accent, color: "#fff",
              fontFamily: F.mono, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.bgElevated}`,
            }}>{unreadCount > 99 ? "99+" : unreadCount}</div>
          )}
        </button>
        <button onClick={onProfileClick} style={{
          width: 38, height: 38, borderRadius: 10,
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : "linear-gradient(135deg, #9B7CFF, #5B3FBF)",
          border: `1px solid ${C.borderSoft}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", fontFamily: F.display, fontWeight: 600, fontSize: 14, color: "#fff",
        }}>
          {!avatarUrl && (currentUser?.name || "?").charAt(0).toUpperCase()}
        </button>
      </div>
    </div>
  );

  // ── Sidebar Content ──
  const SidebarContent = () => (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: C.bgElevated, borderRight: `1px solid ${C.borderSoft}`,
      padding: "28px 18px",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 28px 8px" }}>
        {logo}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Group label */}
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: C.textTertiary,
          padding: "14px 12px 8px", fontFamily: F.body,
        }}>Workspace</div>

        {items.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10, border: "none",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accentHover : C.textSecondary,
                fontSize: 14.5, fontWeight: 500,
                fontFamily: F.body, cursor: "pointer", textAlign: "left",
                width: "100%", position: "relative",
                transition: "background .15s ease, color .15s ease",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.color = C.textPrimary; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; } }}
            >
              {/* Active left border */}
              {isActive && (
                <div style={{
                  position: "absolute", left: -18, top: 8, bottom: 8,
                  width: 3, borderRadius: "0 4px 4px 0", background: C.accent,
                }} />
              )}
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  fontFamily: F.mono, fontSize: 11, fontWeight: 600,
                  background: C.surfaceHover, color: C.textSecondary,
                  padding: "2px 7px", borderRadius: 20,
                }}>{item.badge > 99 ? "99+" : item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Card */}
      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.borderSoft}` }}>
        <button
          onClick={onProfileClick}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: 8, borderRadius: 10, border: "none",
            background: "transparent", cursor: "pointer", width: "100%", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : "linear-gradient(135deg, #9B7CFF, #5B3FBF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.display, fontWeight: 600, fontSize: 14, color: "#fff",
            flexShrink: 0, overflow: "hidden",
          }}>
            {!avatarUrl && (currentUser?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13.5, fontWeight: 600, color: C.textPrimary,
              fontFamily: F.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{currentUser?.name || "User"}</div>
            <div style={{
              fontSize: 11.5, color: C.textTertiary,
              fontFamily: F.body, textTransform: "capitalize",
            }}>{currentUser?.role || "sales"}</div>
          </div>
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  if (isMobile) {
    return (
      <>
        <style>{`
          @keyframes onyxSidebarSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          @keyframes onyxSidebarFadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        <HamburgerButton />
        <MobileTopBar />
        {mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)} style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
              zIndex: 200, animation: "onyxSidebarFadeIn 0.2s ease-out",
            }} />
            <div id="onyx-sidebar" style={{
              position: "fixed", top: 0, left: 0, bottom: 0,
              width: SIDEBAR_WIDTH, zIndex: 201,
              animation: "onyxSidebarSlideIn 0.25s ease-out",
            }}>
              <SidebarContent />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div id="onyx-sidebar" style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: SIDEBAR_WIDTH, zIndex: 50,
    }}>
      <SidebarContent />
    </div>
  );
}

export { SIDEBAR_WIDTH, MOBILE_BREAKPOINT };
