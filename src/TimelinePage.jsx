import { useState } from "react";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import Icons             from "./Icons";

// ── Mock Data ─────────────────────────────────────────────

const LAUNCHES = [
  {
    id: 1,
    project: "AMG — R7",
    developer: "AVA MINA Group",
    location: "R7 — New Capital",
    date: "2026-06-15",
    time: "11:00 AM",
    tag: "Grand Launch",
    tagColor: "#4f46e5",
    tagBg: "#ede9fe",
    progress: 80,
    progressLabel: "80% Construction",
    badge: "🔥",
    projectArea: "50 Acres",
    projectType: "Residential Compound",
    units: [
      { type: "Studio",     area: "65 m²",  price: "3,200,000 EGP" },
      { type: "1 Bedroom",  area: "95 m²",  price: "4,850,000 EGP" },
      { type: "2 Bedrooms", area: "145 m²", price: "7,400,000 EGP" },
      { type: "3 Bedrooms", area: "210 m²", price: "9,076,200 EGP" },
    ],
    booking: "10% Down Payment",
    installment: "7 Years — Quarterly",
    cashDiscount: "40%",
  },
  {
    id: 2,
    project: "Nile Gate — Phase 2",
    developer: "Ora Developers",
    location: "New Cairo — 5th Settlement",
    date: "2026-06-22",
    time: "2:00 PM",
    tag: "Phase Launch",
    tagColor: "#10b981",
    tagBg: "#d1fae5",
    progress: 45,
    progressLabel: "45% Construction",
    badge: "🚀",
    projectArea: "35 Acres",
    projectType: "Mixed Use — Residential & Commercial",
    units: [
      { type: "1 Bedroom",  area: "90 m²",  price: "3,420,000 EGP" },
      { type: "2 Bedrooms", area: "135 m²", price: "5,130,000 EGP" },
      { type: "3 Bedrooms", area: "190 m²", price: "7,220,000 EGP" },
    ],
    booking: "15% Down Payment",
    installment: "8 Years — Quarterly",
    cashDiscount: "25%",
  },
  {
    id: 3,
    project: "Sky Residence",
    developer: "Emaar Misr",
    location: "New Capital — R3",
    date: "2026-07-01",
    time: "10:00 AM",
    tag: "Soft Launch",
    tagColor: "#f59e0b",
    tagBg: "#fef3c7",
    progress: 20,
    progressLabel: "20% Construction",
    badge: "⭐",
    projectArea: "70 Acres",
    projectType: "Luxury Residential Compound",
    units: [
      { type: "1 Bedroom",  area: "100 m²", price: "5,500,000 EGP" },
      { type: "2 Bedrooms", area: "155 m²", price: "8,525,000 EGP" },
      { type: "3 Bedrooms", area: "220 m²", price: "12,100,000 EGP" },
      { type: "Penthouse",  area: "340 m²", price: "21,000,000 EGP" },
    ],
    booking: "20% Down Payment",
    installment: "10 Years — Semi-Annual",
    cashDiscount: "30%",
  },
];

const POSTS = [
  {
    id: 1,
    project: "AMG — R7",
    postedAt: "اليوم، 10:30 ص",
    type: "unit_offer",
    typeLabel: "عرض وحدة",
    typeColor: "#4f46e5",
    typeBg: "#ede9fe",
    content: `وصلنا في AMG ل 80% إنشاءات 💪🧘
هات عميلك وتعالي يعاين على أرض الوقع 🏃‍♂️🔥 في أميز لوكيشن في الـ R7 🔥🤩

تعالي امتلك وحدتك في أميز وأرقي مكان في الـ R7 دابل فيو على حي السفارات وحي المستثمرين من AVA MINA Group (AMG)

*8C_ A32 (210)*
دايركت على النادي`,
    unit: "A32 — 210m²",
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
    postedAt: "أمس، 3:15 م",
    type: "promo",
    typeLabel: "بروموشن",
    typeColor: "#10b981",
    typeBg: "#d1fae5",
    content: `🏙️ Nile Gate Phase 2 — فرصة محدودة!
وحدات تاور B متاحة بأسعار ما قبل الإطلاق 🔥

متشيلوش الفرصة دي — الأسعار هتتغير بعد الـ Launch رسمياً يوم 22 يونيو`,
    unit: "Tower B",
    details: [
      { label: "سعر المتر",       value: "38,000 ج"    },
      { label: "مقدم",            value: "15%"          },
      { label: "تقسيط",           value: "8 سنوات"     },
    ],
  },
];

// ── Launch Card ───────────────────────────────────────────

function LaunchCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = Math.ceil((new Date(item.date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(79,70,229,.08)",
      border: "1px solid #e8eaf6",
      animation: `fadeUp .4s ease ${index * 0.08}s both`,
    }}>
      {/* Top color bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${item.tagColor}, ${item.tagColor}88)` }} />

      <div style={{ padding: "16px 16px 14px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: "1.1rem" }}>{item.badge}</span>
              <div style={{ fontSize: ".95rem", fontWeight: 800, color: "#1e1b4b" }}>{item.project}</div>
            </div>
            <div style={{ fontSize: ".72rem", color: "#94a3b8", fontWeight: 500 }}>{item.developer}</div>
          </div>
          <div style={{
            background: daysLeft <= 7 ? "#fee2e2" : "#ede9fe",
            color: daysLeft <= 7 ? "#ef4444" : "#4f46e5",
            fontSize: ".62rem", fontWeight: 800,
            padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap",
          }}>
            {daysLeft <= 0 ? "Today!" : `${daysLeft} days`}
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ background: item.tagBg, color: item.tagColor, fontSize: ".6rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>{item.tag}</div>
          <div style={{ background: "#f5f7ff", color: "#64748b", fontSize: ".6rem", fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
            {Icons.calendar} {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {item.time}
          </div>
          <div style={{ background: "#f5f7ff", color: "#64748b", fontSize: ".6rem", fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
            {Icons.house} {item.location}
          </div>
        </div>

        {/* Quick info row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Project Area", value: item.projectArea },
            { label: "Type",         value: item.projectType },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, background: "#f8f9ff", borderRadius: 10, padding: "8px 10px", border: "1px solid #e8eaf6" }}>
              <div style={{ fontSize: ".55rem", color: "#94a3b8", fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 }}>{d.label}</div>
              <div style={{ fontSize: ".72rem", color: "#1e1b4b", fontWeight: 700 }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Booking & installment */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Booking",      value: item.booking,      color: "#4f46e5", bg: "#ede9fe" },
            { label: "Installment",  value: item.installment,  color: "#10b981", bg: "#d1fae5" },
            { label: "Cash Discount",value: item.cashDiscount, color: "#f59e0b", bg: "#fef3c7" },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, background: d.bg, borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: ".52rem", color: d.color, fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3, opacity: 0.7 }}>{d.label}</div>
              <div style={{ fontSize: ".68rem", color: d.color, fontWeight: 800 }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: ".62rem", color: "#94a3b8", fontWeight: 600 }}>Construction Progress</span>
            <span style={{ fontSize: ".62rem", color: item.tagColor, fontWeight: 700 }}>{item.progressLabel}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "#eef1fb", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${item.tagColor}, ${item.tagColor}aa)`, width: `${item.progress}%`, transition: "width 1s ease" }} />
          </div>
        </div>

        {/* Units toggle */}
        <div onClick={() => setExpanded(e => !e)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", padding: "8px 0",
          borderTop: "1px solid #eef1fb",
        }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#4f46e5" }}>
            Unit Sizes & Prices
          </span>
          <span style={{ fontSize: ".62rem", color: "#94a3b8" }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
        </div>

        {/* Units table */}
        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              {["Type", "Area", "Price"].map(h => (
                <div key={h} style={{ fontSize: ".55rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</div>
              ))}
            </div>
            {item.units.map((u, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4,
                background: i % 2 === 0 ? "#f8f9ff" : "#fff",
                padding: "8px 10px", borderRadius: 10,
                border: "1px solid #e8eaf6",
              }}>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#1e1b4b" }}>{u.type}</div>
                <div style={{ fontSize: ".72rem", fontWeight: 600, color: "#64748b" }}>{u.area}</div>
                <div style={{ fontSize: ".68rem", fontWeight: 800, color: item.tagColor }}>{u.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────

function PostCard({ post, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(79,70,229,.08)",
      border: "1px solid #e8eaf6",
      animation: `fadeUp .4s ease ${index * 0.08}s both`,
    }}>
      {/* Left accent */}
      <div style={{ display: "flex" }}>
        <div style={{
          width: 4, flexShrink: 0,
          background: `linear-gradient(180deg, ${post.typeColor}, ${post.typeColor}55)`,
          borderRadius: "0 0 0 0",
        }} />

        <div style={{ flex: 1, padding: "14px 14px 14px 12px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: post.typeBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".75rem", fontWeight: 900, color: post.typeColor,
              }}>
                {post.project.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: ".82rem", fontWeight: 800, color: "#1e1b4b" }}>{post.project}</div>
                <div style={{ fontSize: ".6rem", color: "#94a3b8" }}>{post.postedAt}</div>
              </div>
            </div>
            <div style={{
              background: post.typeBg, color: post.typeColor,
              fontSize: ".58rem", fontWeight: 700,
              padding: "3px 9px", borderRadius: 99,
            }}>{post.typeLabel}</div>
          </div>

          {/* Post content */}
          <div style={{
            background: "#f8f9ff",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 10,
            fontSize: ".78rem",
            color: "#1e1b4b",
            lineHeight: 1.7,
            whiteSpace: "pre-line",
            maxHeight: expanded ? "none" : 80,
            overflow: "hidden",
            position: "relative",
          }}>
            {post.content}
            {!expanded && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 32,
                background: "linear-gradient(transparent, #f8f9ff)",
              }} />
            )}
          </div>

          {/* Expand toggle */}
          <div
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: ".65rem", color: post.typeColor, fontWeight: 700,
              cursor: "pointer", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {expanded ? "عرض أقل ▲" : "عرض المزيد ▼"}
          </div>

          {/* Price details grid */}
          {expanded && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 6, marginBottom: 4,
            }}>
              {post.details.map((d, i) => (
                <div key={i} style={{
                  background: "#f5f7ff",
                  borderRadius: 10, padding: "8px 10px",
                  border: "1px solid #e8eaf6",
                }}>
                  <div style={{ fontSize: ".58rem", color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: ".75rem", color: "#1e1b4b", fontWeight: 800 }}>{d.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Timeline Page ─────────────────────────────────────────

export default function TimelinePage({ activeTab = 2, onTabChange, onSignOut }) {
  const [tab, setTab]             = useState("launches"); // "launches" | "posts"
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifs] = useState([
    { id: 1, text: "Launch جديد: AMG R7 — 15 يونيو", time: "منذ ساعة", color: "#4f46e5", unread: true },
    { id: 2, text: "بوست جديد من المانجر على Nile Gate", time: "أمس",     color: "#10b981", unread: false },
  ]);

  const unreadCount = notifs.filter(n => n.unread).length;

  return (
    <div style={{
      fontFamily: "Inter, sans-serif",
      background: "#f5f7ff",
      minHeight: "100vh",
      color: "#1e1b4b",
      width: "100%",
      userSelect: "none",
      WebkitUserSelect: "none",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={onSignOut} />
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={() => {}}
      />

      <AppHeader
        unreadCount={unreadCount}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* Tab switcher */}
      <div style={{ padding: "14px 16px 0", display: "flex", gap: 8 }}>
        {[
          { key: "launches", label: "🚀 Launches", count: LAUNCHES.length },
          { key: "posts",    label: "📢 Posts",    count: POSTS.length    },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 18px", borderRadius: 99, border: "none",
              cursor: "pointer", fontFamily: "Inter,sans-serif",
              fontSize: ".75rem", fontWeight: 700,
              background: tab === t.key
                ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                : "#fff",
              color: tab === t.key ? "#fff" : "#94a3b8",
              boxShadow: tab === t.key
                ? "0 4px 14px rgba(79,70,229,.35)"
                : "0 1px 4px rgba(0,0,0,.06)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all .2s",
            }}
          >
            {t.label}
            <span style={{
              background: tab === t.key ? "rgba(255,255,255,.25)" : "#ede9fe",
              color: tab === t.key ? "#fff" : "#4f46e5",
              fontSize: ".58rem", fontWeight: 800,
              padding: "1px 6px", borderRadius: 99,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 110px", display: "flex", flexDirection: "column", gap: 12 }}>
        {tab === "launches" && (
          <>
            {/* Upcoming label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 4px" }}>
              <div style={{ flex: 1, height: 1, background: "#e8eaf6" }} />
              <span style={{ fontSize: ".62rem", color: "#94a3b8", fontWeight: 600 }}>القادم قريباً</span>
              <div style={{ flex: 1, height: 1, background: "#e8eaf6" }} />
            </div>
            {LAUNCHES.map((item, i) => (
              <LaunchCard key={item.id} item={item} index={i} />
            ))}
          </>
        )}

        {tab === "posts" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 4px" }}>
              <div style={{ flex: 1, height: 1, background: "#e8eaf6" }} />
              <span style={{ fontSize: ".62rem", color: "#94a3b8", fontWeight: 600 }}>آخر البوستات</span>
              <div style={{ flex: 1, height: 1, background: "#e8eaf6" }} />
            </div>
            {POSTS.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
