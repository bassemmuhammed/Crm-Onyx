// ── AdminCommissionsPage.jsx ───────────────────────────────────────
// P0-6: شاشة العمولات للأدمن (مطابقة AdminCommissionsScreen في Flutter)
// بسيطة من ناحية التصميم (مطابقة لأسلوب React الحالي)
//
// الميزات:
//   - Dashboard: stat cards (Deals Closed, Overdue, Total Commission, Company Share, Collected, Pending)
//   - Filter chips (All / Pending / Collected)
//   - Per-agent reports section
//   - Commission list مع mark-collected / mark-pending / edit / delete
//   - Add Commission FAB → opens _CommissionEditSheet (modal bottom sheet)

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { C } from "./theme";
import { supabase } from "./lib/supabase";
import {  fetchAllCommissions,
  insertCommission,
  updateCommission,
  markCommissionCollected,
  markCommissionPending,
  deleteCommission,
  fetchSalesAgents,
  getAdminStats,
  getPerAgentReports,
  calculateCommissionAmounts,
  formatNumber,
  getCollectionCountdown,
} from "./commissionsData";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all"); // all / pending / collected
  const [showAdd, setShowAdd]         = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [commissionsData, agentsData] = await Promise.all([
      fetchAllCommissions(),
      fetchSalesAgents(),
    ]);
    setCommissions(commissionsData);
    setAgents(agentsData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Realtime subscription لجدول commissions ──
  useEffect(() => {
    const ch = supabase
      .channel("commissions-realtime-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  // ── Handlers ──
  const handleAdd = async (formData) => {
    const result = await insertCommission(formData);
    if (result) {
      setShowAdd(false);
      await load();
    }
  };

  const handleUpdate = async (id, formData) => {
    const result = await updateCommission(id, formData);
    if (result) {
      setEditing(null);
      await load();
    }
  };

  const handleMarkCollected = async (id) => {
    await markCommissionCollected(id);
    await load();
  };

  const handleMarkPending = async (id) => {
    await markCommissionPending(id);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCommission(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  };

  // ── Derived ──
  const stats = getAdminStats(commissions);
  const perAgent = getPerAgentReports(commissions, agents);

  const filtered = commissions.filter(c => {
    if (filter === "all") return true;
    return c.collection_status === filter;
  });

  // ── UI ──
  return (
    <div style={{
      fontFamily: "Inter, sans-serif",
      background: "transparent",
      color: C.white,
      colorScheme: "dark",
      userSelect: "none",
      WebkitUserSelect: "none",
      minHeight: "100%",
      paddingBottom: 100,
    }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* ── Stat Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
        padding: "12px 14px",
      }}>
        <StatCard label="Deals Closed"  value={stats.totalDealsClosed}     color={C.blue} />
        <StatCard label="Overdue"        value={stats.overdueCount}        color={C.red} />
        <StatCard label="Total Commission" value={formatNumber(stats.totalCommissionAmount)} color={C.green} prefix="EGP " />
        <StatCard label="Company Share"  value={formatNumber(stats.totalCompanyShare)} color={C.amber} prefix="EGP " />
        <StatCard label="Collected"      value={formatNumber(stats.totalCollectedFull)} color={C.green} prefix="EGP " />
        <StatCard label="Pending"        value={formatNumber(stats.totalPendingFull)}   color={C.orange} prefix="EGP " />
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 12px", flexWrap: "wrap" }}>
        {[
          { value: "all",       label: `All (${commissions.length})` },
          { value: "pending",   label: `Pending (${commissions.filter(c => c.collection_status === "pending").length})` },
          { value: "collected", label: `Collected (${commissions.filter(c => c.collection_status === "collected").length})` },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "5px 10px", borderRadius: 6,
              border: filter === opt.value ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
              background: filter === opt.value ? `${C.red}15` : C.cardAlt,
              color: filter === opt.value ? C.white : C.gray,
              fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Per-agent reports ── */}
      {perAgent.length > 0 && (
        <div style={{ padding: "0 14px 16px" }}>
          <div style={{
            fontSize: ".72rem", fontWeight: 800, color: C.silver,
            marginBottom: 8, textTransform: "uppercase",
          }}>
            Agent Performance
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {perAgent.map((a, i) => (
              <div key={a.agentId} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${i === 0 ? C.amber : i === 1 ? C.silver : i === 2 ? "#cd7f32" : C.border}`,
                borderRadius: 10, padding: "10px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.white }}>
                    #{i + 1} {a.agentName}
                  </div>
                  <div style={{ fontSize: ".6rem", color: C.gray, marginTop: 2 }}>
                    {a.dealCount} deals · {a.overdueCount} overdue
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.green }}>
                    EGP {formatNumber(a.totalCommission)}
                  </div>
                  <div style={{ fontSize: ".6rem", color: C.gray }}>
                    {formatNumber(a.totalCollected)} collected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Commission list ── */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: ".82rem", animation: "pulse 1.5s ease infinite" }}>
            Loading commissions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: ".82rem" }}>
            No commissions found
          </div>
        ) : filtered.map(c => {
          const countdown = getCollectionCountdown(c.expected_collection_date, c.collection_status);
          const agent = agents.find(a => a.id === c.assigned_sales_agent);
          return (
            <div key={c.id} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${c.collection_status === "collected" ? C.green : countdown.color}`,
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.white }}>
                    {c.client_name || "Unknown Client"}
                  </div>
                  <div style={{ fontSize: ".65rem", color: C.gray, marginTop: 2 }}>
                    {c.company_name || "—"} · {c.property_name || "—"}
                  </div>
                  <div style={{ fontSize: ".62rem", color: C.silver, marginTop: 4 }}>
                    Agent: {agent?.name || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.green }}>
                    EGP {formatNumber(c.commission_amount)}
                  </div>
                  <div style={{
                    fontSize: ".6rem", fontWeight: 600,
                    color: c.collection_status === "collected" ? C.green : countdown.color,
                    marginTop: 2,
                  }}>
                    {countdown.label}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                {c.collection_status === "pending" ? (
                  <button onClick={() => handleMarkCollected(c.id)} style={btnStyle(C.green)}>
                    Mark Collected
                  </button>
                ) : (
                  <button onClick={() => handleMarkPending(c.id)} style={btnStyle(C.amber)}>
                    Mark Pending
                  </button>
                )}
                <button onClick={() => setEditing(c)} style={btnStyle(C.blue)}>
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(c)} style={btnStyle(C.red)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add/Edit modal ── */}
      {(showAdd || editing) && (
        <CommissionEditSheet
          commission={editing}
          agents={agents}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={editing ? (data) => handleUpdate(editing.id, data) : handleAdd}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <DeleteConfirm
          commission={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── FAB ── */}
      <div
        onClick={() => setShowAdd(true)}
        style={{
          position: "fixed", bottom: 76, right: 20,
          width: 54, height: 54, borderRadius: "50%",
          background: C.red, boxShadow: `0 6px 24px ${C.red}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 200,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 256 256" fill="#fff">
          <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
        </svg>
      </div>
    </div>
  );
}

// ── Sub-components ──
function StatCard({ label, value, color, prefix = "" }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ fontSize: ".6rem", color: C.gray, fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: ".92rem", fontWeight: 800, color: color, marginTop: 3 }}>
        {prefix}{value}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    flex: 1, padding: "5px 8px", borderRadius: 6,
    border: `1px solid ${color}44`,
    background: `${color}18`, color: color,
    fontSize: ".58rem", fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit",
  };
}

// ── Commission Edit Sheet ──
function CommissionEditSheet({ commission, agents, onClose, onSave }) {
  const isEdit = !!commission;
  const [form, setForm] = useState({
    client_name:               commission?.client_name || "",
    company_name:              commission?.company_name || "",
    property_name:             commission?.property_name || "",
    unit_reference:            commission?.unit_reference || "",
    deal_value:                commission?.deal_value || "",
    commission_percentage:     commission?.commission_percentage || "",
    agent_commission_percentage: commission?.agent_commission_percentage || "",
    assigned_sales_agent:      commission?.assigned_sales_agent || "",
    deal_closed_date:          commission?.deal_closed_date || "",
    expected_collection_date:  commission?.expected_collection_date || "",
    collection_status:         commission?.collection_status || "pending",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live calculation (C2 FIX)
  const amounts = calculateCommissionAmounts({
    dealValue: form.deal_value,
    commissionPercentage: form.commission_percentage,
    agentCommissionPercentage: form.agent_commission_percentage,
  });

  const handleSubmit = () => {
    if (!form.client_name || !form.deal_value || !form.assigned_sales_agent) {
      alert("Please fill required fields: Client Name, Deal Value, Sales Agent");
      return;
    }
    onSave(form);
  };

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", zIndex: 500,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: "20px 20px 0 0", padding: "18px 16px 24px",
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        animation: "slideUp 0.25s ease-out",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: ".92rem", fontWeight: 800, color: C.white }}>
            {isEdit ? "Edit Commission" : "Add Commission"}
          </div>
          <div onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, background: C.cardAlt,
            border: `1px solid ${C.border}`, display: "flex",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.gray, fontSize: ".8rem",
          }}>✕</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FormField label="Client Name *" value={form.client_name} onChange={v => set("client_name", v)} />
          <FormField label="Company Name" value={form.company_name} onChange={v => set("company_name", v)} />
          <FormField label="Property / Unit" value={form.property_name} onChange={v => set("property_name", v)} />
          <FormField label="Unit Reference" value={form.unit_reference} onChange={v => set("unit_reference", v)} />

          <FormField
            label="Deal Value (EGP) *"
            value={form.deal_value}
            onChange={v => set("deal_value", v.replace(/[^0-9.]/g, ""))}
            type="number"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <FormField
              label="Commission %"
              value={form.commission_percentage}
              onChange={v => set("commission_percentage", v.replace(/[^0-9.]/g, ""))}
              type="number"
            />
            <FormField
              label="Agent %"
              value={form.agent_commission_percentage}
              onChange={v => set("agent_commission_percentage", v.replace(/[^0-9.]/g, ""))}
              type="number"
            />
          </div>

          {/* Live calculation summary */}
          <div style={{
            background: C.cardAlt, borderRadius: 8, padding: 10,
            border: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{ fontSize: ".65rem", color: C.gray, fontWeight: 600 }}>Live Summary:</div>
            <div style={{ fontSize: ".7rem", color: C.green }}>
              Total: EGP {formatNumber(amounts.commissionAmount)}
            </div>
            <div style={{ fontSize: ".7rem", color: C.blue }}>
              Agent: EGP {formatNumber(amounts.agentCommissionAmount)}
            </div>
            <div style={{ fontSize: ".7rem", color: C.amber }}>
              Company: EGP {formatNumber(amounts.companyCommissionAmount)}
            </div>
          </div>

          {/* Sales agent dropdown */}
          <div>
            <label style={{ fontSize: ".65rem", color: C.silver, fontWeight: 600, marginBottom: 4, display: "block" }}>
              Sales Agent *
            </label>
            <select
              value={form.assigned_sales_agent}
              onChange={e => set("assigned_sales_agent", e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.cardAlt,
                color: C.white, fontSize: ".78rem", fontFamily: "inherit",
              }}
            >
              <option value="">Select agent...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <FormField
              label="Deal Closed Date"
              value={form.deal_closed_date}
              onChange={v => set("deal_closed_date", v)}
              type="date"
            />
            <FormField
              label="Expected Collection"
              value={form.expected_collection_date}
              onChange={v => set("expected_collection_date", v)}
              type="date"
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%", padding: "13px", marginTop: 8,
              background: C.red, color: C.white,
              border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              cursor: "pointer", boxShadow: `0 6px 20px ${C.red}44`,
            }}
          >
            {isEdit ? "Update Commission" : "Add Commission"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FormField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: ".65rem", color: C.silver, fontWeight: 600, marginBottom: 4, display: "block" }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.cardAlt,
          color: C.white, fontSize: ".78rem", fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

function DeleteConfirm({ commission, onConfirm, onCancel }) {
  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 600,
    }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: 16, padding: 20, maxWidth: 320, width: "100%",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: ".92rem", fontWeight: 800, color: C.red, marginBottom: 8 }}>
          Delete Commission?
        </div>
        <div style={{ fontSize: ".72rem", color: C.silver, marginBottom: 16 }}>
          Are you sure you want to delete the commission for "{commission.client_name}"? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", borderRadius: 8,
            background: C.red, color: C.white, border: "none",
            fontSize: ".78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Yes, Delete
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 8,
            background: C.cardAlt, color: C.silver,
            border: `1px solid ${C.border}`,
            fontSize: ".78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
