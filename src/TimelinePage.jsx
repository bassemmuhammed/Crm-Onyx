// ── TimelinePage.jsx — ONYX Design System ────────────────────
import { useState, useRef } from "react";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import Icons             from "./Icons";

// ─── ONYX Tokens — matched to AdminHomePage reference ────────
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
  redLight: "#FF2020",
  blue:     "#253FF6",
  green:    "#10b981",
  orange:   "#f97316",
  amber:    "#f59e0b",
  cardGrad1: "linear-gradient(145deg,#1A1A1E 0%,#141416 100%)",
  cardGrad2: "linear-gradient(145deg,#1C1C22 0%,#141418 100%)",
};

// ─── Global Styles ────────────────────────────────────────────
const NoSelect = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700;800;900&display=swap');
  * { -webkit-user-select: none !important; user-select: none !important; font-family: 'Archivo', sans-serif !important; }
  html, body { margin:0; padding:0; background:#0D0D0D; }
  *, *::before, *::after { -webkit-tap-highlight-color:transparent; box-sizing:border-box; color-scheme:dark; }
  @keyframes fadeInUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInLeft{ from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  .onyx-card { animation: fadeInUp .35s ease both; }
  .tap-scale:active { transform:scale(.96); transition:transform .1s ease; }
  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
`}</style>;

// ─── Mock Data ────────────────────────────────────────────────
const LAUNCHES = [
  {
    id: 1,
    project: "AMG — R7",
    developer: "AVA MINA Group",
    logoUrl: null,
    location: "R7 — New Capital",
    date: "2026-06-15",
    time: "11:00 AM",
    tag: "Grand Launch",
    projectArea: "50 Faddan",
    projectType: "Residential Compound",
    units: [
      { type: "Studio",     area: "65 m²",  price: "3,200,000 EGP" },
      { type: "1 Bedroom",  area: "95 m²",  price: "4,850,000 EGP" },
      { type: "2 Bedrooms", area: "145 m²", price: "7,400,000 EGP" },
      { type: "3 Bedrooms", area: "210 m²", price: "9,076,200 EGP" },
    ],
    downPayment: "10%",
    installment: "7 Years — Quarterly",
    cashDiscount: "40%",
  },
  {
    id: 2,
    project: "Nile Gate — Phase 2",
    developer: "Ora Developers",
    logoUrl: null,
    location: "New Cairo — 5th Settlement",
    date: "2026-06-22",
    time: "2:00 PM",
    tag: "Phase Launch",
    projectArea: "35 Faddan",
    projectType: "Mixed Use — Residential & Commercial",
    units: [
      { type: "1 Bedroom",  area: "90 m²",  price: "3,420,000 EGP" },
      { type: "2 Bedrooms", area: "135 m²", price: "5,130,000 EGP" },
      { type: "3 Bedrooms", area: "190 m²", price: "7,220,000 EGP" },
    ],
    downPayment: "15%",
    installment: "8 Years — Quarterly",
    cashDiscount: "25%",
  },
  {
    id: 3,
    project: "Sky Residence",
    developer: "Emaar Misr",
    logoUrl: null,
    location: "New Capital — R3",
    date: "2026-07-01",
    time: "10:00 AM",
    tag: "Soft Launch",
    projectArea: "70 Faddan",
    projectType: "Luxury Residential Compound",
    units: [
      { type: "1 Bedroom",  area: "100 m²", price: "5,500,000 EGP" },
      { type: "2 Bedrooms", area: "155 m²", price: "8,525,000 EGP" },
      { type: "3 Bedrooms", area: "220 m²", price: "12,100,000 EGP" },
      { type: "Penthouse",  area: "340 m²", price: "21,000,000 EGP" },
    ],
    downPayment: "20%",
    installment: "10 Years — Semi-Annual",
    cashDiscount: "30%",
  },
];

const POSTS = [
  {
    id: 1,
    project: "AMG — R7",
    postedAt: "Today, 10:30 AM",
    type: "unit_offer",
    typeLabel: "Unit Offer",
    content: `وصلنا في AMG ل 80% إنشاءات 💪🧘\nهات عميلك وتعالي يعاين على أرض الوقع 🏃‍♂️🔥 في أميز لوكيشن في الـ R7 🔥🤩\n\nتعالي امتلك وحدتك في أميز وأرقي مكان في الـ R7 دابل فيو على حي السفارات وحي المستثمرين من AVA MINA Group (AMG)\n\n*8C_ A32 (210)*\nدايركت على النادي`,
    details: [
      { label: "سعر قبل الخصم",  value: "9,076,200 ج" },
      { label: "خصم 10%",         value: "8,168,580 ج" },
      { label: "مقدم 10%",        value: "816,858 ج"   },
      { label: "قسط كل 3 شهور",   value: "247,974 ج"   },
      { label: "مدة التقسيط",      value: "7 سنوات"     },
      { label: "خصم كاش 40%",     value: "5,445,720 ج" },
      { label: "وديعة صيانة 8%",  value: "مشمولة"      },
      { label: "النادي",           value: "100,000 ج"   },
    ],
  },
  {
    id: 2,
    project: "Nile Gate",
    postedAt: "Yesterday, 3:15 PM",
    type: "promo",
    typeLabel: "Promotion",
    content: `🏙️ Nile Gate Phase 2 — فرصة محدودة!\nوحدات تاور B متاحة بأسعار ما قبل الإطلاق 🔥\n\nمتشيلوش الفرصة دي — الأسعار هتتغير بعد الـ Launch رسمياً يوم 22 يونيو`,
    details: [
      { label: "سعر المتر", value: "38,000 ج" },
      { label: "مقدم",      value: "15%"       },
      { label: "تقسيط",     value: "8 سنوات"  },
    ],
  },
];

// ─── Developer Avatar ─────────────────────────────────────────
function DevAvatar({ name, logoUrl }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width:          42,
      height:         42,
      borderRadius:   11,
      background:     logoUrl ? "transparent" : C.cardAlt,
      border:         `1px solid ${C.border}`,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      flexShrink:     0,
      overflow:       "hidden",
    }}>
      {logoUrl
        ? <img src={logoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: ".65rem", fontWeight: 900, color: C.silver }}>{initials}</span>
      }
    </div>
  );
}

// ─── Launch Card ──────────────────────────────────────────────
function LaunchCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = Math.ceil((new Date(item.date) - new Date()) / (1000 * 60 * 60 * 24));
  const urgent   = daysLeft <= 7;

  return (
    <div
      className="onyx-card"
      style={{
        background:    C.cardGrad1,
        borderRadius:  16,
        overflow:      "hidden",
        border:        `1px solid ${C.border}`,
        position:      "relative",
        animationDelay:`${index * 80}ms`,
        boxShadow:     "0 4px 20px rgba(0,0,0,.45)",
      }}
    >
      {/* Left accent bar — thick top, fades down */}
      <div style={{
        position:     "absolute",
        top:          0,
        left:         0,
        bottom:       0,
        width:        3,
        background:   `linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.06) 100%)`,
        borderRadius: "16px 0 0 16px",
      }} />

      <div style={{ padding: "14px 14px 12px", paddingLeft: 18 }}>

        {/* Header: Avatar | Name+Dev | red dot · Tag · Days */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <DevAvatar name={item.developer} logoUrl={item.logoUrl} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: ".9rem", fontWeight: 900, color: C.white, lineHeight: 1.2 }}>{item.project}</div>
            <div style={{ fontSize: ".62rem", color: C.gray, fontWeight: 600, marginTop: 2 }}>{item.developer}</div>
          </div>

          {/* Red dot + Tag text + Days badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
            <span style={{ fontSize: ".58rem", fontWeight: 700, color: C.gray }}>{item.tag}</span>
            <div style={{
              background:   urgent ? `${C.red}22` : C.cardAlt,
              color:        urgent ? C.red : C.silver,
              fontSize:     ".58rem",
              fontWeight:   800,
              padding:      "3px 8px",
              borderRadius: 99,
              border:       `1px solid ${urgent ? C.red + "55" : C.border}`,
              whiteSpace:   "nowrap",
            }}>
              {daysLeft <= 0 ? "Today!" : `${daysLeft}d`}
            </div>
          </div>
        </div>

        {/* Location + Date — same row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <div style={{
            background:   C.cardAlt,
            color:        C.silver,
            fontSize:     ".58rem",
            fontWeight:   600,
            padding:      "4px 10px",
            borderRadius: 6,
            border:       `1px solid ${C.border}`,
            display:      "flex",
            alignItems:   "center",
            gap:          5,
          }}>
            <span style={{ color: C.gray, display: "flex", alignItems: "center" }}>{Icons.house}</span>
            {item.location}
          </div>
          <div style={{
            background:   C.cardAlt,
            color:        C.silver,
            fontSize:     ".58rem",
            fontWeight:   600,
            padding:      "4px 10px",
            borderRadius: 6,
            border:       `1px solid ${C.border}`,
            display:      "flex",
            alignItems:   "center",
            gap:          5,
          }}>
            <span style={{ color: C.gray, display: "flex", alignItems: "center" }}>{Icons.calendar}</span>
            {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {item.time}
          </div>
        </div>

        {/* Quick info — centered */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Project Area", value: item.projectArea },
            { label: "Type",         value: item.projectType },
          ].map((d, i) => (
            <div key={i} style={{
              flex:         1,
              background:   C.cardAlt,
              borderRadius: 10,
              padding:      "8px 10px",
              border:       `1px solid ${C.border}`,
              textAlign:    "center",
            }}>
              <div style={{ fontSize: ".5rem", color: C.gray, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: .4 }}>{d.label}</div>
              <div style={{ fontSize: ".72rem", color: C.white, fontWeight: 700 }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Down Payment / Installment / Cash — centered, no "Booking" label */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[
            { label: "Down Payment",  value: item.downPayment,  color: C.blue  },
            { label: "Installment",   value: item.installment,  color: C.green },
            { label: "Cash Discount", value: item.cashDiscount, color: C.amber },
          ].map((d, i) => (
            <div key={i} style={{
              flex:         1,
              background:   C.cardAlt,
              borderRadius: 10,
              padding:      "8px 6px",
              border:       `1px solid ${C.border}`,
              textAlign:    "center",
            }}>
              <div style={{ fontSize: ".44rem", color: d.color, fontWeight: 800, marginBottom: 3, textTransform: "uppercase", letterSpacing: .3 }}>{d.label}</div>
              <div style={{ fontSize: ".68rem", color: C.white, fontWeight: 800 }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Units toggle */}
        <div
          onClick={() => setExpanded(e => !e)}
          className="tap-scale"
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            cursor:         "pointer",
            padding:        "8px 0",
            borderTop:      `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontSize: ".65rem", fontWeight: 700, color: C.white }}>Unit Sizes & Prices</span>
          <span style={{ fontSize: ".6rem", color: C.gray, fontWeight: 700 }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
        </div>

        {/* Units table */}
        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "0 4px" }}>
              {["Type", "Area", "Price"].map(h => (
                <div key={h} style={{ fontSize: ".52rem", color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4, textAlign: "center" }}>{h}</div>
              ))}
            </div>
            {item.units.map((u, i) => (
              <div key={i} style={{
                display:             "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap:                 4,
                background:          i % 2 === 0 ? C.cardAlt : C.card,
                padding:             "8px 10px",
                borderRadius:        10,
                border:              `1px solid ${C.border}`,
                textAlign:           "center",
              }}>
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: C.white }}>{u.type}</div>
                <div style={{ fontSize: ".7rem", fontWeight: 600, color: C.silver }}>{u.area}</div>
                <div style={{ fontSize: ".68rem", fontWeight: 800, color: C.white }}>{u.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────
function PostCard({ post, index }) {
  const [expanded, setExpanded] = useState(false);
  const initials = post.project.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="onyx-card"
      style={{
        background:    C.cardGrad1,
        borderRadius:  16,
        overflow:      "hidden",
        border:        `1px solid ${C.border}`,
        position:      "relative",
        animationDelay:`${index * 80}ms`,
        boxShadow:     "0 4px 20px rgba(0,0,0,.45)",
      }}
    >
      {/* Left accent bar only */}
      <div style={{
        position:     "absolute",
        top:          0,
        left:         0,
        bottom:       0,
        width:        3,
        background:   `linear-gradient(180deg, ${C.red} 0%, rgba(204,21,21,0.06) 100%)`,
        borderRadius: "16px 0 0 16px",
      }} />

      <div style={{ padding: "14px", paddingLeft: 18 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width:          38,
              height:         38,
              borderRadius:   10,
              background:     C.cardAlt,
              border:         `1px solid ${C.border}`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       ".65rem",
              fontWeight:     900,
              color:          C.silver,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: ".82rem", fontWeight: 800, color: C.white }}>{post.project}</div>
              <div style={{ fontSize: ".6rem", color: C.gray }}>{post.postedAt}</div>
            </div>
          </div>

          {/* Type label — plain gray, no background */}
          <span style={{ fontSize: ".58rem", fontWeight: 700, color: C.gray, letterSpacing: ".3px" }}>
            {post.typeLabel}
          </span>
        </div>

        {/* Post content */}
        <div style={{
          background:   C.cardAlt,
          borderRadius: 12,
          padding:      "12px 14px",
          marginBottom: 10,
          fontSize:     ".78rem",
          color:        C.white,
          lineHeight:   1.7,
          whiteSpace:   "pre-line",
          maxHeight:    expanded ? "none" : 80,
          overflow:     "hidden",
          position:     "relative",
          border:       `1px solid ${C.border}`,
        }}>
          {post.content}
          {!expanded && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: `linear-gradient(transparent, ${C.cardAlt})` }} />
          )}
        </div>

        {/* Expand toggle */}
        <div
          onClick={() => setExpanded(e => !e)}
          className="tap-scale"
          style={{ fontSize: ".63rem", color: C.white, fontWeight: 700, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}
        >
          {expanded ? "Show Less ▲" : "Show More ▼"}
        </div>

        {/* Details grid */}
        {expanded && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {post.details.map((d, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: 10, padding: "8px 10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: ".55rem", color: C.gray, fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: .4 }}>{d.label}</div>
                <div style={{ fontSize: ".75rem", color: C.white, fontWeight: 800 }}>{d.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Swipeable Tab Container ──────────────────────────────────
function SwipeableTabs({ tabs, activeIndex, onSwipe, children }) {
  const startX   = useRef(null);
  const startY   = useRef(null);
  const dragging = useRef(false);

  const onTouchStart = (e) => {
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    dragging.current = true;
  };

  const onTouchEnd = (e) => {
    if (!dragging.current || startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
    dragging.current = false;
    if (Math.abs(dx) < 50 || dy > Math.abs(dx)) return;
    if (dx < 0 && activeIndex < tabs.length - 1) onSwipe(activeIndex + 1);
    if (dx > 0 && activeIndex > 0)               onSwipe(activeIndex - 1);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ flex: 1 }}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
const TABS = [
  { key: "launches", label: "Launches", icon: "building", data: LAUNCHES },
  { key: "posts",    label: "Posts",    icon: "send",     data: POSTS    },
];

export default function TimelinePage({ activeTab = 2, onTabChange, onSignOut }) {
  const [tabIndex,    setTabIndex]    = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState([
    { id: 1, text: "Launch جديد: AMG R7 — 15 يونيو", time: "منذ ساعة", color: C.blue,  unread: true  },
    { id: 2, text: "بوست جديد من المانجر على Nile Gate", time: "أمس",  color: C.green, unread: false },
  ]);

  const unread = notifs.filter(n => n.unread).length;

  return (
    <div style={{ fontFamily: "Archivo,sans-serif", background: C.surface, minHeight: "100vh", color: C.white, width: "100%", display: "flex", flexDirection: "column" }}>
      <NoSelect />

      <ProfileModal      open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />
      <NotificationPanel open={notifOpen}   onClose={() => setNotifOpen(false)}   notifs={notifs} onMarkAll={() => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))} />

      {/* App-level red top line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,${C.red} 0%,${C.redLight} 40%,transparent 100%)`, position: "sticky", top: 0, zIndex: 100 }} />

      <AppHeader unreadCount={unread} onBellClick={() => setNotifOpen(true)} onProfileClick={() => setProfileOpen(true)} />

      {/* Section header */}
      <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 18, background: C.red, borderRadius: 99 }} />
        <span style={{ fontSize: ".72rem", fontWeight: 900, color: C.white, textTransform: "uppercase", letterSpacing: "2px" }}>
          Timeline
        </span>
      </div>

      {/* Tab indicators — icon + label, no emoji, no colored bg */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 6, alignItems: "center" }}>
        {TABS.map((t, i) => {
          const active = i === tabIndex;
          return (
            <div
              key={t.key}
              onClick={() => setTabIndex(i)}
              className="tap-scale"
              style={{
                padding:      "6px 14px",
                borderRadius: 8,
                border:       `1px solid ${active ? C.red + "66" : C.border}`,
                cursor:       "pointer",
                fontSize:     ".72rem",
                fontWeight:   700,
                background:   active ? `${C.red}18` : C.cardAlt,
                color:        active ? C.white : C.gray,
                display:      "flex",
                alignItems:   "center",
                gap:          6,
                transition:   "all .2s ease",
              }}
            >
              {/* Lucide icon via Icons map */}
              <span style={{
                display:    "flex",
                alignItems: "center",
                color:      active ? C.red : C.gray,
                transition: "color .2s ease",
              }}>
                {Icons[t.icon]}
              </span>
              {t.label}
              <span style={{
                background:   active ? C.red : C.border,
                color:        active ? C.white : C.gray,
                fontSize:     ".55rem",
                fontWeight:   800,
                padding:      "1px 7px",
                borderRadius: 99,
              }}>
                {t.data.length}
              </span>
            </div>
          );
        })}
        <span style={{ fontSize: ".52rem", color: C.gray, marginLeft: "auto", fontWeight: 600, letterSpacing: ".5px" }}>
          ← swipe →
        </span>
      </div>

      {/* Swipeable content */}
      <SwipeableTabs tabs={TABS} activeIndex={tabIndex} onSwipe={setTabIndex}>
        <div style={{ padding: "12px 16px 110px", display: "flex", flexDirection: "column", gap: 10 }}>
          {tabIndex === 0 && LAUNCHES.map((item, i) => (
            <LaunchCard key={item.id} item={item} index={i} />
          ))}
          {tabIndex === 1 && POSTS.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </SwipeableTabs>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
