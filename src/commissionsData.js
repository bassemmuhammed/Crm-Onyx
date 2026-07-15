// ── commissionsData.js ─────────────────────────────────────────────
// P0-6: نظام العمولات (مطابق CommissionRepository في Flutter)
//
// الجداول المطلوبة في قاعدة البيانات:
//   - commissions (جدول كامل، يستخدمه الأدمن)
//   - commissions_agent_view (view مقيد، يستخدمه المندوبون)
//
// الـ View مقيد: لا يكشف deal_value, commission_amount, company_commission_amount
//
// 🔒 C2 FIX (مطابق Flutter): agentCommissionAmount = dealValue × ap% (وليس commissionAmount × ap%)
//   - commissionAmount = dealValue × (commissionPercentage / 100)
//   - agentCommissionAmount = dealValue × (agentCommissionPercentage / 100)
//   - companyCommissionAmount = (dealValue × cp% / 100) - (dealValue × ap% / 100)

import { supabase } from "./lib/supabase";

// ── Helper: حساب العمولات (C2 FIX مطابق Flutter) ────────────────────
export function calculateCommissionAmounts({ dealValue, commissionPercentage, agentCommissionPercentage }) {
  const dv = Number(dealValue) || 0;
  const cp = Number(commissionPercentage) || 0;
  const ap = Number(agentCommissionPercentage) || 0;

  const commissionAmount      = dv * (cp / 100);
  const agentCommissionAmount = dv * (ap / 100);  // ✅ C2 FIX: من dealValue وليس commissionAmount
  const companyCommissionAmount = commissionAmount - agentCommissionAmount;

  return {
    commissionAmount:      Number(commissionAmount.toFixed(2)),
    agentCommissionAmount: Number(agentCommissionAmount.toFixed(2)),
    companyCommissionAmount: Number(companyCommissionAmount.toFixed(2)),
  };
}

// ── Helper: تنسيق العدد بفواصل الآلاف ────────────────────────────────
export function formatNumber(n) {
  if (n == null || isNaN(n)) return "0";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// ── Helper: حساب الأيام المتبقية حتى التحصيل (مطابق Flutter) ─────────
export function getCollectionCountdown(expectedCollectionDate, collectionStatus) {
  if (collectionStatus === "collected") {
    return { label: "Collected", color: "#10b981", isOverdue: false, days: 0 };
  }
  if (!expectedCollectionDate) {
    return { label: "—", color: "#6b6c73", isOverdue: false, days: null };
  }
  const expected = new Date(expectedCollectionDate);
  const now = new Date();
  const diffMs = expected.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (days === 0) return { label: "Due today",    color: "#f59e0b", isOverdue: false, days: 0 };
  if (days > 0)   return { label: `${days} days left`, color: "#3b82f6", isOverdue: false, days };
  return { label: `Overdue by ${Math.abs(days)} days`, color: "#ef4444", isOverdue: true, days };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN OPERATIONS (جدول commissions)
// ════════════════════════════════════════════════════════════════════

// ── Fetch all commissions (admin) ───────────────────────────────────
export async function fetchAllCommissions() {
  const { data, error } = await supabase
    .from("commissions")
    .select("*")
    .order("expected_collection_date", { ascending: true });
  if (error) {
    console.error("fetchAllCommissions:", error);
    return [];
  }
  return data || [];
}

// ── Insert commission (admin) ───────────────────────────────────────
// يحسب commission_amount و agent_commission_amount و company_commission_amount
// تلقائياً من deal_value + commission_percentage + agent_commission_percentage
export async function insertCommission(data) {
  const { dealValue, commissionPercentage, agentCommissionPercentage, ...rest } = data;
  const amounts = calculateCommissionAmounts({
    dealValue,
    commissionPercentage,
    agentCommissionPercentage,
  });

  const row = {
    ...rest,
    deal_value: Number(dealValue),
    commission_percentage: Number(commissionPercentage),
    agent_commission_percentage: Number(agentCommissionPercentage),
    commission_amount: amounts.commissionAmount,
    agent_commission_amount: amounts.agentCommissionAmount,
    company_commission_amount: amounts.companyCommissionAmount,
    collection_status: rest.collection_status || "pending",
  };

  const { data: inserted, error } = await supabase
    .from("commissions")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("insertCommission:", error);
    return null;
  }
  return inserted;
}

// ── Update commission (admin) ───────────────────────────────────────
export async function updateCommission(id, data) {
  const { dealValue, commissionPercentage, agentCommissionPercentage, ...rest } = data;
  const row = { ...rest };

  // إعادة الحساب لو القيم الأساسية تغيرت
  if (dealValue != null || commissionPercentage != null || agentCommissionPercentage != null) {
    // نحتاج القيم الحالية لـ deal_value/cp/ap لو مش موجودة في data
    const merged = {
      dealValue: dealValue,
      commissionPercentage,
      agentCommissionPercentage,
    };
    // لو مفيش قيمة جديدة، نحتاج fetch القديمة (لكن الـ controller يجب أن يمرر القيم الكاملة)
    if (merged.dealValue != null && merged.commissionPercentage != null && merged.agentCommissionPercentage != null) {
      const amounts = calculateCommissionAmounts(merged);
      row.deal_value = Number(merged.dealValue);
      row.commission_percentage = Number(merged.commissionPercentage);
      row.agent_commission_percentage = Number(merged.agentCommissionPercentage);
      row.commission_amount = amounts.commissionAmount;
      row.agent_commission_amount = amounts.agentCommissionAmount;
      row.company_commission_amount = amounts.companyCommissionAmount;
    }
  }

  const { data: updated, error } = await supabase
    .from("commissions")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateCommission:", error);
    return null;
  }
  return updated;
}

// ── Mark collected (admin) ──────────────────────────────────────────
// الـ trigger في DB يضع collected_date تلقائياً
export async function markCommissionCollected(id) {
  const { data, error } = await supabase
    .from("commissions")
    .update({ collection_status: "collected" })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("markCommissionCollected:", error);
    return null;
  }
  return data;
}

// ── Mark pending (admin) ────────────────────────────────────────────
export async function markCommissionPending(id) {
  const { data, error } = await supabase
    .from("commissions")
    .update({ collection_status: "pending", collected_date: null })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("markCommissionPending:", error);
    return null;
  }
  return data;
}

// ── Delete commission (admin) ───────────────────────────────────────
export async function deleteCommission(id) {
  const { error } = await supabase
    .from("commissions")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteCommission:", error);
    return false;
  }
  return true;
}

// ════════════════════════════════════════════════════════════════════
// SALES OPERATIONS (view commissions_agent_view — مقيد)
// ════════════════════════════════════════════════════════════════════

// 🔒 Sales يرى عمولاته فقط، بدون deal_value أو company_commission_amount
export async function fetchCommissionsForAgent(agentId) {
  const { data, error } = await supabase
    .from("commissions_agent_view")
    .select("*")
    .eq("assigned_sales_agent", agentId)
    .order("expected_collection_date", { ascending: true });
  if (error) {
    console.error("fetchCommissionsForAgent:", error);
    // fallback: استخدم جدول commissions مع filter
    const { data: fallback, error: fallbackErr } = await supabase
      .from("commissions")
      .select("id, client_name, company_name, property_name, unit_reference, agent_commission_percentage, agent_commission_amount, deal_closed_date, expected_collection_date, collection_status, collected_date, assigned_sales_agent, created_at")
      .eq("assigned_sales_agent", agentId)
      .order("expected_collection_date", { ascending: true });
    if (fallbackErr) return [];
    return fallback || [];
  }
  return data || [];
}

// ── Fetch sales agents (للـ dropdown في الـ admin) ──────────────────
export async function fetchSalesAgents() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, name, phone, role")
    .neq("role", "admin")
    .neq("role", "owner");
  if (error) {
    console.error("fetchSalesAgents:", error);
    return [];
  }
  return (data || []).map(u => ({
    id:    u.id,
    name:  u.full_name || u.name || u.email || "Unknown",
    phone: u.phone || "",
    role:  u.role || "sales",
  }));
}

// ════════════════════════════════════════════════════════════════════
// STAT GETTERS (مطابقة CommissionController في Flutter)
// ════════════════════════════════════════════════════════════════════

export function getAdminStats(commissions) {
  const totalCommissionAmount = commissions.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalCollectedFull = commissions
    .filter(c => c.collection_status === "collected")
    .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalPendingFull = commissions
    .filter(c => c.collection_status === "pending")
    .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
  const totalCompanyShare = commissions.reduce((s, c) => s + (Number(c.company_commission_amount) || 0), 0);
  const totalDealsClosed = commissions.length;
  const overdueCount = commissions.filter(c => {
    if (c.collection_status === "collected") return false;
    return getCollectionCountdown(c.expected_collection_date, c.collection_status).isOverdue;
  }).length;

  return {
    totalCommissionAmount,
    totalCollectedFull,
    totalPendingFull,
    totalCompanyShare,
    totalDealsClosed,
    overdueCount,
  };
}

export function getAgentStats(commissions) {
  // للـ sales: نحسب من agent_commission_amount فقط (لا نكشف deal_value)
  const totalAgentEarned = commissions.reduce((s, c) => s + (Number(c.agent_commission_amount) || 0), 0);
  const totalCollected = commissions
    .filter(c => c.collection_status === "collected")
    .reduce((s, c) => s + (Number(c.agent_commission_amount) || 0), 0);
  const totalPending = commissions
    .filter(c => c.collection_status === "pending")
    .reduce((s, c) => s + (Number(c.agent_commission_amount) || 0), 0);

  return {
    totalAgentEarned,
    totalCollected,
    totalPending,
  };
}

// ── Per-agent reports (للأدمن) ──────────────────────────────────────
export function getPerAgentReports(commissions, agents) {
  const byAgent = {};
  for (const c of commissions) {
    const agentId = c.assigned_sales_agent;
    if (!byAgent[agentId]) {
      byAgent[agentId] = {
        agentId,
        agentName: agents.find(a => a.id === agentId)?.name || "Unknown",
        dealCount: 0,
        totalCommission: 0,
        totalCollected: 0,
        totalPending: 0,
        overdueCount: 0,
      };
    }
    byAgent[agentId].dealCount++;
    byAgent[agentId].totalCommission += Number(c.commission_amount) || 0;
    if (c.collection_status === "collected") {
      byAgent[agentId].totalCollected += Number(c.commission_amount) || 0;
    } else {
      byAgent[agentId].totalPending += Number(c.commission_amount) || 0;
      if (getCollectionCountdown(c.expected_collection_date, c.collection_status).isOverdue) {
        byAgent[agentId].overdueCount++;
      }
    }
  }
  return Object.values(byAgent).sort((a, b) => b.totalCommission - a.totalCommission);
}
