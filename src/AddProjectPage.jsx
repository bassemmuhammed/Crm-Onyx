// ── AddProjectPage.jsx ─────────────────────────────────────────
// صفحة إضافة مشروع جديد - ONYX CRM
//
// Features:
//   - Admin يضيف مشروع جديد مع كل التفاصيل
//   - المشروع بيظهر عند السيلز في ProjectsPage بتاعهم
//   - Admin يقدر يعدل المشروع في أي وقت
//   - استدعاء AppHeader + BottomNav + NotificationPanel + ProfileModal
//
// Props:
//   onProjectSaved  {function} - بيتبعت ليها الـ project object بعد الحفظ
//   onTabChange     {function} - للـ BottomNav navigation
//   onSignOut       {function} - للـ ProfileModal
//   editProject     {object|null} - لو بتعدل مشروع موجود بتبعتهوله هنا

import { useState, useRef } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal from "./ProfileModal";
import Icons from "./Icons";

const NoSelect = () => <style>{"* { -webkit-user-select: none !important; user-select: none !important; }"}</style>;


// ─── Static Options ──────────────────────────────────────────
const PROJECT_TYPES = ["سكني", "تجاري", "إداري", "سكني تجاري", "إداري تجاري"];
const STATUS_OPTIONS = [
  { value: "Under Construction", label: "Under Construction", color: "#f97316", bg: "#fff7ed" },
  { value: "Ready to Move",      label: "Ready to Move",      color: "#10b981", bg: "#ecfdf5" },
  { value: "Off Plan",           label: "Off Plan",           color: "#4f46e5", bg: "#ede9fe" },
  { value: "On Hold",            label: "On Hold",            color: "#94a3b8", bg: "#f1f5f9" },
];
const CATEGORIES = ["Residential", "Commercial", "Administrative", "Mixed Use"];
const AMENITY_OPTIONS = [
  "Swimming Pool", "Gym", "Kids Area", "Security 24/7",
  "Underground Parking", "Rooftop Garden", "Club House",
  "Smart Home", "Mall", "Mosque", "Hospital", "School",
];

// ─── Notifications sample ────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, text: "New lead on Nile Heights Tower", time: "2 min ago", color: "#4f46e5", unread: true },
  { id: 2, text: "Project updated by admin",        time: "1 hr ago",  color: "#10b981", unread: false },
];

// ─── Styles ──────────────────────────────────────────────────
const CSS = `
  :root { color-scheme: light only; }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: light; }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  .section-card { animation: fadeInUp .3s ease both; }
  .save-btn { transition: opacity .15s ease, transform .1s ease, box-shadow .15s ease; }
  .save-btn:active { transform: scale(.97); }
  .add-unit-btn:active { transform: scale(.96); }
  .amenity-chip { transition: background .15s ease, color .15s ease, box-shadow .15s ease; }
  .status-opt:active { transform: scale(.97); }
  input, select, textarea { -webkit-appearance: none; appearance: none; }
  ::-webkit-scrollbar { width:0; height:0 }
  input[type=date]::-webkit-calendar-picker-indicator { opacity:.5; cursor:pointer }
`;

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  border: "1.5px solid #e8eaf6",
  outline: "none",
  fontSize: ".85rem",
  fontWeight: 600,
  color: "#1e1b4b",
  fontFamily: "Inter, sans-serif",
  background: "#f8f9ff",
};

const labelStyle = {
  fontSize: ".7rem",
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 6,
  display: "block",
};

// ─── Section Wrapper ─────────────────────────────────────────
function Section({ title, icon, children, delay = 0 }) {
  return (
    <div className="section-card" style={{
      background: "#fff",
      borderRadius: 18,
      padding: "18px 16px",
      border: "1px solid #e8eaf6",
      boxShadow: "0 4px 20px rgba(79,70,229,.06)",
      animationDelay: `${delay}ms`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: ".88rem", fontWeight: 900, color: "#1e1b4b" }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Unit Row ────────────────────────────────────────────────
function UnitRow({ unit, index, onChange, onRemove }) {
  const set = (key, val) => onChange(index, { ...unit, [key]: val });
  return (
    <div style={{
      background: "#f8f9ff", borderRadius: 12, padding: "12px 12px",
      border: "1px solid #e8eaf6", position: "relative",
    }}>
      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 24, height: 24, borderRadius: "50%",
          border: "none", background: "#fee2e2", color: "#ef4444",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}
      >
        {Icons.x}
      </button>
      <div style={{ fontSize: ".7rem", fontWeight: 800, color: "#4f46e5", marginBottom: 10 }}>
        Unit #{index + 1}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <span style={labelStyle}>Type</span>
          <input
            value={unit.type}
            onChange={e => set("type", e.target.value)}
            placeholder="e.g. 2 Bedrooms"
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Size</span>
          <input
            value={unit.size}
            onChange={e => set("size", e.target.value)}
            placeholder="e.g. 140 m²"
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Price</span>
          <input
            value={unit.price}
            onChange={e => set("price", e.target.value)}
            placeholder="e.g. 2.5M EGP"
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Available</span>
          <input
            type="number"
            value={unit.available}
            onChange={e => set("available", Number(e.target.value))}
            placeholder="0"
            style={inputStyle}
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Story URL Row ───────────────────────────────────────────
function StoryRow({ url, index, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        value={url}
        onChange={e => onChange(index, e.target.value)}
        placeholder={`Story image URL #${index + 1}`}
        style={{ ...inputStyle, flex: 1, fontSize: ".78rem" }}
      />
      <button
        onClick={() => onRemove(index)}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: "none", background: "#fee2e2", color: "#ef4444",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {Icons.x}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AddProjectPage({
  onProjectSaved,
  onTabChange,
  onSignOut,
  editProject = null,
  navItems,
  activeTab: activeTabProp,
}) {
  // ── UI State ──
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(NOTIFICATIONS);
  const [activeTab,   setActiveTab]   = useState(activeTabProp ?? 3); // Projects tab
  const [saved,       setSaved]       = useState(false);
  const [errors,      setErrors]      = useState({});

  const unread = notifs.filter(n => n.unread).length;

  // ── Form State (pre-fill if editing) ──
  const init = editProject || {};
  const [name,        setName]        = useState(init.name        || "");
  const [developer,   setDeveloper]   = useState(init.developer   || "");
  const [location,    setLocation]    = useState(init.location     || "");
  const [category,    setCategory]    = useState(init.category    || "Residential");
  const [projectType, setProjectType] = useState(init.projectType || "سكني");
  const [status,      setStatus]      = useState(init.status      || "Under Construction");
  const [price,       setPrice]       = useState(init.price       || "");
  const [area,        setArea]        = useState(init.area        || "");
  const [delivery,    setDelivery]    = useState(init.delivery    || "");
  const [description, setDescription] = useState(init.description || "");
  const [coverVideo,  setCoverVideo]  = useState(init.coverVideo  || "");
  const [profilePic,  setProfilePic]  = useState(init.profilePic  || "");
  const [amenities,   setAmenities]   = useState(init.amenities   || []);
  const [units,       setUnits]       = useState(
    init.units || [{ type: "", size: "", price: "", available: 0 }]
  );
  const [stories,     setStories]     = useState(init.stories     || [""]);

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!name.trim())       e.name       = "Project name is required";
    if (!developer.trim())  e.developer  = "Developer is required";
    if (!location.trim())   e.location   = "Location is required";
    if (!price.trim())      e.price      = "Starting price is required";
    if (!delivery.trim())   e.delivery   = "Delivery date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save Handler ──
  const handleSave = () => {
    if (!validate()) return;

    const currentStatus = STATUS_OPTIONS.find(s => s.value === status);
    const project = {
      id:          editProject?.id || Date.now(),
      name:        name.trim(),
      developer:   developer.trim(),
      location:    location.trim(),
      category,
      projectType,
      status,
      statusColor: currentStatus?.color || "#f97316",
      price:       price.trim(),
      area:        area.trim(),
      delivery:    delivery.trim(),
      description: description.trim(),
      coverVideo:  coverVideo.trim(),
      coverThumb:  null,
      profilePic:  profilePic.trim() || `https://picsum.photos/seed/${Date.now()}/200/200`,
      amenities:   amenities,
      units:       units.filter(u => u.type.trim()),
      stories:     stories.filter(s => s.trim()),
      agent:       editProject?.agent  || { name: "Admin", title: "Manager", phone: "" },
      stats:       editProject?.stats  || { leads: 0, deals: 0 },
    };

    onProjectSaved?.(project);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Tab Change ──
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // ── Amenity Toggle ──
  const toggleAmenity = (a) => {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  // ── Units ──
  const addUnit    = () => setUnits(u => [...u, { type: "", size: "", price: "", available: 0 }]);
  const changeUnit = (i, val) => setUnits(u => u.map((x, idx) => idx === i ? val : x));
  const removeUnit = (i) => setUnits(u => u.filter((_, idx) => idx !== i));

  // ── Stories ──
  const addStory    = () => setStories(s => [...s, ""]);
  const changeStory = (i, val) => setStories(s => s.map((x, idx) => idx === i ? val : x));
  const removeStory = (i) => setStories(s => s.filter((_, idx) => idx !== i));

  // ── Current Status Meta ──
  const statusMeta = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f7ff",
      fontFamily: "Inter, sans-serif",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      paddingBottom: 120,
    }}>
      <NoSelect />
      <style>{CSS}</style>

      {/* ── Header ── */}
      <AppHeader
        unreadCount={unread}
        onBellClick={()    => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ── Page Title ── */}
      <div style={{
        padding: "20px 18px 4px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
          boxShadow: "0 6px 20px rgba(79,70,229,.35)",
        }}>
          {editProject ? Icons.note : Icons.task}
        </div>
        <div>
          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1e1b4b", lineHeight: 1.2 }}>
            {editProject ? "Edit Project" : "Add New Project"}
          </div>
          <div style={{ fontSize: ".72rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>
            {editProject ? "Update project details" : "Fill in the project details below"}
          </div>
        </div>
      </div>

      {/* ── Form Body ── */}
      <div style={{ padding: "16px 18px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── 1. Basic Info ── */}
        <Section title="Basic Information" icon={Icons.building} delay={0}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Name */}
            <div>
              <span style={labelStyle}>Project Name *</span>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: "" })); }}
                placeholder="e.g. Nile Heights Tower"
                style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : "#e8eaf6" }}
              />
              {errors.name && <div style={{ fontSize: ".68rem", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.name}</div>}
            </div>

            {/* Developer */}
            <div>
              <span style={labelStyle}>Developer *</span>
              <input
                value={developer}
                onChange={e => { setDeveloper(e.target.value); setErrors(v => ({ ...v, developer: "" })); }}
                placeholder="e.g. Arabella Developments"
                style={{ ...inputStyle, borderColor: errors.developer ? "#ef4444" : "#e8eaf6" }}
              />
              {errors.developer && <div style={{ fontSize: ".68rem", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.developer}</div>}
            </div>

            {/* Location */}
            <div>
              <span style={labelStyle}>Location *</span>
              <input
                value={location}
                onChange={e => { setLocation(e.target.value); setErrors(v => ({ ...v, location: "" })); }}
                placeholder="e.g. New Cairo — 5th Settlement"
                style={{ ...inputStyle, borderColor: errors.location ? "#ef4444" : "#e8eaf6" }}
              />
              {errors.location && <div style={{ fontSize: ".68rem", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.location}</div>}
            </div>

            {/* Category + Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <span style={labelStyle}>Category</span>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span style={labelStyle}>نوع المشروع</span>
                <select value={projectType} onChange={e => setProjectType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 2. Status ── */}
        <Section title="Project Status" icon={Icons.flag} delay={50}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {STATUS_OPTIONS.map(opt => (
              <div
                key={opt.value}
                className="status-opt"
                onClick={() => setStatus(opt.value)}
                style={{
                  padding: "10px 12px", borderRadius: 12,
                  border: `2px solid ${status === opt.value ? opt.color : "#e8eaf6"}`,
                  background: status === opt.value ? opt.bg : "#f8f9ff",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all .15s ease",
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: opt.color, flexShrink: 0,
                  boxShadow: status === opt.value ? `0 0 6px ${opt.color}88` : "none",
                }} />
                <span style={{
                  fontSize: ".72rem", fontWeight: 800,
                  color: status === opt.value ? opt.color : "#94a3b8",
                }}>
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. Pricing & Details ── */}
        <Section title="Pricing & Details" icon={Icons.currency} delay={100}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={labelStyle}>Starting Price *</span>
              <input
                value={price}
                onChange={e => { setPrice(e.target.value); setErrors(v => ({ ...v, price: "" })); }}
                placeholder="e.g. Starting from 2,500,000 EGP"
                style={{ ...inputStyle, borderColor: errors.price ? "#ef4444" : "#e8eaf6" }}
              />
              {errors.price && <div style={{ fontSize: ".68rem", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.price}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <span style={labelStyle}>Unit Size Range</span>
                <input
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="e.g. 120 – 320 m²"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Delivery Date *</span>
                <input
                  value={delivery}
                  onChange={e => { setDelivery(e.target.value); setErrors(v => ({ ...v, delivery: "" })); }}
                  placeholder="e.g. Q4 2027"
                  style={{ ...inputStyle, borderColor: errors.delivery ? "#ef4444" : "#e8eaf6" }}
                />
                {errors.delivery && <div style={{ fontSize: ".68rem", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.delivery}</div>}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 4. Description ── */}
        <Section title="Project Description" icon={Icons.note} delay={150}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="اكتب وصف تفصيلي للمشروع هنا..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "none",
              lineHeight: 1.6,
              fontFamily: "Inter, sans-serif",
            }}
          />
        </Section>

        {/* ── 5. Media ── */}
        <Section title="Media & Branding" icon={Icons.sparkle} delay={200}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={labelStyle}>Cover Video URL</span>
              <input
                value={coverVideo}
                onChange={e => setCoverVideo(e.target.value)}
                placeholder="https://... (mp4 link)"
                style={inputStyle}
              />
              <div style={{ fontSize: ".65rem", color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>
                Paste a direct mp4 link (e.g. Google Drive, CDN)
              </div>
            </div>
            <div>
              <span style={labelStyle}>Project Profile Picture URL</span>
              <input
                value={profilePic}
                onChange={e => setProfilePic(e.target.value)}
                placeholder="https://... (image link)"
                style={inputStyle}
              />
              {profilePic && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src={profilePic}
                    alt="preview"
                    style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border: "2px solid #e8eaf6" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ fontSize: ".68rem", color: "#10b981", fontWeight: 700 }}>✓ Preview loaded</div>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── 6. Stories ── */}
        <Section title="Story Images" icon={Icons.sparkle} delay={220}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stories.map((url, i) => (
              <StoryRow key={i} url={url} index={i} onChange={changeStory} onRemove={removeStory} />
            ))}
            <button
              onClick={addStory}
              className="add-unit-btn"
              style={{
                marginTop: 4, padding: "10px",
                borderRadius: 12, border: "2px dashed #c7d2fe",
                background: "#f5f3ff", color: "#4f46e5",
                fontSize: ".78rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: "1rem" }}>+</span> Add Story Image
            </button>
          </div>
        </Section>

        {/* ── 7. Amenities ── */}
        <Section title="Facilities & Amenities" icon={Icons.building} delay={250}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {AMENITY_OPTIONS.map(a => {
              const active = amenities.includes(a);
              return (
                <div
                  key={a}
                  className="amenity-chip"
                  onClick={() => toggleAmenity(a)}
                  style={{
                    padding: "6px 13px", borderRadius: 99,
                    border: `1.5px solid ${active ? "#4f46e5" : "#e8eaf6"}`,
                    background: active ? "#ede9fe" : "#f8f9ff",
                    color: active ? "#4f46e5" : "#94a3b8",
                    fontSize: ".72rem", fontWeight: 700, cursor: "pointer",
                    boxShadow: active ? "0 2px 8px rgba(79,70,229,.15)" : "none",
                  }}
                >
                  {active && <span style={{ marginRight: 4 }}>✓</span>}
                  {a}
                </div>
              );
            })}
          </div>
          {amenities.length > 0 && (
            <div style={{
              marginTop: 10, fontSize: ".68rem", color: "#4f46e5", fontWeight: 700,
            }}>
              {amenities.length} amenit{amenities.length === 1 ? "y" : "ies"} selected
            </div>
          )}
        </Section>

        {/* ── 8. Units ── */}
        <Section title="Available Units" icon={Icons.task} delay={300}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {units.map((unit, i) => (
              <UnitRow key={i} unit={unit} index={i} onChange={changeUnit} onRemove={removeUnit} />
            ))}
            <button
              onClick={addUnit}
              className="add-unit-btn"
              style={{
                padding: "10px",
                borderRadius: 12, border: "2px dashed #c7d2fe",
                background: "#f5f3ff", color: "#4f46e5",
                fontSize: ".78rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: "1rem" }}>+</span> Add Unit Type
            </button>
          </div>
        </Section>

        {/* ── Preview Card ── */}
        {name && (
          <div className="section-card" style={{
            background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
            borderRadius: 18, padding: "16px",
            boxShadow: "0 8px 32px rgba(79,70,229,.3)",
            animationDelay: "350ms",
          }}>
            <div style={{ fontSize: ".65rem", fontWeight: 800, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Preview
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {profilePic ? (
                <img src={profilePic} alt="logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border: "2px solid rgba(255,255,255,.3)" }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {Icons.building}
                </div>
              )}
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: "#fff" }}>{name}</div>
                {developer && <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.7)", fontWeight: 600, marginTop: 2 }}>{developer}</div>}
                {location  && <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.55)", fontWeight: 600, marginTop: 1 }}>📍 {location}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,.18)", color: "#fff", fontSize: ".63rem", fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>{category}</div>
              <div style={{ background: "rgba(255,255,255,.18)", color: "#fff", fontSize: ".63rem", fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>{projectType}</div>
              <div style={{
                background: statusMeta.bg, color: statusMeta.color,
                fontSize: ".63rem", fontWeight: 800, padding: "4px 10px", borderRadius: 99,
              }}>{status}</div>
            </div>
          </div>
        )}

        {/* ── Save Button ── */}
        <button
          className="save-btn"
          onClick={handleSave}
          style={{
            width: "100%", padding: "16px",
            borderRadius: 16, border: "none",
            background: saved
              ? "linear-gradient(135deg,#10b981 0%,#059669 100%)"
              : "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
            color: "#fff",
            fontSize: "1rem", fontWeight: 900,
            cursor: "pointer", letterSpacing: 0.3,
            boxShadow: saved
              ? "0 8px 28px rgba(16,185,129,.35)"
              : "0 8px 28px rgba(79,70,229,.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background .3s ease, box-shadow .3s ease",
          }}
        >
          {saved ? (
            <>
              <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
              </svg>
              Project Saved Successfully!
            </>
          ) : (
            <>
              {Icons.task}
              {editProject ? "Update Project" : "Save & Publish Project"}
            </>
          )}
        </button>

        {/* Hint */}
        <div style={{
          textAlign: "center", fontSize: ".68rem",
          color: "#94a3b8", fontWeight: 600, paddingBottom: 4,
        }}>
          {editProject
            ? "Changes will be reflected instantly for all sales agents"
            : "Project will appear in sales agents' Projects page immediately"}
        </div>

      </div>{/* end form */}

      {/* ── Modals & Panels ── */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={() => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))}
      />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSignOut={onSignOut}
      />

      {/* ── Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} items={navItems} />
    </div>
  );
}
