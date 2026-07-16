// ── components/Sidebar.jsx ──────────────────────────────────────────
// Sidebar احترافي — Light Theme (مطابقة نظام ألوان ONYX CRM الجديد)
//
// الميزات:
//   - ثابت (fixed) في الشاشات الكبيرة (Desktop ≥ 1024px)
//   - hamburger menu في الشاشات الصغيرة (Mobile/Tablet < 1024px)
//   - active state بصري واضح (border-left أحمر 3px + خلفية حمراء فاتحة)
//   - role-based: إخفاء روابط Inventory للمستخدمين بدون صلاحية
//   - Light theme: خلفية بيضاء، نص رمادي، hover خفيف

import { useState, useEffect } from "react";
import { Menu, X, Bell } from "lucide-react";
import {
  bg as backgrounds,
  border as borders,
  text,
  primary,
  shadow as shadows,
  layout,
} from "../theme";

const SIDEBAR_WIDTH = layout.sidebarWidth;
const MOBILE_BREAKPOINT = layout.mobileBreakpoint;

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

  // ── Mobile: Hamburger button ──
  const HamburgerButton = () => (
    <div
      id="onyx-sidebar-hamburger"
      onClick={() => setMobileOpen(true)}
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        width: 42,
        height: 42,
        borderRadius: 12,
        background: backgrounds.card,
        border: `1px solid ${borders.card}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 100,
        boxShadow: shadows.sm,
      }}
    >
      <Menu size={20} color={text.secondary} />
    </div>
  );

  // ── Mobile: Top bar ──
  const MobileTopBar = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 62,
      background: backgrounds.header,
      borderBottom: `1px solid ${borders.card}`,
      display: isMobile ? "flex" : "none",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px 0 70px",
      zIndex: 90,
      boxShadow: shadows.sm,
    }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {logo}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onBellClick}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: backgrounds.card,
            border: `1px solid ${borders.card}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}
        >
          <Bell size={16} color={text.secondary} />
          {unreadCount > 0 && (
            <div style={{
              position: "absolute",
              top: -2, right: -2,
              minWidth: 16, height: 16, padding: "0 4px",
              borderRadius: 8,
              background: primary.main,
              color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${backgrounds.header}`,
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>

        <button
          onClick={onProfileClick}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : backgrounds.hover,
            border: `2px solid ${borders.card}`,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {!avatarUrl && (
            <span style={{ color: text.secondary, fontSize: 14, fontWeight: 700 }}>
              {(currentUser?.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // ── Sidebar Content ──
  const SidebarContent = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: backgrounds.sidebar,
      borderRight: `1px solid ${borders.sidebar}`,
    }}>
      {/* Logo Header */}
      <div style={{
        padding: "20px 18px 18px",
        borderBottom: `1px solid ${borders.divider}`,
        display: "flex",
        alignItems: "center",
        justifyContent: isMobile ? "space-between" : "center",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {logo}
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: backgrounds.hover, border: `1px solid ${borders.card}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: text.secondary,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{
        flex: 1,
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
      }}>
        {items.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 10,
                border: "none",
                background: isActive
                  ? primary.light
                  : "transparent",
                color: isActive ? primary.main : text.secondary,
                fontSize: ".82rem",
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'Archivo', sans-serif",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                position: "relative",
                transition: "all 0.18s ease",
                // ✅ border-left أحمر 3px للعنصر النشط (مطابق المطلوب)
                borderLeft: isActive ? `3px solid ${primary.main}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = backgrounds.cardAlt;
                  e.currentTarget.style.color = text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = text.secondary;
                }
              }}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22, height: 22,
                color: isActive ? primary.main : "inherit",
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: "0 5px",
                  borderRadius: 9,
                  background: isActive ? primary.main : backgrounds.hover,
                  color: isActive ? "#fff" : text.secondary,
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div style={{
        padding: "14px 12px",
        borderTop: `1px solid ${borders.divider}`,
      }}>
        <button
          onClick={onProfileClick}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 10, border: "none",
            background: "transparent", cursor: "pointer", width: "100%", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = backgrounds.cardAlt; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : backgrounds.hover,
            border: `1px solid ${borders.card}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}>
            {!avatarUrl && (
              <span style={{ color: text.secondary, fontSize: 13, fontWeight: 700 }}>
                {(currentUser?.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: ".75rem", fontWeight: 700, color: text.primary,
              fontFamily: "'Archivo', sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {currentUser?.name || "User"}
            </div>
            <div style={{
              fontSize: ".6rem", color: text.secondary,
              fontFamily: "'Archivo', sans-serif",
              textTransform: "capitalize",
            }}>
              {currentUser?.role || "sales"}
            </div>
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
          @keyframes onyxSidebarSlideIn {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
          @keyframes onyxSidebarFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>

        <HamburgerButton />
        <MobileTopBar />

        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,.5)",
                backdropFilter: "blur(4px)",
                zIndex: 200,
                animation: "onyxSidebarFadeIn 0.2s ease-out",
              }}
            />
            <div
              id="onyx-sidebar"
              style={{
                position: "fixed",
                top: 0, left: 0, bottom: 0,
                width: SIDEBAR_WIDTH,
                zIndex: 201,
                animation: "onyxSidebarSlideIn 0.25s ease-out",
              }}
            >
              <SidebarContent />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div
      id="onyx-sidebar"
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 50,
      }}
    >
      <SidebarContent />
    </div>
  );
}

export { SIDEBAR_WIDTH, MOBILE_BREAKPOINT };
