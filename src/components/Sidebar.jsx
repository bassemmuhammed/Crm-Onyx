// ── components/Sidebar.jsx ──────────────────────────────────────────
// Sidebar احترافي بـ lucide-react icons (مطابقة dark theme: أحمر/أسود)
//
// الميزات:
//   - ثابت (fixed) في الشاشات الكبيرة (Desktop ≥ 1024px)
//   - hamburger menu في الشاشات الصغيرة (Mobile/Tablet < 1024px)
//   - active state بصري واضح
//   - role-based: إخفاء روابط Inventory/Commission للمستخدمين بدون صلاحية
//   - يحتوي على: Home, Leads, Add Project, Settings, Inventory, Commission
//
// الـ props:
//   items: [{ key, label, icon: <LucideIcon/>, onClick, badge? }]
//   activeKey: المفتاح النشط حالياً
//   onItemClick: callback عند الضغط على أي عنصر
//   currentUser: لعرض الـ avatar والاسم في أسفل الـ sidebar
//   onBellClick, onProfileClick: للإشعارات والبروفايل
//   unreadCount: عدد الإشعارات غير المقروءة
//   avatarUrl: رابط صورة البروفايل
//   logo: عنصر الـ logo

import { useState, useEffect } from "react";
import { Menu, X, Bell } from "lucide-react";

const C = {
  black:    "#000",
  surface:  "#0a0a0a",
  card:     "#111",
  cardAlt:  "#1a1a1a",
  border:   "#2a2a2e",
  gray:     "#6b6c73",
  silver:   "#cecece",
  white:    "#fff",
  red:      "#cc1515",
  redLight: "#ff2020",
  blue:     "#253ff6",
  green:    "#10b981",
};

const SIDEBAR_WIDTH = 240; // px
const MOBILE_BREAKPOINT = 1024; // px

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

  // تتبع حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // أغلق الـ mobile menu عند الانتقال لـ desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // أغلق الـ mobile menu عند الضغط خارجها
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
    setMobileOpen(false); // أغلق الـ mobile menu بعد الاختيار
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
        background: C.card,
        border: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,.4)",
      }}
    >
      <Menu size={20} color={C.silver} />
    </div>
  );

  // ── Mobile: Top bar (يظهر فقط في الموبايل لأن الـ sidebar مخفي) ──
  const MobileTopBar = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 62,
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      display: isMobile ? "flex" : "none",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px 0 70px", // مساحة للـ hamburger على اليسار
      zIndex: 90,
    }}>
      {/* Logo في المنتصف */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {logo}
      </div>

      {/* Actions على اليمين: bell + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onBellClick}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: C.card, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}
        >
          <Bell size={16} color={C.silver} />
          {unreadCount > 0 && (
            <div style={{
              position: "absolute",
              top: -2, right: -2,
              minWidth: 16, height: 16, padding: "0 4px",
              borderRadius: 8,
              background: C.red,
              color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.surface}`,
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>

        <button
          onClick={onProfileClick}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : C.card,
            border: `2px solid ${C.border}`,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {!avatarUrl && (
            <span style={{ color: C.silver, fontSize: 14, fontWeight: 700 }}>
              {(currentUser?.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // ── Sidebar Content (مشترك بين desktop و mobile) ──
  const SidebarContent = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
    }}>
      {/* ── Logo Header ── */}
      <div style={{
        padding: "20px 18px 18px",
        borderBottom: `1px solid ${C.border}`,
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
              background: C.cardAlt, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.gray,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Navigation Items ── */}
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
                  ? `linear-gradient(135deg, ${C.red}22 0%, ${C.red}11 100%)`
                  : "transparent",
                color: isActive ? C.white : C.silver,
                fontSize: ".82rem",
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'Archivo', sans-serif",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                position: "relative",
                transition: "all 0.18s ease",
                borderLeft: isActive ? `3px solid ${C.red}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${C.cardAlt}`;
                  e.currentTarget.style.color = C.white;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.silver;
                }
              }}
            >
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                color: isActive ? C.red : "inherit",
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 9,
                  background: isActive ? C.red : C.cardAlt,
                  color: isActive ? "#fff" : C.silver,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile (في أسفل الـ sidebar) ── */}
      <div style={{
        padding: "14px 12px",
        borderTop: `1px solid ${C.border}`,
      }}>
        <button
          onClick={onProfileClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.cardAlt; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : C.card,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}>
            {!avatarUrl && (
              <span style={{ color: C.silver, fontSize: 13, fontWeight: 700 }}>
                {(currentUser?.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: ".75rem", fontWeight: 700, color: C.white,
              fontFamily: "'Archivo', sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {currentUser?.name || "User"}
            </div>
            <div style={{
              fontSize: ".6rem", color: C.gray,
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

        {/* Hamburger button */}
        <HamburgerButton />

        {/* Top bar مع logo + bell + avatar */}
        <MobileTopBar />

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,.7)",
                backdropFilter: "blur(4px)",
                zIndex: 200,
                animation: "onyxSidebarFadeIn 0.2s ease-out",
              }}
            />
            {/* Sidebar */}
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

  // Desktop: fixed sidebar
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

// export العرض الثابت للـ sidebar (يستخدم في حساب مساحة المحتوى)
export { SIDEBAR_WIDTH, MOBILE_BREAKPOINT };
