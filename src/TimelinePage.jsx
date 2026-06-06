// ── TimelinePage.jsx — ONYX Design System ────────────────────
import { useState } from "react";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";
import Icons             from "./Icons";

// ─── ONYX Tokens ─────────────────────────────────────────────
const C = {
  surface:  "#0A0A0A",
  card:     "#111111",
  border:   "#1E1E1E",
  cardAlt:  "#252525",
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
  @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  .onyx-card { animation: fadeInUp .35s ease both; }
  .tap-scale:active { transform:scale(.96); transition:transform .1s ease; }
  ::-webkit-scrollbar { width:3px; height:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
`;

// ─── Mock Data ────────────────────────────────────────────────
const LAUNCHES = [
  {
    id: 1,
    project: "AMG — R7",
    developer: "AVA MINA Group",
    location: "R7 — New Capital",
    date: "2026-06-15",
    time: "11:00 AM",
    tag: "Grand Launch",
    tagColor: C.blue,
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
    tagColor: C.green,
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
    tagColor: C.amber,
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
    typeColor: C.blue,
    content: `وصلنا في AMG ل 80% إنشاءات 💪🧘\nهات عميلك وتعالي يعاين على أرض الوقع 🏃‍♂️🔥 في أميز لوكيشن في الـ R7 🔥🤩\n\nتعالي امتلك وحدتك في أميز وأرقي مكان في الـ R7 دابل فيو على حي السفارات وحي المستثمرين من AVA MINA Group (AMG)\n\n*8C_ A32 (210)*\nدايركت على النادي`,
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
    typeColor: C.green,
    content: `🏙️ Nile Gate Phase 2 — فرصة محدودة!\nوحدات تاور B متاحة بأسعار ما قبل الإطلاق 🔥\n\nمتشيلوش الفرصة دي — الأسعار هتتغير بعد الـ Launch رسمياً يوم 22 يونيو`,
    unit: "Tower B",
    details: [
      { label: "سعر المتر", value: "38,000 ج" },
      { label: "مقدم",      value: "15%"       },
      { label: "تقسيط",     value: "8 سنوات"  },
    ],
  },
];

// ─── Launch Card ──────────────────────────────────────────────
function LaunchCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = Math.ceil((new Date(item.date) - new Date()) / (1000*60*60*24));
  const urgent = daysLeft <= 7;

  return (
    <div className="onyx-card" style={{
      background: C.card,
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.red}`,
      animationDelay: `${index * 80}ms`,
    }}>
      {/* Top bar — always red */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.red}, ${C.redLight} 40%, transparent)` }} />

      <div style={{ padding: "14px 14px 12px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <span style={{ fontSize:"1.1rem" }}>{item.badge}</span>
              <div style={{ fontSize:".92rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif" }}>{item.project}</div>
            </div>
            <div style={{ fontSize:".68rem", color:C.gray, fontWeight:600, fontFamily:"Archivo,sans-serif" }}>{item.developer}</div>
          </div>
          {/* Days badge — red if urgent */}
          <div style={{
            background: urgent ? `${C.red}22` : C.cardAlt,
            color: urgent ? C.red : C.silver,
            fontSize:".6rem", fontWeight:800,
            padding:"4px 10px", borderRadius:99,
            border: `1px solid ${urgent ? C.red+"55" : C.border}`,
            whiteSpace:"nowrap", fontFamily:"Archivo,sans-serif",
          }}>
            {daysLeft <= 0 ? "Today!" : `${daysLeft} days`}
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          {/* Launch type tag — red accent */}
          <div style={{ background:`${C.red}18`, color:C.white, fontSize:".58rem", fontWeight:700, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.red}44`, fontFamily:"Archivo,sans-serif", display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:C.red }} />
            {item.tag}
          </div>
          <div style={{ background:C.cardAlt, color:C.silver, fontSize:".58rem", fontWeight:600, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:4, fontFamily:"Archivo,sans-serif" }}>
            {Icons.calendar} {new Date(item.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} — {item.time}
          </div>
          <div style={{ background:C.cardAlt, color:C.silver, fontSize:".58rem", fontWeight:600, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:4, fontFamily:"Archivo,sans-serif" }}>
            {Icons.house} {item.location}
          </div>
        </div>

        {/* Quick info */}
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[
            { label:"Project Area", value:item.projectArea },
            { label:"Type",         value:item.projectType },
          ].map((d,i) => (
            <div key={i} style={{ flex:1, background:C.cardAlt, borderRadius:10, padding:"8px 10px", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:".52rem", color:C.gray, fontWeight:700, marginBottom:2, textTransform:"uppercase", letterSpacing:.4, fontFamily:"Archivo,sans-serif" }}>{d.label}</div>
              <div style={{ fontSize:".72rem", color:C.white, fontWeight:700, fontFamily:"Archivo,sans-serif" }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Booking / Installment / Cash — white text, colored label */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[
            { label:"Booking",       value:item.booking,      color:C.blue  },
            { label:"Installment",   value:item.installment,  color:C.green },
            { label:"Cash Discount", value:item.cashDiscount, color:C.amber },
          ].map((d,i) => (
            <div key={i} style={{ flex:1, background:C.cardAlt, borderRadius:10, padding:"8px 8px", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:".48rem", color:d.color, fontWeight:800, marginBottom:3, textTransform:"uppercase", letterSpacing:.3, fontFamily:"Archivo,sans-serif" }}>{d.label}</div>
              <div style={{ fontSize:".68rem", color:C.white, fontWeight:800, fontFamily:"Archivo,sans-serif" }}>{d.value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:".58rem", color:C.gray, fontWeight:600, fontFamily:"Archivo,sans-serif" }}>Construction Progress</span>
            <span style={{ fontSize:".58rem", color:C.red, fontWeight:700, fontFamily:"Archivo,sans-serif" }}>{item.progressLabel}</span>
          </div>
          <div style={{ height:5, borderRadius:99, background:C.cardAlt, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg, ${C.red}, ${C.redLight})`, width:`${item.progress}%`, transition:"width 1s ease" }} />
          </div>
        </div>

        {/* Units toggle — red */}
        <div onClick={() => setExpanded(e=>!e)} className="tap-scale" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:".65rem", fontWeight:700, color:C.red, fontFamily:"Archivo,sans-serif" }}>Unit Sizes & Prices</span>
          <span style={{ fontSize:".6rem", color:C.red, fontWeight:700, fontFamily:"Archivo,sans-serif" }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
        </div>

        {/* Units table */}
        {expanded && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, padding:"0 4px" }}>
              {["Type","Area","Price"].map(h => (
                <div key={h} style={{ fontSize:".52rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:.4, fontFamily:"Archivo,sans-serif" }}>{h}</div>
              ))}
            </div>
            {item.units.map((u,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, background: i%2===0 ? C.cardAlt : C.card, padding:"8px 10px", borderRadius:10, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:".7rem", fontWeight:700, color:C.white, fontFamily:"Archivo,sans-serif" }}>{u.type}</div>
                <div style={{ fontSize:".7rem", fontWeight:600, color:C.silver, fontFamily:"Archivo,sans-serif" }}>{u.area}</div>
                <div style={{ fontSize:".68rem", fontWeight:800, color:C.red, fontFamily:"Archivo,sans-serif" }}>{u.price}</div>
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

  return (
    <div className="onyx-card" style={{
      background: C.card,
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.red}`,
      animationDelay: `${index * 80}ms`,
    }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${C.red}, ${C.redLight} 40%, transparent)` }} />

      <div style={{ padding:"14px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${C.red}18`, border:`1px solid ${C.red}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".78rem", fontWeight:900, color:C.white, fontFamily:"Archivo,sans-serif" }}>
              {post.project.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize:".82rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif" }}>{post.project}</div>
              <div style={{ fontSize:".6rem", color:C.gray, fontFamily:"Archivo,sans-serif" }}>{post.postedAt}</div>
            </div>
          </div>
          {/* Type badge — red */}
          <div style={{ background:`${C.red}18`, color:C.white, fontSize:".58rem", fontWeight:700, padding:"3px 9px", borderRadius:6, border:`1px solid ${C.red}44`, fontFamily:"Archivo,sans-serif", display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:C.red }} />
            {post.typeLabel}
          </div>
        </div>

        {/* Post content — white text */}
        <div style={{ background:C.cardAlt, borderRadius:12, padding:"12px 14px", marginBottom:10, fontSize:".78rem", color:C.white, lineHeight:1.7, whiteSpace:"pre-line", maxHeight: expanded?"none":80, overflow:"hidden", position:"relative", border:`1px solid ${C.border}`, fontFamily:"Archivo,sans-serif" }}>
          {post.content}
          {!expanded && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:32, background:`linear-gradient(transparent, ${C.cardAlt})` }} />
          )}
        </div>

        {/* Expand toggle — red */}
        <div onClick={() => setExpanded(e=>!e)} className="tap-scale" style={{ fontSize:".63rem", color:C.red, fontWeight:700, cursor:"pointer", marginBottom:10, display:"flex", alignItems:"center", gap:4, fontFamily:"Archivo,sans-serif" }}>
          {expanded ? "عرض أقل ▲" : "عرض المزيد ▼"}
        </div>

        {/* Details grid */}
        {expanded && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {post.details.map((d,i) => (
              <div key={i} style={{ background:C.cardAlt, borderRadius:10, padding:"8px 10px", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:".55rem", color:C.gray, fontWeight:700, marginBottom:2, textTransform:"uppercase", letterSpacing:.4, fontFamily:"Archivo,sans-serif" }}>{d.label}</div>
                <div style={{ fontSize:".75rem", color:C.white, fontWeight:800, fontFamily:"Archivo,sans-serif" }}>{d.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, margin:"2px 0 4px" }}>
      <div style={{ flex:1, height:1, background:C.border }} />
      <span style={{ fontSize:".58rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, fontFamily:"Archivo,sans-serif" }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function TimelinePage({ activeTab = 2, onTabChange, onSignOut }) {
  const [tab,         setTab]         = useState("launches");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs, setNotifs] = useState([
    { id:1, text:"Launch جديد: AMG R7 — 15 يونيو", time:"منذ ساعة", color:C.blue,  unread:true  },
    { id:2, text:"بوست جديد من المانجر على Nile Gate", time:"أمس",   color:C.green, unread:false },
  ]);

  const unread = notifs.filter(n=>n.unread).length;

  return (
    <div style={{ fontFamily:"Archivo,sans-serif", background:C.surface, minHeight:"100vh", color:C.white, width:"100%" }}>
      <style>{STYLES}</style>

      <ProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)} onSignOut={onSignOut} />
      <NotificationPanel open={notifOpen} onClose={()=>setNotifOpen(false)} notifs={notifs} onMarkAll={()=>setNotifs(prev=>prev.map(n=>({...n,unread:false})))} />

      {/* Red top accent */}
      <div style={{ height:2, background:`linear-gradient(90deg,${C.red} 0%,${C.redLight} 40%,transparent 100%)`, position:"sticky", top:0, zIndex:100 }} />

      <AppHeader unreadCount={unread} onBellClick={()=>setNotifOpen(true)} onProfileClick={()=>setProfileOpen(true)} />

      {/* Tab switcher */}
      <div style={{ padding:"12px 16px 0", display:"flex", gap:8 }}>
        {[
          { key:"launches", label:"🚀 Launches", count:LAUNCHES.length },
          { key:"posts",    label:"📢 Posts",    count:POSTS.length    },
        ].map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={()=>setTab(t.key)} className="tap-scale" style={{
              padding:"8px 16px", borderRadius:8, border:`1px solid ${active ? C.red+"66" : C.border}`,
              cursor:"pointer", fontFamily:"Archivo,sans-serif",
              fontSize:".72rem", fontWeight:700,
              background: active ? `${C.red}22` : C.cardAlt,
              color: active ? C.white : C.gray,
              display:"flex", alignItems:"center", gap:6,
              transition:"all .2s ease",
            }}>
              {t.label}
              <span style={{ background: active ? C.red : C.cardAlt, color: active ? C.white : C.gray, fontSize:".55rem", fontWeight:800, padding:"1px 7px", borderRadius:99, border:`1px solid ${active ? C.red : C.border}` }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding:"12px 16px 110px", display:"flex", flexDirection:"column", gap:10 }}>
        {tab === "launches" && (
          <>
            <SectionDivider label="القادم قريباً" />
            {LAUNCHES.map((item,i) => <LaunchCard key={item.id} item={item} index={i} />)}
          </>
        )}
        {tab === "posts" && (
          <>
            <SectionDivider label="آخر البوستات" />
            {POSTS.map((post,i) => <PostCard key={post.id} post={post} index={i} />)}
          </>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
