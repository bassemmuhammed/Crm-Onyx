// ── AdminSettings.jsx ─────────────────────────────────────────
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { supabase } from "./lib/supabase";

// ── Toggle ───────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 99, cursor: "pointer", flexShrink: 0,
      background: value ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#e2e8f0",
      position: "relative", transition: "background .25s",
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .25s",
      }} />
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e8eaf6", overflow: "hidden", boxShadow: "0 2px 10px rgba(79,70,229,.05)", marginBottom: 16 }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#4f46e5" }}>{Icons[icon]}</span>
        <span style={{ fontSize: ".78rem", fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: .5 }}>{title}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 12,
  border: "1.5px solid #e8eaf6", outline: "none",
  fontSize: ".85rem", fontWeight: 600, color: "#1e1b4b",
  fontFamily: "Inter,sans-serif", background: "#f8f9ff",
  boxSizing: "border-box",
};



// ── Add Member Modal ─────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, loading }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Sales", phone: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.email.trim() && form.phone.trim();

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(30,27,75,.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", userSelect: "none", WebkitUserSelect: "none" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, padding: "20px 18px 36px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e8eaf6" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: ".9rem", fontWeight: 900, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4f46e5" }}>{Icons.user}</span> Add Team Member
          </div>
          <div onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>{Icons.x}</div>
        </div>

        {[
          { label: "Full Name", key: "name",  type: "text",  ph: "Mohamed Ahmed" },
          { label: "Email",     key: "email", type: "email", ph: "name@company.com" },
          { label: "Phone",     key: "phone", type: "tel",   ph: "010XXXXXXXX" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} style={inputStyle} />
          </div>
        ))}

        {/* Role */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Role</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Senior Sales", "Sales", "Junior Sales"].map(r => (
              <div key={r} onClick={() => set("role", r)} style={{
                flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                background: form.role === r ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#f0f0ff",
                color: form.role === r ? "#fff" : "#4f46e5",
                fontSize: ".63rem", fontWeight: 800, transition: "all .15s",
              }}>{r}</div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ background: "#ede9fe", borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: ".65rem", color: "#4f46e5", fontWeight: 600 }}>
          ✉️ An invite email will be sent so they can set their own password.
        </div>

        <div onClick={valid && !loading ? () => onAdd(form) : undefined} style={{
          padding: "13px 0", borderRadius: 12, textAlign: "center",
          background: valid ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#e2e8f0",
          color: valid ? "#fff" : "#94a3b8",
          fontSize: ".85rem", fontWeight: 800, cursor: valid ? "pointer" : "default",
          boxShadow: valid ? "0 4px 14px rgba(79,70,229,.3)" : "none",
        }}>{loading ? "Sending invite..." : "Send Invite"}</div>
      </div>
    </div>
  );
}

// ── Add Project Modal ────────────────────────────────────────────
function AddProjectModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", location: "", units: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.location.trim();

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(30,27,75,.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", userSelect: "none", WebkitUserSelect: "none" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, padding: "20px 18px 36px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#e8eaf6" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: ".9rem", fontWeight: 900, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4f46e5" }}>{Icons.building}</span> Add Project
          </div>
          <div onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>{Icons.x}</div>
        </div>
        {[
          { label: "Project Name", key: "name",     ph: "Nile Heights" },
          { label: "Location",     key: "location", ph: "New Capital"  },
          { label: "Total Units",  key: "units",    ph: "200"          },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{f.label}</div>
            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} style={inputStyle} />
          </div>
        ))}
        <div onClick={valid ? () => { onAdd(form); onClose(); } : undefined} style={{
          padding: "13px 0", marginTop: 4, borderRadius: 12, textAlign: "center",
          background: valid ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#e2e8f0",
          color: valid ? "#fff" : "#94a3b8",
          fontSize: ".85rem", fontWeight: 800, cursor: valid ? "pointer" : "default",
          boxShadow: valid ? "0 4px 14px rgba(79,70,229,.3)" : "none",
        }}>Add Project</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(30,27,75,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: ".9rem", fontWeight: 800, color: "#1e1b4b", marginBottom: 8 }}>Are you sure?</div>
        <div style={{ fontSize: ".75rem", color: "#94a3b8", marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={onCancel} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "#f1f5f9", color: "#64748b", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", textAlign: "center" }}>Cancel</div>
          <div onClick={onConfirm} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", textAlign: "center" }}>Confirm</div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────
export default function AdminSettings({ onTabChange, onSignOut, onClearLeads }) {
  const [team,           setTeam]           = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [showAddMember,  setShowAddMember]  = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [saved,          setSaved]          = useState("");
  const [addingMember,   setAddingMember]   = useState(false);
  const [confirm,        setConfirm]        = useState(null); // { message, onConfirm }
  const [loadingTeam,    setLoadingTeam]    = useState(true);

  const [settings, setSettings] = useState({
    notifications: true,
    autoAssign:    false,
    facebookSync:  true,
    weeklyReport:  true,
    leadReminders: true,
    soundAlerts:   false,
  });

  const flash = (msg) => { setSaved(msg); setTimeout(() => setSaved(""), 2500); };

  // ── Load team from Supabase ──
  useEffect(() => {
    const fetchTeam = async () => {
      setLoadingTeam(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("role", "owner");
      if (!error && data) setTeam(data.map(u => ({ ...u, active: u.active ?? true, color: u.color || "#4f46e5" })));
      setLoadingTeam(false);
    };
    fetchTeam();
  }, []);

  const toggleSetting = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
    flash("✓ Saved");
  };

  // ── Toggle member active status ──
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
        // Delete from auth + users table
        await supabase.from("users").delete().eq("id", id);
        setTeam(t => t.filter(m => m.id !== id));
        flash("✓ Member removed");
      },
    });
  };

  // ── Add member via invite email ──
  const addMember = async (form) => {
    setAddingMember(true);
    try {
      // Send invite via Edge Function
      const { error: inviteError } = await supabase.functions.invoke("invite-user", {
        body: { email: form.email },
      });

      if (inviteError) {
        flash("✗ " + inviteError.message);
        setAddingMember(false);
        return;
      }

      const colors = ["#4f46e5","#10b981","#f97316","#ec4899","#7c3aed","#0ea5e9"];
      const color = colors[team.length % colors.length];

      // Save user info in users table
      const { error: dbError } = await supabase.from("users").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        color,
        active: true,
      });

      if (dbError) {
        flash("✗ " + dbError.message);
      } else {
        setShowAddMember(false);
        flash("✓ Invite sent to " + form.email);
        // Reload team
        const { data } = await supabase.from("users").select("*").neq("role", "owner");
        if (data) setTeam(data.map(u => ({ ...u, active: u.active ?? true, color: u.color || "#4f46e5" })));
      }
    } catch (e) {
      flash("✗ Something went wrong");
    }
    setAddingMember(false);
  };

  const addProject = (data) => {
    const colors = ["#4f46e5","#10b981","#f97316","#ec4899"];
    setProjects(p => [...p, { id: Date.now(), color: colors[p.length % colors.length], units: parseInt(data.units) || 0, ...data }]);
    flash("✓ Project added");
  };

  const deleteProject = (id) => {
    setProjects(p => p.filter(pr => pr.id !== id));
    flash("✓ Project removed");
  };

  // ── Clear All Leads ──
  const handleClearLeads = () => {
    setConfirm({
      message: "This will permanently delete ALL leads. This cannot be undone.",
      onConfirm: () => {
        setConfirm(null);
        onClearLeads?.();
        flash("✓ All leads cleared");
      },
    });
  };

  // ── Reset System ──
  const handleResetSystem = () => {
    setConfirm({
      message: "This will reset all settings to default values.",
      onConfirm: () => {
        setConfirm(null);
        setSettings({
          notifications: true,
          autoAssign:    false,
          facebookSync:  true,
          weeklyReport:  true,
          leadReminders: true,
          soundAlerts:   false,
        });
        flash("✓ System reset to defaults");
      },
    });
  };

  const TOGGLE_ITEMS = [
    { key: "notifications", label: "Notifications",   sub: "Receive system alerts",         icon: "bell"     },
    { key: "autoAssign",    label: "Auto Assign",      sub: "Distribute leads automatically", icon: "users"    },
    { key: "facebookSync",  label: "Facebook Sync",    sub: "Sync leads from Facebook Ads",  icon: "chart"    },
    { key: "weeklyReport",  label: "Weekly Report",    sub: "Send weekly summary email",      icon: "bar"      },
    { key: "leadReminders", label: "Lead Reminders",   sub: "Callback & meeting reminders",   icon: "calendar" },
    { key: "soundAlerts",   label: "Sound Alerts",     sub: "Play sound on new lead",         icon: "sparkle"  },
  ];

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      style={{ padding: "16px 16px 100px", fontFamily: "'Archivo',sans-serif", userSelect: "none", WebkitUserSelect: "none" }}>

      {/* Modals */}
      {showAddMember  && <AddMemberModal  onClose={() => setShowAddMember(false)}  onAdd={addMember} loading={addingMember} />}
      {showAddProject && <AddProjectModal onClose={() => setShowAddProject(false)} onAdd={addProject} />}
      {confirm        && <ConfirmDialog   message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* Page title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#4f46e5" }}>{Icons.gear}</span> Settings
        </div>
        <div style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: 2 }}>Manage system, team & projects</div>
      </div>

      {/* Flash */}
      {saved && (
        <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: ".78rem", fontWeight: 700, color: "#065f46", textAlign: "center" }}>
          {saved}
        </div>
      )}

      {/* ── System Settings ── */}
      <Section title="System Settings" icon="gear">
        {TOGGLE_ITEMS.map((item, i) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < TOGGLE_ITEMS.length - 1 ? "1px solid #f8f9ff" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", flexShrink: 0 }}>
                {Icons[item.icon]}
              </div>
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b" }}>{item.label}</div>
                <div style={{ fontSize: ".62rem", color: "#94a3b8", marginTop: 1 }}>{item.sub}</div>
              </div>
            </div>
            <Toggle value={settings[item.key]} onChange={() => toggleSetting(item.key)} />
          </div>
        ))}
      </Section>

      {/* ── Team ── */}
      <Section title="Sales Team" icon="users">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: ".7rem", color: "#94a3b8", fontWeight: 600 }}>
            {team.filter(m => m.active).length} active of {team.length}
          </div>
          <div onClick={() => setShowAddMember(true)} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "#fff", padding: "6px 12px", borderRadius: 10,
            fontSize: ".68rem", fontWeight: 800, cursor: "pointer",
            boxShadow: "0 3px 10px rgba(79,70,229,.3)",
          }}>+ Add</div>
        </div>

        {loadingTeam ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: ".75rem", padding: "12px 0" }}>Loading...</div>
        ) : team.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: ".75rem", padding: "12px 0" }}>No team members yet</div>
        ) : team.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < team.length - 1 ? "1px solid #f8f9ff" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {(m.name || "?").charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b" }}>{m.name}</div>
              <div style={{ fontSize: ".62rem", color: "#94a3b8", marginTop: 1 }}>{m.role} · {m.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: ".58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: m.active ? "#d1fae5" : "#f1f5f9", color: m.active ? "#10b981" : "#94a3b8" }}>
                {m.active ? "Active" : "Off"}
              </div>
              <Toggle value={m.active} onChange={() => toggleMember(m.id)} />
              <div onClick={() => deleteMember(m.id)} style={{ width: 26, height: 26, borderRadius: 8, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}>
                {Icons.x}
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* ── Projects ── */}
      <Section title="Projects" icon="building">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: ".7rem", color: "#94a3b8", fontWeight: 600 }}>{projects.length} projects</div>
          <div onClick={() => setShowAddProject(true)} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "#fff", padding: "6px 12px", borderRadius: 10,
            fontSize: ".68rem", fontWeight: 800, cursor: "pointer",
            boxShadow: "0 3px 10px rgba(79,70,229,.3)",
          }}>+ Add</div>
        </div>
        {projects.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < projects.length - 1 ? "1px solid #f8f9ff" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: p.color + "22", border: `1.5px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: p.color, flexShrink: 0 }}>
              {Icons.building}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#1e1b4b" }}>{p.name}</div>
              <div style={{ fontSize: ".62rem", color: "#94a3b8", marginTop: 1 }}>{p.location} · {p.units} units</div>
            </div>
            <div onClick={() => deleteProject(p.id)} style={{ width: 26, height: 26, borderRadius: 8, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}>
              {Icons.x}
            </div>
          </div>
        ))}
      </Section>

      {/* ── Danger Zone ── */}
      <Section title="Danger Zone" icon="flag">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Clear All Leads", sub: "Permanently delete all leads",    color: "#f97316", bg: "#fff7ed", fn: handleClearLeads },
            { label: "Reset System",    sub: "Restore all settings to default", color: "#ef4444", bg: "#fee2e2", fn: handleResetSystem },
          ].map(btn => (
            <div key={btn.label} onClick={btn.fn} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: btn.bg, borderRadius: 12, padding: "12px 14px",
              border: `1px solid ${btn.color}22`, cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 800, color: btn.color }}>{btn.label}</div>
                <div style={{ fontSize: ".62rem", color: btn.color, opacity: .7, marginTop: 1 }}>{btn.sub}</div>
              </div>
              <div style={{ color: btn.color }}>{Icons.caretRight}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Sign Out */}
      <div onClick={() => onSignOut?.()} style={{
        padding: "13px 0", borderRadius: 14, textAlign: "center",
        background: "#fee2e2", border: "1px solid rgba(239,68,68,.2)",
        color: "#ef4444", fontSize: ".88rem", fontWeight: 800,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        marginBottom: 8,
      }}>
        {Icons.signOut} Sign Out
      </div>

      <div style={{ textAlign: "center", fontSize: ".62rem", color: "#c7d2fe", fontWeight: 600 }}>
        ONYX CRM v1.0.0
      </div>
    </div>
  );
}
