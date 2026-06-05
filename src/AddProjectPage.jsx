// ── AddProjectPage.jsx — ONYX Design System ─────────────────────────
// صفحة إضافة مشروع جديد - ONYX CRM
//
// Props:
//   onProjectSaved  {function}
//   onTabChange     {function}
//   onSignOut       {function}
//   editProject     {object|null}

import { useState } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal from "./ProfileModal";

// ─── ONYX Design Tokens ───────────────────────────────────────────────
const C = {
  black:     "#000000",
  surface:   "#0A0A0A",
  card:      "#111111",
  border:    "#1E1E1E",
  cardAlt:   "#252525",
  cardHover: "#2E2E2E",
  gray:      "#595A5F",
  silver:    "#CECECE",
  white:     "#FFFFFF",
  red:       "#CC1515",
  redLight:  "#FF2020",
  blue:      "#253FF6",
  launch:    "#f59e0b",   // amber — Launch status color
};

// ─── Static Options ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "Under Construction", label: "Under Construction", color: "#f97316" },
  { value: "Ready to Move",      label: "Ready to Move",      color: "#10b981" },
  { value: "Off Plan",           label: "Off Plan",           color: "#253FF6" },
  { value: "On Hold",            label: "On Hold",            color: "#595A5F" },
  { value: "Launch",             label: "Launch",             color: "#f59e0b" },
];

// Category shown as chips (same ONYX chip style, no dropdown)
const CATEGORIES = ["Residential", "Commercial", "Administrative", "Mixed Use"];

const AMENITY_OPTIONS = [
  "Swimming Pool", "Gym", "Kids Area", "Security 24/7",
  "Underground Parking", "Rooftop Garden", "Club House",
  "Smart Home", "Mall", "Mosque", "Hospital", "School",
];

const NOTIFICATIONS = [
  { id: 1, text: "New lead on Nile Heights Tower", time: "2 min ago", color: "#253FF6", unread: true  },
  { id: 2, text: "Project updated by admin",        time: "1 hr ago",  color: "#10b981", unread: false },
];

// ─── Styles ───────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";

const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  html, body { margin:0; padding:0; border:none; outline:none; background:#0A0A0A; overflow-x:hidden; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
  .section-card { animation: fadeInUp .3s ease both; }
  .save-btn     { transition: opacity .15s ease, transform .1s ease, box-shadow .15s ease; }
  .save-btn:active  { transform: scale(.97); }
  .tap-btn          { transition: all .15s ease; }
  .tap-btn:active   { transform: scale(.94); }
  .chip-btn         { transition: all .15s ease; }
  .chip-btn:active  { transform: scale(.93); }
  input, select, textarea { -webkit-appearance: none; appearance: none; -webkit-user-select: text !important; user-select: text !important; }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
  input[type=date]::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer; filter:invert(1) }
  input, select { color-scheme: dark; }
  ::placeholder { color:#595A5F !important; opacity:1 }
  select option  { background:#252525; color:#FFFFFF }
`;

const inputBase = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, outline: "none",
  fontSize: ".82rem", fontWeight: 600, color: C.white,
  fontFamily: "Archivo, sans-serif", background: C.cardAlt,
};

const labelStyle = {
  fontSize: ".6rem", fontWeight: 700, color: C.gray,
  textTransform: "uppercase", letterSpacing: 0.6,
  marginBottom: 5, display: "block", fontFamily: "Archivo, sans-serif",
};

// ─── Divider ──────────────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    {label && <span style={{ fontSize:".55rem", fontWeight:700, color:C.gray, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{label}</span>}
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────
function Section({ title, children, delay = 0 }) {
  return (
    <div className="section-card" style={{
      background: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`,
      animationDelay: `${delay}ms`, overflow: "hidden",
    }}>
      <div style={{ padding:"10px 14px 8px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
        <span style={{ fontSize:".72rem", fontWeight:800, color:C.silver, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>{title}</span>
      </div>
      <div style={{ padding:"12px 14px" }}>{children}</div>
    </div>
  );
}

// ─── Unit Row — no wrapper box, just inline label + ✕ ────────────────
function UnitRow({ unit, index, onChange, onRemove }) {
  const set = (key, val) => onChange(index, { ...unit, [key]: val });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:".6rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>Unit #{index + 1}</span>
        <button onClick={() => onRemove(index)} style={{
          background:"none", border:"none", color:C.gray, cursor:"pointer",
          fontSize:".78rem", fontWeight:700, padding:"2px 4px", lineHeight:1,
        }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div><span style={labelStyle}>Type</span><input value={unit.type}      onChange={e=>set("type",e.target.value)}            placeholder="e.g. 2 Bedrooms" style={inputBase}/></div>
        <div><span style={labelStyle}>Size</span><input value={unit.size}      onChange={e=>set("size",e.target.value)}            placeholder="140 m²"          style={inputBase}/></div>
        <div><span style={labelStyle}>Price</span><input value={unit.price}    onChange={e=>set("price",e.target.value)}           placeholder="2.5M EGP"        style={inputBase}/></div>
        <div><span style={labelStyle}>Available</span><input type="number" value={unit.available} onChange={e=>set("available",Number(e.target.value))} placeholder="0" style={inputBase} min={0}/></div>
      </div>
    </div>
  );
}

// ─── Story URL Row — no wrapper box, just input + bare ✕ ─────────────
function StoryRow({ url, index, onChange, onRemove }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <input value={url} onChange={e=>onChange(index,e.target.value)}
        placeholder={`Story image URL #${index+1}`}
        style={{ ...inputBase, flex:1, fontSize:".78rem" }} />
      <button onClick={()=>onRemove(index)} style={{
        background:"none", border:"none", color:C.gray,
        cursor:"pointer", fontSize:".82rem", fontWeight:700,
        padding:"4px 6px", lineHeight:1, flexShrink:0,
      }}>✕</button>
    </div>
  );
}

// ─── Payment Plan Row ─────────────────────────────────────────────────
function PaymentRow({ plan, index, onChange, onRemove }) {
  const set = (key, val) => onChange(index, { ...plan, [key]: val });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:".6rem", fontWeight:800, color:C.white, fontFamily:"Archivo,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>Plan #{index + 1}</span>
        <button onClick={()=>onRemove(index)} style={{ background:"none", border:"none", color:C.gray, cursor:"pointer", fontSize:".78rem", fontWeight:700, padding:"2px 4px", lineHeight:1 }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div><span style={labelStyle}>Down Payment</span><input value={plan.downPayment} onChange={e=>set("downPayment",e.target.value)} placeholder="10%" style={inputBase}/></div>
        <div><span style={labelStyle}>Installment</span><input value={plan.installment}  onChange={e=>set("installment",e.target.value)}  placeholder="5% / quarter" style={inputBase}/></div>
        <div><span style={labelStyle}>Duration</span><input value={plan.duration} onChange={e=>set("duration",e.target.value)} placeholder="e.g. 7 years" style={inputBase}/></div>
        <div><span style={labelStyle}>On Delivery</span><input value={plan.onDelivery} onChange={e=>set("onDelivery",e.target.value)} placeholder="e.g. 10%" style={inputBase}/></div>
      </div>
      <div><span style={labelStyle}>Notes</span><input value={plan.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any extra details…" style={inputBase}/></div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function AddProjectPage({
  onProjectSaved, onTabChange, onSignOut,
  editProject = null, navItems, activeTab: activeTabProp,
}) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(NOTIFICATIONS);
  const [activeTab,   setActiveTab]   = useState(activeTabProp ?? 3);
  const [saved,       setSaved]       = useState(false);
  const [errors,      setErrors]      = useState({});

  const unread = notifs.filter(n => n.unread).length;

  const init = editProject || {};

  // ── Basic Info ──
  const [name,        setName]        = useState(init.name        || "");
  const [developer,   setDeveloper]   = useState(init.developer   || "");
  const [location,    setLocation]    = useState(init.location    || "");
  const [category,    setCategory]    = useState(init.category    || "Residential");
  // NEW basic fields
  const [projectArea,    setProjectArea]    = useState(init.projectArea    || "");
  const [prevWork,       setPrevWork]       = useState(init.prevWork       || "");
  const [maintenance,    setMaintenance]    = useState(init.maintenance    || "");
  const [parking,        setParking]        = useState(init.parking        || "");

  // ── Status ──
  const [status,      setStatus]      = useState(init.status      || "Under Construction");

  // ── Pricing ──
  const [price,       setPrice]       = useState(init.price       || "");
  const [area,        setArea]        = useState(init.area        || "");
  const [delivery,    setDelivery]    = useState(init.delivery    || "");

  // ── Payment Plans ──
  const [paymentPlans, setPaymentPlans] = useState(
    init.paymentPlans || [{ downPayment:"", installment:"", duration:"", onDelivery:"", notes:"" }]
  );

  // ── Description ──
  const [description, setDescription] = useState(init.description || "");

  // ── Media ──
  const [coverVideo,  setCoverVideo]  = useState(init.coverVideo  || "");
  const [profilePic,  setProfilePic]  = useState(init.profilePic  || "");

  // ── Stories ──
  const [stories,     setStories]     = useState(init.stories     || [""]);

  // ── Amenities ──
  const [amenities,   setAmenities]   = useState(init.amenities   || []);

  // ── Units ──
  const [units,       setUnits]       = useState(
    init.units || [{ type:"", size:"", price:"", available:0 }]
  );

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!name.trim())      e.name      = "Project name is required";
    if (!developer.trim()) e.developer = "Developer is required";
    if (!location.trim())  e.location  = "Location is required";
    if (!price.trim())     e.price     = "Starting price is required";
    if (!delivery.trim())  e.delivery  = "Delivery date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──
  const handleSave = () => {
    if (!validate()) return;
    const currentStatus = STATUS_OPTIONS.find(s => s.value === status);
    const project = {
      id:           editProject?.id || Date.now(),
      name:         name.trim(),
      developer:    developer.trim(),
      location:     location.trim(),
      category,
      // no projectType
      status,
      isLaunch:     status === "Launch",
      statusColor:  currentStatus?.color || "#f97316",
      price:        price.trim(),
      area:         area.trim(),
      delivery:     delivery.trim(),
      projectArea:  projectArea.trim(),
      prevWork:     prevWork.trim(),
      maintenance:  maintenance.trim(),
      parking:      parking.trim(),
      paymentPlans: paymentPlans.filter(p => p.downPayment.trim() || p.duration.trim()),
      description:  description.trim(),
      coverVideo:   coverVideo.trim(),
      coverThumb:   null,
      profilePic:   profilePic.trim() || `https://picsum.photos/seed/${Date.now()}/200/200`,
      amenities,
      units:        units.filter(u => u.type.trim()),
      stories:      stories.filter(s => s.trim()),
      agent:        editProject?.agent  || { name:"Admin", title:"Manager", phone:"" },
      stats:        editProject?.stats  || { leads:0, deals:0 },
    };
    onProjectSaved?.(project);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTabChange = (tab) => { setActiveTab(tab); onTabChange?.(tab); };
  const toggleAmenity   = (a)   => setAmenities(prev => prev.includes(a) ? prev.filter(x=>x!==a) : [...prev,a]);

  const addUnit     = () => setUnits(u=>[...u,{type:"",size:"",price:"",available:0}]);
  const changeUnit  = (i,v) => setUnits(u=>u.map((x,idx)=>idx===i?v:x));
  const removeUnit  = (i) => setUnits(u=>u.filter((_,idx)=>idx!==i));

  const addStory    = () => setStories(s=>[...s,""]);
  const changeStory = (i,v) => setStories(s=>s.map((x,idx)=>idx===i?v:x));
  const removeStory = (i) => setStories(s=>s.filter((_,idx)=>idx!==i));

  const addPayment    = () => setPaymentPlans(p=>[...p,{downPayment:"",installment:"",duration:"",onDelivery:"",notes:""}]);
  const changePayment = (i,v) => setPaymentPlans(p=>p.map((x,idx)=>idx===i?v:x));
  const removePayment = (i) => setPaymentPlans(p=>p.filter((_,idx)=>idx!==i));

  const statusMeta = STATUS_OPTIONS.find(s=>s.value===status) || STATUS_OPTIONS[0];

  return (
    <div style={{ minHeight:"100vh", background:C.surface, fontFamily:"Archivo, sans-serif", maxWidth:430, margin:"0 auto", position:"relative", paddingBottom:120 }}>
      <style>{STYLES}</style>

      <AppHeader unreadCount={unread} onBellClick={()=>setNotifOpen(true)} onProfileClick={()=>setProfileOpen(true)} />

      {/* ── Form Body (no page-title section per request) ── */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>

        {/* ── 1. Basic Information ── */}
        <Section title="Basic Information" delay={0}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Name */}
            <div>
              <span style={labelStyle}>Project Name *</span>
              <input value={name} onChange={e=>{setName(e.target.value);setErrors(v=>({...v,name:""}));}}
                placeholder="e.g. Nile Heights Tower"
                style={{...inputBase, borderColor:errors.name?C.red:C.border}}/>
              {errors.name && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>{errors.name}</div>}
            </div>

            {/* Developer */}
            <div>
              <span style={labelStyle}>Developer *</span>
              <input value={developer} onChange={e=>{setDeveloper(e.target.value);setErrors(v=>({...v,developer:""}));}}
                placeholder="e.g. Arabella Developments"
                style={{...inputBase, borderColor:errors.developer?C.red:C.border}}/>
              {errors.developer && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>{errors.developer}</div>}
            </div>

            {/* Location */}
            <div>
              <span style={labelStyle}>Location *</span>
              <input value={location} onChange={e=>{setLocation(e.target.value);setErrors(v=>({...v,location:""}));}}
                placeholder="e.g. New Cairo — 5th Settlement"
                style={{...inputBase, borderColor:errors.location?C.red:C.border}}/>
              {errors.location && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>{errors.location}</div>}
            </div>

            {/* Project Area + Previous Work */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <span style={labelStyle}>Project Area</span>
                <input value={projectArea} onChange={e=>setProjectArea(e.target.value)} placeholder="e.g. 50 Feddan" style={inputBase}/>
              </div>
              <div>
                <span style={labelStyle}>سابقة الأعمال</span>
                <input value={prevWork} onChange={e=>setPrevWork(e.target.value)} placeholder="e.g. Marassi, Hacienda" style={inputBase}/>
              </div>
            </div>

            {/* Maintenance + Parking */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <span style={labelStyle}>ديعة الصيانة</span>
                <input value={maintenance} onChange={e=>setMaintenance(e.target.value)} placeholder="e.g. 8% once" style={inputBase}/>
              </div>
              <div>
                <span style={labelStyle}>Parking</span>
                <input value={parking} onChange={e=>setParking(e.target.value)} placeholder="e.g. 1 free / unit" style={inputBase}/>
              </div>
            </div>

            {/* Category — chips instead of select */}
            <div>
              <span style={labelStyle}>Category</span>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {CATEGORIES.map(c => {
                  const active = category === c;
                  return (
                    <button key={c} className="chip-btn" onClick={()=>setCategory(c)} style={{
                      padding:"5px 11px", borderRadius:6,
                      border:`1px solid ${active ? C.red+"66" : C.border}`,
                      background: active ? `${C.red}18` : C.cardAlt,
                      color: active ? C.white : C.gray,
                      fontSize:".63rem", fontWeight:700, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:5,
                      fontFamily:"Archivo,sans-serif",
                    }}>
                      {active && <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </Section>

        {/* ── 2. Project Status ── */}
        <Section title="Project Status" delay={50}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {STATUS_OPTIONS.map(opt => {
              const active = status === opt.value;
              const isLaunch = opt.value === "Launch";
              return (
                <button key={opt.value} className="chip-btn" onClick={()=>setStatus(opt.value)} style={{
                  padding:"5px 11px", borderRadius:6,
                  border:`1px solid ${active ? (isLaunch ? C.launch+"66" : C.red+"66") : C.border}`,
                  background: active ? (isLaunch ? `${C.launch}18` : `${C.red}18`) : C.cardAlt,
                  color: active ? C.white : C.gray,
                  fontSize:".63rem", fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5,
                  fontFamily:"Archivo,sans-serif",
                }}>
                  {active && <div style={{width:5,height:5,borderRadius:"50%",background:isLaunch?C.launch:C.red,flexShrink:0}}/>}
                  <div style={{width:6,height:6,borderRadius:"50%",background:opt.color,flexShrink:0}}/>
                  {opt.label}
                  {isLaunch && <span style={{fontSize:".55rem",marginLeft:2}}>🚀</span>}
                </button>
              );
            })}
          </div>
          {status === "Launch" && (
            <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8, background:`${C.launch}12`, border:`1px solid ${C.launch}44`, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{fontSize:"1rem"}}>🚀</span>
              <span style={{fontSize:".65rem",fontWeight:700,color:C.launch,fontFamily:"Archivo,sans-serif"}}>
                This project will appear in the Sales Launch page
              </span>
            </div>
          )}
        </Section>

        {/* ── 3. Pricing & Details ── */}
        <Section title="Pricing & Details" delay={100}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <span style={labelStyle}>Starting Price *</span>
              <input value={price} onChange={e=>{setPrice(e.target.value);setErrors(v=>({...v,price:""}));}}
                placeholder="e.g. Starting from 2,500,000 EGP"
                style={{...inputBase, borderColor:errors.price?C.red:C.border}}/>
              {errors.price && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>{errors.price}</div>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <span style={labelStyle}>Unit Size Range</span>
                <input value={area} onChange={e=>setArea(e.target.value)} placeholder="120 – 320 m²" style={inputBase}/>
              </div>
              <div>
                <span style={labelStyle}>Delivery Date *</span>
                <input value={delivery} onChange={e=>{setDelivery(e.target.value);setErrors(v=>({...v,delivery:""}));}}
                  placeholder="e.g. Q4 2027"
                  style={{...inputBase, borderColor:errors.delivery?C.red:C.border}}/>
                {errors.delivery && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>{errors.delivery}</div>}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 4. Payment Plans ── */}
        <Section title="Payment Plans" delay={130}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {paymentPlans.map((plan,i) => (
              <PaymentRow key={i} plan={plan} index={i} onChange={changePayment} onRemove={removePayment}/>
            ))}
            <button onClick={addPayment} className="tap-btn" style={{
              padding:"9px", borderRadius:10, border:`1px dashed ${C.border}`,
              background:C.cardAlt, color:C.gray,
              fontSize:".72rem", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              fontFamily:"Archivo,sans-serif",
            }}>
              <span style={{fontSize:"1rem",color:C.white}}>+</span> <span style={{color:C.white}}>Add Payment Plan</span>
            </button>
          </div>
        </Section>

        {/* ── 5. Description ── */}
        <Section title="Project Description" delay={160}>
          <textarea value={description} onChange={e=>setDescription(e.target.value)}
            placeholder="اكتب وصف تفصيلي للمشروع هنا..."
            rows={4}
            style={{...inputBase, resize:"none", lineHeight:1.6, WebkitUserSelect:"text", userSelect:"text", borderRadius:10}}/>
        </Section>

        {/* ── 6. Media & Branding ── */}
        <Section title="Media & Branding" delay={200}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <span style={labelStyle}>Cover Video URL</span>
              <input value={coverVideo} onChange={e=>setCoverVideo(e.target.value)} placeholder="https://... (mp4 link)" style={inputBase}/>
              <div style={{fontSize:".6rem",color:C.gray,marginTop:4,fontWeight:600,fontFamily:"Archivo,sans-serif"}}>Direct mp4 link (e.g. Google Drive, CDN)</div>
            </div>
            <div>
              <span style={labelStyle}>Profile Picture URL</span>
              <input value={profilePic} onChange={e=>setProfilePic(e.target.value)} placeholder="https://... (image link)" style={inputBase}/>
              {profilePic && (
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10}}>
                  <img src={profilePic} alt="preview" style={{width:44,height:44,borderRadius:10,objectFit:"cover",border:`1px solid ${C.border}`}} onError={e=>{e.target.style.display="none";}}/>
                  <div style={{fontSize:".62rem",color:"#10b981",fontWeight:700,fontFamily:"Archivo,sans-serif"}}>✓ Preview loaded</div>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── 7. Story Images ── */}
        <Section title="Story Images" delay={220}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {stories.map((url,i) => (
              <StoryRow key={i} url={url} index={i} onChange={changeStory} onRemove={removeStory}/>
            ))}
            <button onClick={addStory} className="tap-btn" style={{
              marginTop:2, padding:"9px", borderRadius:10, border:`1px dashed ${C.border}`,
              background:C.cardAlt, color:C.gray,
              fontSize:".72rem", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              fontFamily:"Archivo,sans-serif",
            }}>
              <span style={{fontSize:"1rem",color:C.white}}>+</span> <span style={{color:C.white}}>Add Story Image</span>
            </button>
          </div>
        </Section>

        {/* ── 8. Facilities & Amenities ── */}
        <Section title="Facilities & Amenities" delay={250}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {AMENITY_OPTIONS.map(a => {
              const active = amenities.includes(a);
              return (
                <div key={a} className="chip-btn" onClick={()=>toggleAmenity(a)} style={{
                  padding:"5px 11px", borderRadius:6,
                  border:`1px solid ${active ? C.red+"66" : C.border}`,
                  background: active ? `${C.red}18` : C.cardAlt,
                  color: active ? C.white : C.gray,
                  fontSize:".63rem", fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5,
                  fontFamily:"Archivo,sans-serif",
                }}>
                  {active && <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>}
                  {a}
                </div>
              );
            })}
          </div>
          {amenities.length > 0 && (
            <div style={{marginTop:8,fontSize:".62rem",color:C.red,fontWeight:700,fontFamily:"Archivo,sans-serif"}}>
              {amenities.length} amenit{amenities.length===1?"y":"ies"} selected
            </div>
          )}
        </Section>

        {/* ── 9. Available Units ── */}
        <Section title="Available Units" delay={300}>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {units.map((unit,i) => (
              <UnitRow key={i} unit={unit} index={i} onChange={changeUnit} onRemove={removeUnit}/>
            ))}
            <button onClick={addUnit} className="tap-btn" style={{
              marginTop:10, padding:"9px", borderRadius:10, border:`1px dashed ${C.border}`,
              background:C.cardAlt, color:C.gray,
              fontSize:".72rem", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              fontFamily:"Archivo,sans-serif",
            }}>
              <span style={{fontSize:"1rem",color:C.white}}>+</span> <span style={{color:C.white}}>Add Unit Type</span>
            </button>
          </div>
        </Section>

        {/* ── Preview Card ── */}
        {name && (
          <div className="section-card" style={{
            background:C.card, border:`1px solid ${C.border}`,
            borderTop:`2px solid ${C.red}`, borderRadius:14, padding:"14px",
            boxShadow:`0 8px 32px rgba(204,21,21,.15)`, animationDelay:"350ms",
          }}>
            <Divider label="Preview"/>
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}>
              {profilePic
                ? <img src={profilePic} alt="logo" style={{width:44,height:44,borderRadius:10,objectFit:"cover",border:`1px solid ${C.border}`}}/>
                : <div style={{width:44,height:44,borderRadius:10,background:C.cardAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>🏢</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:".92rem",fontWeight:800,color:C.white,fontFamily:"Archivo,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                {developer && <div style={{fontSize:".65rem",color:C.gray,fontWeight:600,marginTop:2,fontFamily:"Archivo,sans-serif"}}>{developer}</div>}
                {location  && <div style={{fontSize:".62rem",color:C.gray,fontWeight:600,marginTop:1,fontFamily:"Archivo,sans-serif"}}>📍 {location}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
              <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,color:C.silver,fontSize:".6rem",fontWeight:700,padding:"3px 9px",borderRadius:6,fontFamily:"Archivo,sans-serif"}}>{category}</div>
              <div style={{
                background:`${statusMeta.color}20`, border:`1px solid ${statusMeta.color}44`,
                color:statusMeta.color, fontSize:".6rem", fontWeight:800, padding:"3px 9px", borderRadius:6,
                display:"flex", alignItems:"center", gap:4, fontFamily:"Archivo,sans-serif",
              }}>
                <div style={{width:5,height:5,borderRadius:"50%",background:statusMeta.color}}/>
                {status}
              </div>
            </div>
          </div>
        )}

        {/* ── Save Button ── */}
        <button className="save-btn" onClick={handleSave} style={{
          width:"100%", padding:"13px", borderRadius:12, border:"none",
          background: saved ? "#10b981" : C.red,
          color:"#fff", fontSize:".88rem", fontWeight:900, cursor:"pointer", letterSpacing:.3,
          boxShadow: saved ? "0 6px 20px rgba(16,185,129,.35)" : `0 6px 20px ${C.red}44`,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          transition:"background .3s ease, box-shadow .3s ease",
          fontFamily:"Archivo,sans-serif",
        }}>
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>
              Project Saved Successfully!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M219.31,108.68l-80-80A16,16,0,0,0,128,24H48A16,16,0,0,0,32,40v80a16,16,0,0,0,4.69,11.31l80,80a16,16,0,0,0,22.62,0l80-80a16,16,0,0,0,0-22.63ZM128,204.69,51.31,128,48,124.69V40h80l3.31,3.31h0L208,120Z"/></svg>
              {editProject ? "Update Project" : "Save & Publish Project"}
            </>
          )}
        </button>

        <div style={{textAlign:"center",fontSize:".62rem",color:C.gray,fontWeight:600,paddingBottom:4,fontFamily:"Archivo,sans-serif"}}>
          {editProject ? "Changes will be reflected instantly for all sales agents" : "Project will appear in sales agents' Projects page immediately"}
        </div>

      </div>

      {/* ── Modals & Panels ── */}
      <NotificationPanel open={notifOpen} onClose={()=>setNotifOpen(false)} notifs={notifs} onMarkAll={()=>setNotifs(prev=>prev.map(n=>({...n,unread:false})))}/>
      <ProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)} onSignOut={onSignOut}/>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} items={navItems}/>
    </div>
  );
}
