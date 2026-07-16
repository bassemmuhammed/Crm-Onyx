// ── AddProjectPage.jsx — ONYX Design System ─────────────────────────
// صفحة إضافة مشروع جديد - ONYX CRM
//
// Props:
//   onProjectSaved  {function}
//   onTabChange     {function}
//   onSignOut       {function}
//   editProject     {object|null}

import { useState, useEffect, useRef } from "react";
import { C } from "./theme";
// ✅ P1-3: Project Media Storage — رفع ملفات لـ project-media bucket
import {  uploadCoverImage,
  uploadProfileImage,
  uploadStoryImage,
  uploadCoverVideo,
  validateImageFile,
  validateVideoFile,
} from "./projectMediaService";

// ─── ONYX Design Tokens ───────────────────────────────────────────────

// ─── Static Options ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "Under Construction", label: "Under Construction", color: "#f97316" },
  { value: "Ready to Move",      label: "Ready to Move",      color: "#10b981" },
  { value: "Off Plan",           label: "Off Plan",           color: "#4C8DFF" },
  { value: "On Hold",            label: "On Hold",            color: "#8B93A7" },
  { value: "Launch",             label: "Launch",             color: "#f59e0b" },
];

// Category shown as chips (same ONYX chip style, no dropdown)
const CATEGORIES = ["Residential", "Commercial", "Administrative", "Mixed Use"];

const AMENITY_OPTIONS = [
  "Swimming Pool", "Gym", "Kids Area", "Security 24/7",
  "Underground Parking", "Rooftop Garden", "Club House",
  "Smart Home", "Mall", "Mosque", "Hospital", "School",
];

// ─── Styles ───────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";

const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  html, body { margin:0; padding:0; border:none; outline:none; background:#0B0D12; overflow-x:hidden; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.14);opacity:1} }
  @keyframes spin { to { transform: rotate(360deg) } }
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
  ::-webkit-scrollbar-thumb { background:#E23A4E; border-radius:99px }
  input[type=date]::-webkit-calendar-picker-indicator { opacity:.4; cursor:pointer;  }
  input, select { color-scheme: dark; }
  ::placeholder { color:#8B93A7 !important; opacity:1 }
  select option  { background:#1D2230; color:#F2F3F7 }
`;

const inputBase = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid #242938`, outline: "none",
  fontSize: ".82rem", fontWeight: 600, color: "#F2F3F7",
  fontFamily: "Inter, sans-serif", background: "#1D2230",
};

const labelStyle = {
  fontSize: ".6rem", fontWeight: 700, color: "#8B93A7",
  textTransform: "uppercase", letterSpacing: 0.6,
  marginBottom: 5, display: "block", fontFamily: "Inter, sans-serif",
};

// ─── Divider ──────────────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 2px" }}>
    {label && <span style={{ fontSize:".55rem", fontWeight:700, color:C.gray, fontFamily:"Inter,sans-serif", textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{label}</span>}
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────
function Section({ title, children, delay = 0 }) {
  return (
    <div className="section-card" style={{
      background: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.red}`,
      boxShadow: `inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,
      animationDelay: `${delay}ms`, overflow: "hidden",
    }}>
      <div style={{ padding:"10px 14px 8px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:C.red, flexShrink:0 }} />
        <span style={{ fontSize:".72rem", fontWeight:800, color:C.silver, fontFamily:"Inter,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>{title}</span>
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
        <span style={{ fontSize:".6rem", fontWeight:800, color:C.white, fontFamily:"Inter,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>Unit #{index + 1}</span>
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
        <span style={{ fontSize:".6rem", fontWeight:800, color:C.white, fontFamily:"Inter,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>Plan #{index + 1}</span>
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
  projects = [], onDeleteProject,
}) {
  const [view, setView] = useState(editProject ? "form" : "list"); // "list" | "form" | "detail"
  const [selectedProject, setSelectedProject] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  // لو الأدمن فتح edit من بره، روح على الفورم
  useEffect(() => {
    if (editProject) setView("form");
  }, [editProject]);

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

  // ── Location Link ──
  const [locationLink, setLocationLink] = useState(init.locationLink || "");

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
  // ✅ P1-3: uploading state for media files
  const [uploadingCover, setUploadingCover]       = useState(null); // null | 'image' | 'video'
  const [uploadingProfile, setUploadingProfile]   = useState(false);
  const [uploadingStory, setUploadingStory]       = useState(null); // null | index
  const [mediaError, setMediaError]               = useState("");
  const coverImgRef    = useRef(null);
  const coverVidRef    = useRef(null);
  const profileImgRef  = useRef(null);
  const storyImgRefs   = useRef([]);

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
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const currentStatus = STATUS_OPTIONS.find(s => s.value === status);
    const project = {
      id:           editProject?.id || Date.now(),
      name:         name.trim(),
      developer:    developer.trim(),
      location:     location.trim(),
      category,
      status,
      isLaunch:     status === "Launch",
      statusColor:  currentStatus?.color || "#f97316",
      price:        price.trim(),
      area:         area.trim(),
      delivery:     delivery.trim(),
      locationLink: locationLink.trim(),
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
    // انتظر الـ save في Supabase أولاً قبل ما تظهر رسالة النجاح
    await onProjectSaved?.(project);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setView("list");
      setSelectedProject(null);
    }, 1500);
  };

  const handleTabChange = (tab) => { onTabChange?.(tab); };
  const toggleAmenity   = (a)   => setAmenities(prev => prev.includes(a) ? prev.filter(x=>x!==a) : [...prev,a]);

  const addUnit     = () => setUnits(u=>[...u,{type:"",size:"",price:"",available:0}]);
  const changeUnit  = (i,v) => setUnits(u=>u.map((x,idx)=>idx===i?v:x));
  const removeUnit  = (i) => setUnits(u=>u.filter((_,idx)=>idx!==i));

  const addStory    = () => setStories(s=>[...s,""]);
  const changeStory = (i,v) => setStories(s=>s.map((x,idx)=>idx===i?v:x));
  const removeStory = (i) => setStories(s=>s.filter((_,idx)=>idx!==i));

  // ════════════════════════════════════════════════════════════════
  // ✅ P1-3: Project Media Upload Handlers (مطابقة Flutter — project-media bucket)
  // ════════════════════════════════════════════════════════════════
  const projectId = editProject?.id || "new";

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError("");
    setUploadingCover("image");
    const result = await uploadCoverImage(projectId, file);
    setUploadingCover(null);
    if (result.ok) {
      // نضع الـ URL في حقل profilePic مؤقتاً (cover image تُستخدم كـ profilePic في الـ design)
      // ملاحظة: الـ React version ليس لها حقل coverImage منفصل — نستخدم profilePic
      setProfilePic(result.url);
    } else {
      setMediaError(result.error);
    }
    e.target.value = "";
  };

  const handleCoverVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError("");
    setUploadingCover("video");
    const result = await uploadCoverVideo(projectId, file);
    setUploadingCover(null);
    if (result.ok) {
      setCoverVideo(result.url);
    } else {
      setMediaError(result.error);
    }
    e.target.value = "";
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError("");
    setUploadingProfile(true);
    const result = await uploadProfileImage(projectId, file);
    setUploadingProfile(false);
    if (result.ok) {
      setProfilePic(result.url);
    } else {
      setMediaError(result.error);
    }
    e.target.value = "";
  };

  const handleStoryImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError("");
    setUploadingStory(index);
    const result = await uploadStoryImage(projectId, index, file);
    setUploadingStory(null);
    if (result.ok) {
      changeStory(index, result.url);
    } else {
      setMediaError(result.error);
    }
    e.target.value = "";
  };

  const addPayment    = () => setPaymentPlans(p=>[...p,{downPayment:"",installment:"",duration:"",onDelivery:"",notes:""}]);
  const changePayment = (i,v) => setPaymentPlans(p=>p.map((x,idx)=>idx===i?v:x));
  const removePayment = (i) => setPaymentPlans(p=>p.filter((_,idx)=>idx!==i));

  const statusMeta = STATUS_OPTIONS.find(s=>s.value===status) || STATUS_OPTIONS[0];

  // ── Project List View ──
  if (view === "list") {
    return (
      <div style={{ background:"transparent", fontFamily:"Inter, sans-serif", maxWidth:430, margin:"0 auto", paddingBottom:80 }}>
        <style>{STYLES}</style>
        <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:3, height:20, background:C.red, borderRadius:2 }}/>
              <span style={{ fontSize:".88rem", fontWeight:800, color:C.white, fontFamily:"Inter,sans-serif", textTransform:"uppercase", letterSpacing:.6 }}>PROJECTS</span>
              <div style={{ background:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:6, padding:"2px 8px", fontSize:".65rem", fontWeight:700, color:C.gray, fontFamily:"Inter,sans-serif" }}>{projects.length}</div>
            </div>
            <button onClick={()=>setView("form")} className="tap-btn" style={{
              background:C.red, border:"none", borderRadius:10, padding:"8px 14px",
              color:C.white, fontSize:".72rem", fontWeight:800, cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif",
            }}>
              <span style={{fontSize:"1rem"}}>+</span> Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", minHeight:"55vh", textAlign:"center",
            }}>
              <div style={{ marginBottom:24, position:"relative" }}>
                <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:`1px solid ${C.red}33`, animation:"pulse-ring 2.8s ease-in-out infinite" }} />
                <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1px solid ${C.border}` }} />
                <div style={{ width:80, height:80, borderRadius:"50%", background:C.card, border:`1.5px solid ${C.border}`, borderLeft:`2px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="32" height="32" viewBox="0 0 256 256" fill={C.red}>
                    <path d="M240,208H224V96a16,16,0,0,0-16-16H144V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V208H8a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM144,208H112V168a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8Zm64,0H160V168a24,24,0,0,0-24-24H120a24,24,0,0,0-24,24v40H32V48H128V96h0a16,16,0,0,0,16,16h64Z"/>
                  </svg>
                </div>
              </div>
              <div style={{fontSize:"1.05rem",fontWeight:900,color:C.white,fontFamily:"Inter,sans-serif",marginBottom:8}}>No Projects Yet</div>
              <div style={{fontSize:".75rem",color:C.gray,fontWeight:600,fontFamily:"Inter,sans-serif",lineHeight:1.6,maxWidth:220}}>اضغط + Add Project عشان تضيف مشروع جديد</div>
            </div>
          ) : (
            projects.map((proj, i) => {
              const sMeta = STATUS_OPTIONS.find(s=>s.value===proj.status) || STATUS_OPTIONS[0];
              return (
                <div key={proj.id} className="section-card" style={{
                  background:C.card, border:`1px solid ${C.border}`,
                  borderLeft:`3px solid ${C.red}`,
                  boxShadow:`inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,
                  borderRadius:14, overflow:"hidden", cursor:"pointer",
                  animationDelay:`${i*40}ms`,
                }} onClick={()=>{setSelectedProject(proj);setView("detail");}}>
                  <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                    {proj.profilePic
                      ? <img src={proj.profilePic} alt={proj.name} style={{width:48,height:48,borderRadius:10,objectFit:"cover",border:`1px solid ${C.border}`,flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                      : <div style={{width:48,height:48,borderRadius:10,background:C.cardAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0}}>🏢</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:".88rem",fontWeight:800,color:C.white,fontFamily:"Inter,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{proj.name}</div>
                      <div style={{fontSize:".65rem",color:C.gray,fontWeight:600,marginTop:2,fontFamily:"Inter,sans-serif"}}>{proj.developer}</div>
                      {proj.location && <div style={{fontSize:".62rem",color:C.gray,fontWeight:600,marginTop:1,fontFamily:"Inter,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {proj.location}</div>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 256 256" fill={C.gray}><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>
                  </div>
                  <div style={{ padding:"8px 14px 12px", borderTop:`1px solid ${C.border}`, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,color:C.silver,fontSize:".58rem",fontWeight:700,padding:"3px 8px",borderRadius:6,fontFamily:"Inter,sans-serif"}}>{proj.category}</div>
                    <div style={{background:`${sMeta.color}20`,border:`1px solid ${sMeta.color}44`,color:sMeta.color,fontSize:".58rem",fontWeight:800,padding:"3px 8px",borderRadius:6,display:"flex",alignItems:"center",gap:4,fontFamily:"Inter,sans-serif"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:sMeta.color}}/>
                      {proj.status}
                    </div>
                    {proj.price && <div style={{marginLeft:"auto",fontSize:".6rem",fontWeight:700,color:C.red,fontFamily:"Inter,sans-serif"}}>From {proj.price}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Project Detail View ──
  if (view === "detail" && selectedProject) {
    const proj = selectedProject;
    const sMeta = STATUS_OPTIONS.find(s=>s.value===proj.status) || STATUS_OPTIONS[0];
    return (
      <div style={{ background:"transparent", fontFamily:"Inter, sans-serif", maxWidth:430, margin:"0 auto", paddingBottom:100 }}>
        <style>{STYLES}</style>
        <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
          {/* Back */}
          <button onClick={()=>setView("list")} className="tap-btn" style={{
            background:"none", border:"none", color:C.gray, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6, padding:"4px 0",
            fontSize:".72rem", fontWeight:700, fontFamily:"Inter,sans-serif",
          }}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>
            Back to Projects
          </button>

          {/* Hero Card */}
          <div className="section-card" style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,boxShadow:`inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,borderRadius:14,overflow:"hidden",animationDelay:"0ms"}}>
            <div style={{ padding:"16px 14px", display:"flex", alignItems:"center", gap:14 }}>
              {proj.profilePic
                ? <img src={proj.profilePic} alt={proj.name} style={{width:60,height:60,borderRadius:12,objectFit:"cover",border:`1px solid ${C.border}`,flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                : <div style={{width:60,height:60,borderRadius:12,background:C.cardAlt,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem",flexShrink:0}}>🏢</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"1rem",fontWeight:900,color:C.white,fontFamily:"Inter,sans-serif"}}>{proj.name}</div>
                {proj.developer && <div style={{fontSize:".68rem",color:C.gray,fontWeight:600,marginTop:3,fontFamily:"Inter,sans-serif"}}>{proj.developer}</div>}
                {proj.location && <div style={{fontSize:".65rem",color:C.gray,fontWeight:600,marginTop:2,fontFamily:"Inter,sans-serif"}}>📍 {proj.location}</div>}
                {proj.locationLink && <a href={proj.locationLink} target="_blank" rel="noopener noreferrer" style={{fontSize:".62rem",color:"#10b981",fontWeight:700,fontFamily:"Inter,sans-serif",textDecoration:"none",display:"block",marginTop:2}}>🗺️ View on Google Maps</a>}
              </div>
            </div>
            <div style={{ padding:"8px 14px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:6, flexWrap:"wrap" }}>
              <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,color:C.silver,fontSize:".6rem",fontWeight:700,padding:"4px 10px",borderRadius:6,fontFamily:"Inter,sans-serif"}}>{proj.category}</div>
              <div style={{background:`${sMeta.color}20`,border:`1px solid ${sMeta.color}44`,color:sMeta.color,fontSize:".6rem",fontWeight:800,padding:"4px 10px",borderRadius:6,display:"flex",alignItems:"center",gap:4,fontFamily:"Inter,sans-serif"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:sMeta.color}}/>
                {proj.status}
              </div>
            </div>
          </div>

          {/* Pricing */}
          {(proj.price || proj.area || proj.delivery) && (
            <div className="section-card" style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,boxShadow:`inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,borderRadius:14,overflow:"hidden",animationDelay:"40ms"}}>
              <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>
                <span style={{fontSize:".72rem",fontWeight:800,color:C.silver,fontFamily:"Inter,sans-serif",textTransform:"uppercase",letterSpacing:.6}}>Pricing & Details</span>
              </div>
              <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {proj.price && <div><div style={{fontSize:".55rem",fontWeight:700,color:C.gray,fontFamily:"Inter,sans-serif",textTransform:"uppercase",marginBottom:3}}>Starting Price</div><div style={{fontSize:".75rem",fontWeight:800,color:C.red,fontFamily:"Inter,sans-serif"}}>{proj.price}</div></div>}
                {proj.area && <div><div style={{fontSize:".55rem",fontWeight:700,color:C.gray,fontFamily:"Inter,sans-serif",textTransform:"uppercase",marginBottom:3}}>Unit Size</div><div style={{fontSize:".75rem",fontWeight:800,color:C.white,fontFamily:"Inter,sans-serif"}}>{proj.area}</div></div>}
                {proj.delivery && <div><div style={{fontSize:".55rem",fontWeight:700,color:C.gray,fontFamily:"Inter,sans-serif",textTransform:"uppercase",marginBottom:3}}>Delivery</div><div style={{fontSize:".75rem",fontWeight:800,color:C.launch,fontFamily:"Inter,sans-serif"}}>{proj.delivery}</div></div>}
              </div>
            </div>
          )}

          {/* Amenities */}
          {proj.amenities?.length > 0 && (
            <div className="section-card" style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,boxShadow:`inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,borderRadius:14,overflow:"hidden",animationDelay:"80ms"}}>
              <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>
                <span style={{fontSize:".72rem",fontWeight:800,color:C.silver,fontFamily:"Inter,sans-serif",textTransform:"uppercase",letterSpacing:.6}}>Amenities</span>
              </div>
              <div style={{padding:"12px 14px",display:"flex",flexWrap:"wrap",gap:5}}>
                {proj.amenities.map(a=>(
                  <div key={a} style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,color:C.white,fontSize:".6rem",fontWeight:700,padding:"4px 10px",borderRadius:6,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:C.red}}/>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {proj.description && (
            <div className="section-card" style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,boxShadow:`inset 3px 0 0 0 ${C.red}, inset 3.5px 0 12px -2px ${C.red}44`,borderRadius:14,overflow:"hidden",animationDelay:"100ms"}}>
              <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>
                <span style={{fontSize:".72rem",fontWeight:800,color:C.silver,fontFamily:"Inter,sans-serif",textTransform:"uppercase",letterSpacing:.6}}>Description</span>
              </div>
              <div style={{padding:"12px 14px",fontSize:".75rem",color:C.silver,fontWeight:500,fontFamily:"Inter,sans-serif",lineHeight:1.7}}>{proj.description}</div>
            </div>
          )}

          {/* Delete Confirm */}
          {confirmDelete === proj.id && (
            <div style={{background:`${C.red}12`,border:`1px solid ${C.red}44`,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:".75rem",fontWeight:700,color:C.white,fontFamily:"Inter,sans-serif",textAlign:"center"}}>🗑️ حذف المشروع نهائياً؟</div>
              <div style={{fontSize:".65rem",color:C.gray,fontFamily:"Inter,sans-serif",textAlign:"center"}}>لا يمكن التراجع عن هذه العملية</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setConfirmDelete(null)} className="tap-btn" style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.white,fontSize:".72rem",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>إلغاء</button>
                <button onClick={()=>{onDeleteProject?.(proj.id);setView("list");setConfirmDelete(null);}} className="tap-btn" style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:C.red,color:C.white,fontSize:".72rem",fontWeight:800,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>تأكيد الحذف</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{position:"sticky",bottom:16,zIndex:50,display:"flex",gap:8}}>
            <button onClick={()=>{setSelectedProject(proj);setView("form");}} className="tap-btn" style={{
              flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,
              background:C.cardAlt,color:C.white,fontSize:".8rem",fontWeight:800,
              cursor:"pointer",fontFamily:"Inter,sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            }}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
              تعديل
            </button>
            <button onClick={()=>setConfirmDelete(proj.id)} className="tap-btn" style={{
              flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.red}44`,
              background:`${C.red}18`,color:C.red,fontSize:".8rem",fontWeight:800,
              cursor:"pointer",fontFamily:"Inter,sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            }}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
              حذف
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Add/Edit Form View ──
  return (
    <div style={{ background:"transparent", fontFamily:"Inter, sans-serif", maxWidth:430, margin:"0 auto", position:"relative", paddingBottom:80 }}>
      <style>{STYLES}</style>

      {/* ── Form Body ── */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>

        {/* Back to list */}
        <button onClick={()=>setView(selectedProject?"detail":"list")} className="tap-btn" style={{
          background:"none", border:"none", color:C.gray, cursor:"pointer",
          display:"flex", alignItems:"center", gap:6, padding:"4px 0",
          fontSize:".72rem", fontWeight:700, fontFamily:"Inter,sans-serif",
        }}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>
          {selectedProject ? "Back to Project" : "Back to Projects"}
        </button>

        {/* ── 1. Basic Information ── */}
        <Section title="Basic Information" delay={0}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Name */}
            <div>
              <span style={labelStyle}>Project Name *</span>
              <input value={name} onChange={e=>{setName(e.target.value);setErrors(v=>({...v,name:""}));}}
                placeholder="e.g. Nile Heights Tower"
                style={{...inputBase, borderColor:errors.name?C.red:C.border}}/>
              {errors.name && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Inter,sans-serif"}}>{errors.name}</div>}
            </div>

            {/* Developer */}
            <div>
              <span style={labelStyle}>Developer *</span>
              <input value={developer} onChange={e=>{setDeveloper(e.target.value);setErrors(v=>({...v,developer:""}));}}
                placeholder="e.g. Arabella Developments"
                style={{...inputBase, borderColor:errors.developer?C.red:C.border}}/>
              {errors.developer && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Inter,sans-serif"}}>{errors.developer}</div>}
            </div>

            {/* Location */}
            <div>
              <span style={labelStyle}>Location *</span>
              <input value={location} onChange={e=>{setLocation(e.target.value);setErrors(v=>({...v,location:""}));}}
                placeholder="e.g. New Cairo — 5th Settlement"
                style={{...inputBase, borderColor:errors.location?C.red:C.border}}/>
              {errors.location && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Inter,sans-serif"}}>{errors.location}</div>}
            </div>

            {/* Location Link — Google Maps */}
            <div>
              <span style={labelStyle}>📍 Google Maps Link</span>
              <input value={locationLink} onChange={e=>setLocationLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                style={inputBase}/>
              {locationLink && locationLink.includes("google") && (
                <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                  <a href={locationLink} target="_blank" rel="noopener noreferrer" style={{
                    fontSize:".62rem",color:"#10b981",fontWeight:700,fontFamily:"Inter,sans-serif",
                    textDecoration:"none",display:"flex",alignItems:"center",gap:4,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    ✓ Link verified — tap to preview
                  </a>
                </div>
              )}
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
                      fontFamily:"Inter,sans-serif",
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
                  fontFamily:"Inter,sans-serif",
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
              <span style={{fontSize:".65rem",fontWeight:700,color:C.launch,fontFamily:"Inter,sans-serif"}}>
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
              {errors.price && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Inter,sans-serif"}}>{errors.price}</div>}
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
                {errors.delivery && <div style={{fontSize:".62rem",color:C.red,marginTop:4,fontWeight:700,fontFamily:"Inter,sans-serif"}}>{errors.delivery}</div>}
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
              fontFamily:"Inter,sans-serif",
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
        {/* ✅ P1-3: Added upload buttons alongside URL inputs */}
        <Section title="Media & Branding" delay={200}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Media error */}
            {mediaError && (
              <div style={{
                fontSize: ".62rem", color: C.red, fontWeight: 600,
                background: `${C.red}11`, padding: "6px 8px", borderRadius: 6,
                border: `1px solid ${C.red}33`,
              }}>
                ⚠️ {mediaError}
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={coverImgRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleCoverImageUpload}
            />
            <input
              ref={coverVidRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              style={{ display: "none" }}
              onChange={handleCoverVideoUpload}
            />
            <input
              ref={profileImgRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleProfileImageUpload}
            />

            <div>
              <span style={labelStyle}>Cover Video URL</span>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={coverVideo}
                  onChange={e=>setCoverVideo(e.target.value)}
                  placeholder="https://... (mp4 link)"
                  style={{ ...inputBase, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => coverVidRef.current?.click()}
                  disabled={uploadingCover === "video"}
                  style={{
                    padding: "0 12px", borderRadius: 10, flexShrink: 0,
                    border: `1px solid ${C.border}`, background: C.cardAlt,
                    color: uploadingCover === "video" ? C.gray : C.silver,
                    fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  {uploadingCover === "video" ? "⏳" : "📤 Upload"}
                </button>
              </div>
              <div style={{fontSize:".6rem",color:C.gray,marginTop:4,fontWeight:600,fontFamily:"Inter,sans-serif"}}>
                Direct mp4 link or upload (max 100MB)
              </div>
            </div>
            <div>
              <span style={labelStyle}>Profile Picture URL</span>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={profilePic}
                  onChange={e=>setProfilePic(e.target.value)}
                  placeholder="https://... (image link)"
                  style={{ ...inputBase, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => profileImgRef.current?.click()}
                  disabled={uploadingProfile}
                  style={{
                    padding: "0 12px", borderRadius: 10, flexShrink: 0,
                    border: `1px solid ${C.border}`, background: C.cardAlt,
                    color: uploadingProfile ? C.gray : C.silver,
                    fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  {uploadingProfile ? "⏳" : "📤 Upload"}
                </button>
              </div>
              {(uploadingProfile || uploadingCover === "image") && (
                <div style={{fontSize:".62rem",color:C.amber,marginTop:4,fontWeight:600,fontFamily:"Inter,sans-serif"}}>
                  ⏳ Uploading...
                </div>
              )}
              {profilePic && !uploadingProfile && uploadingCover !== "image" && (
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10}}>
                  <img src={profilePic} alt="preview" style={{width:44,height:44,borderRadius:10,objectFit:"cover",border:`1px solid ${C.border}`}} onError={e=>{e.target.style.display="none";}}/>
                  <div style={{fontSize:".62rem",color:"#10b981",fontWeight:700,fontFamily:"Inter,sans-serif"}}>✓ Preview loaded</div>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── 7. Story Images ── */}
        {/* ✅ P1-3: Added upload buttons for story images */}
        <Section title="Story Images" delay={220}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {stories.map((url,i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  value={url}
                  onChange={e => changeStory(i, e.target.value)}
                  placeholder={`Story image ${i + 1} URL`}
                  style={{ ...inputBase, flex: 1 }}
                />
                <input
                  ref={el => storyImgRefs.current[i] = el}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={e => handleStoryImageUpload(e, i)}
                />
                <button
                  type="button"
                  onClick={() => storyImgRefs.current[i]?.click()}
                  disabled={uploadingStory === i}
                  style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${C.border}`, background: C.cardAlt,
                    color: uploadingStory === i ? C.gray : C.silver,
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: ".8rem",
                  }}
                >
                  {uploadingStory === i ? "⏳" : "📤"}
                </button>
                <button
                  type="button"
                  onClick={() => removeStory(i)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${C.border}`, background: C.cardAlt,
                    color: C.red, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: ".8rem",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addStory} className="tap-btn" style={{
              marginTop:2, padding:"9px", borderRadius:10, border:`1px dashed ${C.border}`,
              background:C.cardAlt, color:C.gray,
              fontSize:".72rem", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              fontFamily:"Inter,sans-serif",
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
                  fontFamily:"Inter,sans-serif",
                }}>
                  {active && <div style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>}
                  {a}
                </div>
              );
            })}
          </div>
          {amenities.length > 0 && (
            <div style={{marginTop:8,fontSize:".62rem",color:C.red,fontWeight:700,fontFamily:"Inter,sans-serif"}}>
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
              fontFamily:"Inter,sans-serif",
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
                <div style={{fontSize:".92rem",fontWeight:800,color:C.white,fontFamily:"Inter,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                {developer && <div style={{fontSize:".65rem",color:C.gray,fontWeight:600,marginTop:2,fontFamily:"Inter,sans-serif"}}>{developer}</div>}
                {location  && <div style={{fontSize:".62rem",color:C.gray,fontWeight:600,marginTop:1,fontFamily:"Inter,sans-serif"}}>📍 {location}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
              <div style={{background:C.cardAlt,border:`1px solid ${C.border}`,color:C.silver,fontSize:".6rem",fontWeight:700,padding:"3px 9px",borderRadius:6,fontFamily:"Inter,sans-serif"}}>{category}</div>
              <div style={{
                background:`${statusMeta.color}20`, border:`1px solid ${statusMeta.color}44`,
                color:statusMeta.color, fontSize:".6rem", fontWeight:800, padding:"3px 9px", borderRadius:6,
                display:"flex", alignItems:"center", gap:4, fontFamily:"Inter,sans-serif",
              }}>
                <div style={{width:5,height:5,borderRadius:"50%",background:statusMeta.color}}/>
                {status}
              </div>
            </div>
          </div>
        )}

        {/* ── Save Button — sticky above nav bar ── */}
        <div style={{
          position:"sticky", bottom:16, zIndex:50,
          paddingTop:4,
        }}>
          <button className="save-btn" onClick={handleSave} disabled={saving} style={{
            width:"100%", padding:"13px", borderRadius:12, border:"none",
            background: saved ? "#10b981" : saving ? C.gray : C.red,
            color:"#fff", fontSize:".88rem", fontWeight:900, cursor: saving ? "not-allowed" : "pointer", letterSpacing:.3,
            boxShadow: saved ? "0 6px 20px rgba(16,185,129,.35)" : `0 6px 20px ${C.red}44`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"background .3s ease, box-shadow .3s ease",
            fontFamily:"Inter,sans-serif",
            opacity: saving ? 0.8 : 1,
          }}>
            {saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>
                Project Saved Successfully!
              </>
            ) : saving ? (
              <>
                <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid #fff",animation:"spin .7s linear infinite"}}/>
                Saving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M219.31,108.68l-80-80A16,16,0,0,0,128,24H48A16,16,0,0,0,32,40v80a16,16,0,0,0,4.69,11.31l80,80a16,16,0,0,0,22.62,0l80-80a16,16,0,0,0,0-22.63ZM128,204.69,51.31,128,48,124.69V40h80l3.31,3.31h0L208,120Z"/></svg>
                {editProject ? "Update Project" : "Save & Publish Project"}
              </>
            )}
          </button>
          <div style={{textAlign:"center",fontSize:".62rem",color:C.gray,fontWeight:600,paddingTop:4,fontFamily:"Inter,sans-serif"}}>
            {editProject ? "Changes will be reflected instantly for all sales agents" : "Project will appear in sales agents' Projects page immediately"}
          </div>
        </div>

      </div>
    </div>
  );
}
