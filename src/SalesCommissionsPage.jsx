// ── SalesCommissionsPage.jsx ───────────────────────────────────────
// P0-6: شاشة العمولات للمندوب (مطابقة SalesCommissionsScreen في Flutter)
// بسيطة من ناحية التصميم (مطابقة لأسلوب React الحالي)
//
// 🔒 sales يستخدم `commissions_agent_view` (مقيد — لا يكشف deal_value أو company_commission_amount)
// read-only: لا يمكنه تعديل أو حذف

import { useState, useEffect, useCallback } from "react";
import {
  fetchCommissionsForAgent,
  getAgentStats,
  formatNumber,
  getCollectionCountdown,
} from "./commissionsData";
import { supabase } from "./lib/supabase";
import { C } from "./theme";

export default function SalesCommissionsPage({ currentUser }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const data = await fetchCommissionsForAgent(currentUser.id);
    setCommissions(data);
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!currentUser?.id) return;
    const ch = supabase
      .channel(`commissions-realtime-${currentUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, currentUser?.id]);

  const stats = getAgentStats(commissions);
  const filtered = commissions.filter(c => {
    if (filter === "all") return true;
    return c.collection_status === filter;
  });

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
      `}</style>

      {/* ── Stat Cards (3 فقط — لا نكشف deal_value) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        padding: "12px 14px",
      }}>
        <StatCard label="Total Earned" value={formatNumber(stats.totalAgentEarned)}    color={C.green}  prefix="EGP " />
        <StatCard label="Collected"    value={formatNumber(stats.totalCollected)}     color={C.blue}   prefix="EGP " />
        <StatCard label="Pending"      value={formatNumber(stats.totalPending)}       color={C.orange} prefix="EGP " />
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

      {/* ── Commission list ── */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: ".82rem", animation: "pulse 1.5s ease infinite" }}>
            Loading your commissions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: ".82rem" }}>
            No commissions yet
          </div>
        ) : filtered.map(c => {
          const countdown = getCollectionCountdown(c.expected_collection_date, c.collection_status);
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
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.green }}>
                    EGP {formatNumber(c.agent_commission_amount)}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, prefix = "" }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "10px 8px",
    }}>
      <div style={{ fontSize: ".55rem", color: C.gray, fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: ".82rem", fontWeight: 800, color: color, marginTop: 3 }}>
        {prefix}{value}
      </div>
    </div>
  );
}
