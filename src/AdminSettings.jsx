// ── AdminSettings.jsx — ONYX Design System ──────────────────────
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { supabase } from "./lib/supabase";

// ─── ONYX Design Tokens ───────────────────────────────────────────
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
  green:     "#10b981",
};

// ─── Global Styles ────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap";
const STYLES = `
  @import url('${FONT_URL}');
  :root { color-scheme: dark only; }
  html, body { margin:0; padding:0; background:#0A0A0A; }
  *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; color-scheme: dark; -webkit-user-select: none; user-select: none; }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  .section-card { animation: fadeInUp .3s ease both; }
  .tap-btn { transition: all .15s ease; }
  .tap-btn:active { transform: scale(.95); opacity:.85; }
  input, select, textarea { -webkit-user-select: text !important; user-select: text !important; -webkit-appearance: none; appearance: none; }
  ::-webkit-scrollbar { width:3px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#CC1515; border-radius:99px }
`;

// ─── Input Style ──────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, outline: "none",
  fontSize: ".82rem", fontWeight: 600, color: C.white,
  fontFamily: "Archivo, sans-serif", background: C.cardAlt,
  boxSizing: "border-box",
};

// ─── Label Style ──────────────────────────────────────────────────
const labelStyle = {
  fontSize: ".6rem", fontWeight: 700, color: C.gray,
  textTransform: "uppercase", letterSpacing: 0.6,
  marginBottom: 5, display: "block", fontFamily: "Archivo, sans-serif",
};

// ─── Toggle ───────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 99, cursor: "pointer", flexShrink: 0,
        background: value ? C.red : C.cardAlt,
        border: `1px solid ${value ? C.red : C.border}`,
        position: "relative", transition: "background .25s, border-color .25s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: C.white,
        boxShadow: "0 1px 4px rgba(0,0,0,.4)", transition: "left .25s",
      }} />
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────
function Section({ title, icon, children, delay = 0 }) {
  return (
    <div
      className="section-card"
      style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`,
        overflow: "hidden", marginBottom: 12,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        padding: "10px 14px 8px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
        <span style={{ fontSize: ".72rem", fontWeight: 800, color: C.silver, fontFamily: "Archivo,sans-serif", textTransform: "uppercase", letterSpacing: .6 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, loading }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Sales", phone: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.email.trim() && form.phone.trim();

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        userSelect: "none", WebkitUserSelect: "none",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.card, borderRadius: "20px 20px 0 0", width: "100%",
        maxWidth: 430, padding: "20px 18px 40px",
        border: `1px solid ${C.border}`, borderBottom: "none",
      }}>
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: C.border }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: ".9rem", fontWeight: 900, color: C.white, fontFamily: "Archivo,sans-serif" }}>
            Add Team Member
          </div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: C.white, fontSize: "1rem", fontWeight: 700, padding: "4px 8px" }}
          >✕</div>
        </div>

        {/* Fields */}
        {[
          { label: "Full Name", key: "name",  type: "text",  ph: "Mohamed Ahmed" },
          { label: "Email",     key: "email", type: "email", ph: "name@company.com" },
          { label: "Phone",     key: "phone", type: "tel",   ph: "010XXXXXXXX" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <span style={labelStyle}>{f.label}</span>
            <input
              type={f.type} value={form[f.key]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.ph} style={inputStyle}
            />
          </div>
        ))}

        {/* Role */}
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>Role</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["Senior Sales", "Sales", "Junior Sales"].map(r => (
              <div
                key={r} onClick={() => set("role", r)}
                style={{
                  flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                  background: form.role === r ? C.red : C.cardAlt,
                  border: `1px solid ${form.role === r ? C.red : C.border}`,
                  color: form.role === r ? C.white : C.gray,
                  fontSize: ".63rem", fontWeight: 800, transition: "all .15s",
                  fontFamily: "Archivo,sans-serif",
                }}
              >{r}</div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: `${C.blue}18`, border: `1px solid ${C.blue}33`,
          borderRadius: 10, padding: "8px 12px", marginBottom: 16,
          fontSize: ".65rem", color: C.silver, fontWeight: 600,
          fontFamily: "Archivo,sans-serif",
        }}>
          ✉️ An invite email will be sent so they can set their own password.
        </div>

        {/* Submit */}
        <div
          onClick={valid && !loading ? () => onAdd(form) : undefined}
          className={valid ? "tap-btn" : ""}
          style={{
            padding: "13px 0", borderRadius: 12, textAlign: "center",
            background: valid ? C.red : C.cardAlt,
            border: `1px solid ${valid ? C.red : C.border}`,
            color: valid ? C.white : C.gray,
            fontSize: ".85rem", fontWeight: 800, cursor: valid ? "pointer" : "default",
            fontFamily: "Archivo,sans-serif",
            boxShadow: valid ? `0 4px 20px ${C.red}44` : "none",
          }}
        >{loading ? "Sending invite..." : "Send Invite"}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderTop: `3px solid ${C.red}`,
        borderRadius: 20, padding: "24px 20px",
        width: "100%", maxWidth: 320, textAlign: "center",
      }}>
        <div style={{ fontSize: ".9rem", fontWeight: 800, color: C.white, marginBottom: 8, fontFamily: "Archivo,sans-serif" }}>
          Are you sure?
        </div>
        <div style={{ fontSize: ".75rem", color: C.gray, marginBottom: 20, fontFamily: "Archivo,sans-serif" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div
            onClick={onCancel}
            className="tap-btn"
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              background: C.cardAlt, border: `1px solid ${C.border}`,
              color: C.silver, fontWeight: 700, fontSize: ".8rem",
              cursor: "pointer", textAlign: "center", fontFamily: "Archivo,sans-serif",
            }}
          >Cancel</div>
          <div
            onClick={onConfirm}
            className="tap-btn"
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              background: C.red, border: `1px solid ${C.red}`,
              color: C.white, fontWeight: 700, fontSize: ".8rem",
              cursor: "pointer", textAlign: "center", fontFamily: "Archivo,sans-serif",
              boxShadow: `0 4px 14px ${C.red}44`,
            }}
          >Confirm</div>
        </div>
      </div>
    </div>
  );
}

// ─── Auto-Distribute Logic ────────────────────────────────────────
// Distributes leads round-robin to active team members
export async function distributeLeadsToTeam() {
  // 1. Fetch all leads (distribute all, round-robin)
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("id");

  if (leadsErr || !leads?.length) return { distributed: 0 };

  // 2. Fetch active sales members (not owner)
  const { data: members, error: membersErr } = await supabase
    .from("users")
    .select("id")
    .neq("role", "owner")
    .eq("active", true);

  if (membersErr || !members?.length) return { distributed: 0 };

  // 3. Round-robin assignment — column name matches sharedLeadsData: "assignedTo"
  const updates = leads.map((lead, i) => ({
    id: lead.id,
    assignedTo: members[i % members.length].id,
  }));

  // 4. Batch upsert
  const { error: updateErr } = await supabase
    .from("leads")
    .upsert(updates, { onConflict: "id" });

  if (updateErr) throw updateErr;
  return { distributed: updates.length };
}

// ─── Settings Defaults (outside component) ───────────────────────
const SETTINGS_DEFAULTS = {
  notifications:  true,
  autoDistribute: false,
  facebookSync:   true,
  weeklyReport:   true,
  leadReminders:  true,
  soundAlerts:    false,
};

// ─── MAIN ─────────────────────────────────────────────────────────
export default function AdminSettings({ onTabChange, onSignOut }) {
  const [team,           setTeam]           = useState([]);
  const [showAddMember,  setShowAddMember]  = useState(false);
  const [saved,          setSaved]          = useState("");
  const [addingMember,   setAddingMember]   = useState(false);
  const [confirm,        setConfirm]        = useState(null);
  const [loadingTeam,    setLoadingTeam]    = useState(true);
  const [distributing,   setDistributing]   = useState(false);

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("onyx_settings");
      return stored ? { ...SETTINGS_DEFAULTS, ...JSON.parse(stored) } : SETTINGS_DEFAULTS;
    } catch { return SETTINGS_DEFAULTS; }
  });

  const flash = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 2500); };

  // ── Persist settings to localStorage ──
  useEffect(() => {
    try { localStorage.setItem("onyx_settings", JSON.stringify(settings)); } catch {}
  }, [settings]);

  // ── Toggle setting — with distribute logic ──
  const toggleSetting = async (key) => {
    const newVal = !settings[key];
    const updated = { ...settings, [key]: newVal };
    setSettings(updated);
    try { localStorage.setItem("onyx_settings", JSON.stringify(updated)); } catch {}

    if (key === "autoDistribute" && newVal) {
      setDistributing(true);
      try {
        const { distributed } = await distributeLeadsToTeam();
        flash(distributed > 0
          ? `✓ ${distributed} lead${distributed !== 1 ? "s" : ""} distributed to team`
          : "✓ Auto Distribute enabled — all leads already assigned"
        );
      } catch (e) {
        flash("✗ " + (e?.message || "Distribution failed"));
        const reverted = { ...updated, [key]: false };
        setSettings(reverted);
        try { localStorage.setItem("onyx_settings", JSON.stringify(reverted)); } catch {}
      }
      setDistributing(false);
    } else {
      flash("✓ Saved");
    }
  };
  // ── Load team ──
  useEffect(() => {
    const fetchTeam = async () => {
      setLoadingTeam(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("role", "owner");
      if (!error && data)
        setTeam(data.map(u => ({ ...u, active: u.active ?? true, color: u.color || C.red })));
      setLoadingTeam(false);
    };
    fetchTeam();
  }, []);

  // ── Toggle member active ──
  const toggleMember = async (id) => {
    const member = team.find(m => m.id === id);
    const newActive = !member.active;
    setTeam(t => t.map(m => m.id === id ? { ...m, active: newActive } : m));
    await supabase.from("users").update({ active: newActive }).eq("id", id);
    flash("✓ Member status updated");
  };

  // ── Delete member ──
  const deleteMember = (id) => {
    setConfirm({
      message: "This will permanently delete this team member.",
      onConfirm: async () => {
        setConfirm(null);
        await supabase.from("users").delete().eq("id", id);
        setTeam(t => t.filter(m => m.id !== id));
        flash("✓ Member removed");
      },
    });
  };

  // ── Add member via invite ──
  const addMember = async (form) => {
    setAddingMember(true);
    try {
      const { error: inviteError } = await supabase.functions.invoke("invite-user", {
        body: { email: form.email },
      });

      if (inviteError) {
        flash("✗ " + inviteError.message);
        setAddingMember(false);
        return;
      }

      const colors = [C.red, C.green, "#f97316", "#ec4899", C.blue, "#0ea5e9"];
      const color = colors[team.length % colors.length];

      const { error: dbError } = await supabase.from("users").insert({
        name: form.name, email: form.email,
        phone: form.phone, role: form.role,
        color, active: true,
      });

      if (dbError) {
        flash("✗ " + dbError.message);
      } else {
        setShowAddMember(false);
        flash("✓ Invite sent to " + form.email);
        const { data } = await supabase.from("users").select("*").neq("role", "owner");
        if (data) setTeam(data.map(u => ({ ...u, active: u.active ?? true, color: u.color || C.red })));
      }
    } catch {
      flash("✗ Something went wrong");
    }
    setAddingMember(false);
  };

  // ── Reset System ──
  const handleResetSystem = () => {
    setConfirm({
      message: "This will reset all settings to default values.",
      onConfirm: () => {
        setConfirm(null);
        const defaults = {
          notifications:  true,
          autoDistribute: false,
          facebookSync:   true,
          weeklyReport:   true,
          leadReminders:  true,
          soundAlerts:    false,
        };
        setSettings(defaults);
        try { localStorage.setItem("onyx_settings", JSON.stringify(defaults)); } catch {}
        flash("✓ System reset to defaults");
      },
    });
  };

  const TOGGLE_ITEMS = [
    {
      key:   "notifications",
      label: "Notifications",
      sub:   "Receive system alerts",
      icon:  "bell",
    },
    {
      key:   "autoDistribute",
      label: "Auto Distribute Leads",
      sub:   distributing ? "Distributing now…" : "Assign new leads automatically to active agents",
      icon:  "users",
      badge: settings.autoDistribute ? "ON" : null,
    },
    {
      key:   "facebookSync",
      label: "Facebook Sync",
      sub:   "Sync leads from Facebook Ads",
      icon:  "chart",
    },
    {
      key:   "weeklyReport",
      label: "Weekly Report",
      sub:   "Send weekly summary email",
      icon:  "bar",
    },
    {
      key:   "leadReminders",
      label: "Lead Reminders",
      sub:   "Callback & meeting reminders",
      icon:  "calendar",
    },
    {
      key:   "soundAlerts",
      label: "Sound Alerts",
      sub:   "Play sound on new lead",
      icon:  "sparkle",
    },
  ];

  const activeCount  = team.filter(m => m.active).length;
  const inactiveCount = team.length - activeCount;

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      style={{
        padding: "16px 16px 100px",
        fontFamily: "Archivo, sans-serif",
        background: C.surface,
        minHeight: "100vh",
        userSelect: "none", WebkitUserSelect: "none",
      }}
    >
      <style>{STYLES}</style>

      {/* Modals */}
      {showAddMember  && <AddMemberModal  onClose={() => setShowAddMember(false)}  onAdd={addMember} loading={addingMember} />}
          {confirm        && <ConfirmDialog   message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* Page title */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: C.white, display: "flex", alignItems: "center", gap: 8, fontFamily: "Archivo,sans-serif" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
          Settings
        </div>
        <div style={{ fontSize: ".72rem", color: C.gray, marginTop: 3, fontFamily: "Archivo,sans-serif" }}>
          Manage system, team & projects
        </div>
      </div>

      {/* Flash message */}
      {saved && (
        <div style={{
          background: saved.startsWith("✗") ? `${C.red}18` : `${C.green}18`,
          border: `1px solid ${saved.startsWith("✗") ? C.red + "44" : C.green + "44"}`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 14,
          fontSize: ".78rem", fontWeight: 700,
          color: saved.startsWith("✗") ? C.redLight : C.green,
          textAlign: "center", fontFamily: "Archivo,sans-serif",
        }}>
          {saved}
        </div>
      )}

      {/* ── System Settings ── */}
      <Section title="System Settings" icon="gear" delay={0}>
        {TOGGLE_ITEMS.map((item, i) => (
          <div
            key={item.key}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 0",
              borderBottom: i < TOGGLE_ITEMS.length - 1 ? `1px solid ${C.border}` : "none",
              opacity: distributing && item.key === "autoDistribute" ? .7 : 1,
              transition: "opacity .2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              {/* Icon box */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: item.key === "autoDistribute" && settings.autoDistribute
                  ? `${C.red}18` : C.cardAlt,
                border: `1px solid ${item.key === "autoDistribute" && settings.autoDistribute ? C.red + "44" : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: item.key === "autoDistribute" && settings.autoDistribute ? C.red : C.gray,
                flexShrink: 0, transition: "all .25s",
              }}>
                {Icons[item.icon]}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 800, color: C.white, fontFamily: "Archivo,sans-serif" }}>
                    {item.label}
                  </div>
                  {/* Active badge for autoDistribute */}
                  {item.badge && (
                    <div style={{
                      fontSize: ".5rem", fontWeight: 900, padding: "2px 6px",
                      borderRadius: 99, background: C.red, color: C.white,
                      fontFamily: "Archivo,sans-serif", letterSpacing: .5,
                    }}>{item.badge}</div>
                  )}
                </div>
                <div style={{ fontSize: ".62rem", color: C.gray, marginTop: 1, fontFamily: "Archivo,sans-serif" }}>
                  {item.sub}
                </div>
              </div>
            </div>

            <Toggle
              value={settings[item.key]}
              onChange={() => !distributing && toggleSetting(item.key)}
            />
          </div>
        ))}

        {/* Auto Distribute info banner — shows when enabled */}
        {settings.autoDistribute && (
          <div style={{
            marginTop: 8, background: `${C.red}10`, border: `1px solid ${C.red}33`,
            borderRadius: 10, padding: "8px 12px",
            fontSize: ".65rem", color: C.silver, fontWeight: 600,
            fontFamily: "Archivo,sans-serif", lineHeight: 1.5,
          }}>
            🔄 Auto Distribute is <span style={{ color: C.red, fontWeight: 800 }}>active</span> — new leads will be round-robined across {activeCount} active agent{activeCount !== 1 ? "s" : ""}{inactiveCount > 0 ? ` (${inactiveCount} inactive excluded)` : ""}.
          </div>
        )}
      </Section>

      {/* ── Sales Team ── */}
      <Section title="Sales Team" icon="users" delay={60}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: ".7rem", color: C.gray, fontWeight: 600, fontFamily: "Archivo,sans-serif" }}>
            {activeCount} active · {inactiveCount} inactive
          </div>
          <div
            onClick={() => setShowAddMember(true)}
            className="tap-btn"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: C.red, border: `1px solid ${C.red}`,
              color: C.white, padding: "6px 14px", borderRadius: 10,
              fontSize: ".68rem", fontWeight: 800, cursor: "pointer",
              fontFamily: "Archivo,sans-serif",
              boxShadow: `0 3px 12px ${C.red}44`,
            }}
          >+ Add</div>
        </div>

        {loadingTeam ? (
          <div style={{ textAlign: "center", color: C.gray, fontSize: ".75rem", padding: "12px 0", fontFamily: "Archivo,sans-serif" }}>
            Loading…
          </div>
        ) : team.length === 0 ? (
          <div style={{ textAlign: "center", color: C.gray, fontSize: ".75rem", padding: "12px 0", fontFamily: "Archivo,sans-serif" }}>
            No team members yet
          </div>
        ) : team.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: i < team.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: C.black, border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: ".8rem", fontWeight: 900,
              color: C.white, flexShrink: 0, fontFamily: "Archivo,sans-serif",
            }}>
              {(m.name || "?").charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 800, color: C.white, fontFamily: "Archivo,sans-serif" }}>
                {m.name}
              </div>
              <div style={{ fontSize: ".62rem", color: C.gray, marginTop: 1, fontFamily: "Archivo,sans-serif" }}>
                {m.role} · {m.email}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                fontSize: ".58rem", fontWeight: 700, padding: "2px 8px",
                borderRadius: 99,
                background: m.active ? `${C.green}18` : C.cardAlt,
                border: `1px solid ${m.active ? C.green + "44" : C.border}`,
                color: m.active ? C.green : C.gray,
                fontFamily: "Archivo,sans-serif",
              }}>
                {m.active ? "Active" : "Off"}
              </div>
              <Toggle value={m.active} onChange={() => toggleMember(m.id)} />
              <div
                onClick={() => deleteMember(m.id)}
                className="tap-btn"
                style={{ cursor: "pointer", color: C.white, fontSize: ".9rem", fontWeight: 700, padding: "4px 6px" }}
              >✕</div>
            </div>
          </div>
        ))}
      </Section>

      {/* ── Danger Zone ── */}
      <Section title="Danger Zone" icon="flag" delay={180}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Reset System only — Delete Leads removed */}
          <div
            onClick={handleResetSystem}
            className="tap-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: C.cardAlt, borderRadius: 12, padding: "12px 14px",
              border: `1px solid ${C.border}`, cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontSize: ".78rem", fontWeight: 800, color: C.white, fontFamily: "Archivo,sans-serif" }}>
                Reset System
              </div>
              <div style={{ fontSize: ".62rem", color: C.gray, marginTop: 1, fontFamily: "Archivo,sans-serif" }}>
                Restore all settings to default
              </div>
            </div>
            <div style={{ color: C.gray, fontSize: ".8rem" }}>›</div>
          </div>
        </div>
      </Section>

      {/* ── Sign Out ── */}
      <div
        onClick={() => onSignOut?.()}
        className="tap-btn"
        style={{
          padding: "13px 0", borderRadius: 14, textAlign: "center",
          background: C.cardAlt, border: `1px solid ${C.border}`,
          color: C.white, fontSize: ".88rem", fontWeight: 800,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, marginBottom: 10,
          fontFamily: "Archivo,sans-serif",
        }}
      >
        {Icons.signOut} Sign Out
      </div>

      <div style={{ textAlign: "center", fontSize: ".62rem", color: C.gray, fontWeight: 600, fontFamily: "Archivo,sans-serif" }}>
        ONYX CRM v1.0.0
      </div>
    </div>
  );
}
