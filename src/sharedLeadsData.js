// ── sharedLeadsData.js
// متربط بـ Supabase — مفيش fake data
// ✅ changelog: بيتسجل كل تعديل بيحصل على الليد (من مين، امتى، من إيه لإيه، + كومنت)
// 🔒 Phase 2.7 (Flutter migration): استخدام RPC آمن `update_lead_with_changelog`
//    (atomic + row lock) بدلاً من client-side read-compute-write.

import { supabase } from "./lib/supabase";
import { addLeadsListener, removeLeadsListener } from "./RealtimeHub";
export { supabase };

export const PROJECTS = ["Nile Heights", "Capital Hub", "Zed East", "Sky Plaza"];

// ── الحقول اللي بيتتبع تغييرها في الـ changelog ──────────────
// (مطابق لـ _kTrackedFields في Flutter LeadsRepository + RPC migration)
const TRACKED_FIELDS = [
  "status",
  "assigned_to",
  "priority",
  "project",
  "callback_date",
  "callback_time",
  "client_type",
  "budget",
  "name",
  "phone",
];

// Label بشري لكل حقل يظهر في الـ changelog
const FIELD_LABELS = {
  status:        "Status",
  assigned_to:   "Assigned To",
  priority:      "Priority",
  project:       "Project",
  callback_date: "Callback Date",
  callback_time: "Callback Time",
  client_type:   "Client Type",
  budget:        "Budget",
  name:          "Name",
  phone:         "Phone",
};

// ── Fetch Team ──────────────────────────────────────────
// 🔒 استخدام full_name (مطابق Flutter) مع fallback لـ name (legacy)
export async function fetchTeam() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, name, email, phone, role, color, active")
    .neq("role", "admin")
    .neq("role", "owner")
    .order("full_name");
  if (error) console.error("fetchTeam:", error);
  return (data || []).map(u => ({
    id:    u.id,
    name:  u.full_name || u.name || u.email || "Unknown",
    email: u.email || "",
    phone: u.phone || "",
    role:  u.role  || "sales",
    color: u.color || "#4f46e5",
    active: u.active ?? true,
  }));
}

// ── Fetch Leads (with comments + changelog) ─────────────────────────
export async function fetchLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      *,
      comments: lead_comments ( id, text, by, time, created_at )
    `)
    .order("created_at", { ascending: false });
  if (error) console.error("fetchLeads:", error);
  return (data || []).map(mapLead);
}

// ── Add Lead ────────────────────────────────────────────
// بيضيف الليد بـ changelog فاضي — أي تعديل بعد كده بيتسجل أوتوماتيك
export async function addLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .insert([{ ...toRow(lead), changelog: [] }])
    .select()
    .single();
  if (error) { console.error("addLead:", error); return null; }
  return mapLead({ ...data, comments: [] });
}

// ── Update Lead ─────────────────────────────────────────
// 🔒 Phase 2.7 (Flutter migration): استخدام RPC آمن `update_lead_with_changelog`
//    بدلاً من client-side read-compute-write (الذي يعرضة لـ race conditions).
//    الـ RPC يستخدم SELECT ... FOR UPDATE لـ row lock + يحسب الـ changelog
//    server-side في transaction واحدة (atomic).
//    الـ RPC موجود في migrations/03_update_lead_rpc.sql
//
// changedBy: اسم اللي عمل التعديل (Admin / Sales Name)
// comment  : لو فيه ملاحظة مع التعديل
export async function updateLead(lead, changedBy = "Admin", comment = null) {
  const { id, comments, ...rest } = lead;

  // 1) حضّر الـ new_data JSON للـ RPC (snake_case)
  const newRow = toRow(rest);

  // 2) جرّب الـ RPC الأول (atomic)
  try {
    const { data: rpcOk, error: rpcError } = await supabase.rpc(
      "update_lead_with_changelog",
      {
        p_lead_id: id,
        p_new_data: newRow,
        p_changed_by: changedBy,
        p_comment: comment,
      }
    );

    if (!rpcError && rpcOk === true) {
      // 3) الـ RPC نجح — جيب الـ row المحدث (مع comments)
      const { data: fresh, error: fetchErr } = await supabase
        .from("leads")
        .select(`
          *,
          comments: lead_comments ( id, text, by, time, created_at )
        `)
        .eq("id", id)
        .single();

      if (!fetchErr && fresh) {
        return mapLead(fresh);
      }
      // لو الفetch فشل، نرجع الـ lead كما هو (الـ update نفسه نجح)
      return mapLead({ ...newRow, id, comments: comments || [] });
    }

    // 4) لو الـ RPC رجع error (غير موجود أو RLS أو غيره)، استخدم fallback client-side
    if (rpcError) {
      console.warn("updateLead: RPC not available, falling back to client-side:", rpcError.message);
    }
  } catch (e) {
    console.warn("updateLead: RPC threw, falling back to client-side:", e);
  }

  // 5) FALLBACK: نفس المنطق القديم (client-side read → compute → write)
  //    ملاحظة: هذا أقل أمانًا من الـ RPC لكنه يعمل بدون الـ migration.
  //    مطابق لمنطق الـ RPC: لا تسجل entry لو مفيش تغييرات ومفيش comment.
  const { data: oldRow, error: fetchErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) { console.error("updateLead fetch:", fetchErr); return null; }

  // احسب الـ diff على الحقول المتتبعة
  const changes = TRACKED_FIELDS
    .filter(f => newRow[f] !== undefined && String(newRow[f] ?? "") !== String(oldRow[f] ?? ""))
    .map(f => ({
      field: FIELD_LABELS[f] || f,
      from:  oldRow[f] ?? "—",
      to:    newRow[f] ?? "—",
    }));

  // لا تسجل entry لو مفيش تغييرات ومفيش comment (مطابق لمنطق الـ RPC)
  if (changes.length === 0 && !comment) {
    return mapLead({ ...oldRow, comments: comments || [] });
  }

  const entry = {
    at:      new Date().toISOString(),
    by:      changedBy,
    changes,
    comment: comment || null,
  };

  const existingChangelog = Array.isArray(oldRow.changelog) ? oldRow.changelog : [];
  const newChangelog = [entry, ...existingChangelog];

  const { data, error } = await supabase
    .from("leads")
    .update({ ...newRow, changelog: newChangelog })
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("updateLead:", error); return null; }
  return mapLead({ ...data, comments: comments || [] });
}

// ── Bulk Operations (P0-3) ─────────────────────────────────────────
// مطابق لـ AdminLeadsController في Flutter (PERF CS-012 batching):
// كل عملية جماعية بتعمل update واحد بدلاً من N updates منفصلة.

export async function bulkUpdateStatus(leadIds, newStatus, changedBy = "Admin") {
  // نستخدم upsert مع onConflict:"id" لتحديث عدة rows في طلب واحد
  const updates = leadIds.map(id => ({ id, status: newStatus }));
  const { data, error } = await supabase
    .from("leads")
    .upsert(updates, { onConflict: "id" })
    .select("id");
  if (error) { console.error("bulkUpdateStatus:", error); return { ok: false, count: 0 }; }
  return { ok: true, count: (data || []).length };
}

export async function bulkAssign(leadIds, agentId, changedBy = "Admin") {
  const updates = leadIds.map(id => ({ id, assigned_to: agentId }));
  const { data, error } = await supabase
    .from("leads")
    .upsert(updates, { onConflict: "id" })
    .select("id");
  if (error) { console.error("bulkAssign:", error); return { ok: false, count: 0 }; }
  return { ok: true, count: (data || []).length };
}

export async function bulkDelete(leadIds) {
  // حذف جماعي عبر filter in
  const { data, error } = await supabase
    .from("leads")
    .delete()
    .in("id", leadIds)
    .select("id");
  if (error) { console.error("bulkDelete:", error); return { ok: false, count: 0 }; }
  return { ok: true, count: (data || []).length };
}

// تصدير CSV لقائمة leads (مطابق utils/csv_export.dart في Flutter)
export function exportLeadsToCsv(leads, teamMap = {}) {
  const headers = [
    "Name", "Phone", "Project", "Source", "Status", "Priority",
    "Assigned To", "Callback Date", "Callback Time",
    "Client Type", "Budget", "Created At",
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = leads.map(l => [
    escapeCsv(l.name),
    escapeCsv(l.phone),
    escapeCsv(l.project),
    escapeCsv(l.source),
    escapeCsv(l.status),
    escapeCsv(l.priority),
    escapeCsv(teamMap[l.assignedTo]?.name || l.assignedTo || ""),
    escapeCsv(l.callbackDate),
    escapeCsv(l.callbackTime),
    escapeCsv(l.clientInfo?.type),
    escapeCsv(l.clientInfo?.budget),
    escapeCsv(l.createdAt),
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  // BOM لـ Excel يقرأ UTF-8 صح
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Delete Lead ─────────────────────────────────────────
export async function deleteLead(id) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) console.error("deleteLead:", error);
  return !error;
}

// ── Add Comment ─────────────────────────────────────────
export async function addComment(leadId, comment) {
  const { data, error } = await supabase
    .from("lead_comments")
    .insert([{ lead_id: leadId, text: comment.text, by: comment.by, time: comment.time }])
    .select()
    .single();
  if (error) { console.error("addComment:", error); return null; }
  return data;
}

// ── Delete Comment ──────────────────────────────────────
export async function deleteComment(commentId) {
  const { error } = await supabase.from("lead_comments").delete().eq("id", commentId);
  if (error) console.error("deleteComment:", error);
  return !error;
}

// ── Lead Sharing (P1 — مطابق LeadSharingRepository في Flutter) ──────
export async function shareLead(leadId, toUserId) {
  const { data, error } = await supabase
    .from("leads")
    .update({ assigned_to: toUserId, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select()
    .single();
  if (error) { console.error("shareLead:", error); return null; }
  return mapLead({ ...data, comments: [] });
}

// ── Subscribe to Realtime (P2-1: يستخدم RealtimeHub singleton) ──────
// بدلاً من فتح channel منفصل لكل صفحة، يستخدم RealtimeHub المشترك
// هذا يقلل عدد الـ connections من 4 إلى 1 (مطابق Flutter RealtimeHub)
export function subscribeToLeads(onChange) {
  const owner = `subscribeToLeads-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const listener = async (event) => {
    if (event.type === "INSERT") {
      const lead = mapLead({ ...event.newRecord, comments: [] });
      onChange({ type: "INSERT", lead });
    }
    if (event.type === "UPDATE") {
      const { data: comments } = await supabase
        .from("lead_comments")
        .select("id, text, by, time, created_at")
        .eq("lead_id", event.newRecord.id)
        .order("created_at", { ascending: false });
      const lead = mapLead({ ...event.newRecord, comments: comments || [] });
      onChange({ type: "UPDATE", lead });
    }
    if (event.type === "DELETE") {
      onChange({ type: "DELETE", id: event.oldRecord.id });
    }
  };

  addLeadsListener(owner, listener);

  // إرجاع دالة إلغاء الاشتراك
  return () => removeLeadsListener(owner);
}

// ── Helpers ─────────────────────────────────────────────

// DB row → component shape
function mapLead(row) {
  return {
    id:           row.id,
    name:         row.name,
    phone:        row.phone || "",
    project:      row.project || "",
    source:       row.source || "manual",
    status:       row.status || "new",
    priority:     row.priority || "medium",
    assignedTo:   row.assigned_to || null,
    callbackDate: row.callback_date || "",
    callbackTime: row.callback_time || "",
    meetingDate:  row.meeting_date || "",   // ✅ حقل جديد (مطابق Flutter)
    meetingTime:  row.meeting_time || "",   // ✅ حقل جديد (مطابق Flutter)
    notes:        row.notes || "",          // ✅ حقل جديد (مطابق Flutter)
    taskDone:     row.task_done ?? false,   // ✅ حقل جديد (مطابق Flutter)
    taskDismissed: row.task_dismissed ?? false, // ✅ حقل جديد (مطابق Flutter)
    isDuplicate:  row.is_duplicate ?? false,    // ✅ حقل جديد (مطابق Flutter)
    clientInfo: {
      type:   row.client_type || "",
      budget: row.budget || "",
    },
    comments: (row.comments || []).map(c => ({
      id:   c.id,
      text: c.text,
      by:   c.by,
      time: c.time,
    })),
    changelog: Array.isArray(row.changelog) ? row.changelog : [],
    createdAt: row.created_at?.slice(0, 10) || "",
  };
}

// Component shape → DB row
function toRow(lead) {
  return {
    name:           lead.name,
    phone:          lead.phone || null,
    project:        lead.project || null,
    source:         lead.source || "manual",
    status:         lead.status || "new",
    priority:       lead.priority || "medium",
    assigned_to:    lead.assignedTo || null,
    callback_date:  lead.callbackDate || null,
    callback_time:  lead.callbackTime || null,
    meeting_date:   lead.meetingDate || null,   // ✅ حقل جديد
    meeting_time:   lead.meetingTime || null,   // ✅ حقل جديد
    notes:          lead.notes || null,          // ✅ حقل جديد
    task_done:      lead.taskDone ?? false,      // ✅ حقل جديد
    task_dismissed: lead.taskDismissed ?? false, // ✅ حقل جديد
    is_duplicate:   lead.isDuplicate ?? false,   // ✅ حقل جديد
    client_type:    lead.clientInfo?.type || null,
    budget:         lead.clientInfo?.budget || null,
  };
}
