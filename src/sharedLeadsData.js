// ── sharedLeadsData.js
// متربط بـ Supabase — مفيش fake data
// ✅ changelog: بيتسجل كل تعديل بيحصل على الليد (من مين، امتى، من إيه لإيه، + كومنت)

import { supabase } from "./lib/supabase";
export { supabase };

export const PROJECTS = ["Nile Heights", "Capital Hub", "Zed East", "Sky Plaza"];

// ── الحقول اللي بيتتبع تغييرها في الـ changelog ──────────────
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
export async function fetchTeam() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role, color, active")
    .neq("role", "admin")
    .neq("role", "owner")
    .order("name");
  if (error) console.error("fetchTeam:", error);
  return (data || []).map(u => ({
    id:    u.id,
    name:  u.name  || u.email || "Unknown",
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
// changedBy: اسم اللي عمل التعديل (Admin / Sales Name)
// comment  : لو فيه ملاحظة مع التعديل
export async function updateLead(lead, changedBy = "Admin", comment = null) {
  const { id, comments, ...rest } = lead;

  // ① جيب الليد القديم من DB
  const { data: oldRow, error: fetchErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) { console.error("updateLead fetch:", fetchErr); return null; }

  // ② احسب الـ diff على الحقول المتتبعة
  const newRow = toRow(rest);
  const changes = TRACKED_FIELDS
    .filter(f => newRow[f] !== undefined && String(newRow[f] ?? "") !== String(oldRow[f] ?? ""))
    .map(f => ({
      field: FIELD_LABELS[f] || f,
      from:  oldRow[f] ?? "—",
      to:    newRow[f] ?? "—",
    }));

  // ③ ابني الـ changelog entry (حتى لو مفيش diff — يسجل الـ save)
  const entry = {
    at:      new Date().toISOString(),
    by:      changedBy,
    changes, // [] لو مفيش تغيير في الحقول
    comment: comment || null,
  };

  // ④ ضيف الـ entry في أول الـ array (الأحدث أول)
  const existingChangelog = Array.isArray(oldRow.changelog) ? oldRow.changelog : [];
  const newChangelog = [entry, ...existingChangelog];

  // ⑤ ابعت الـ update مع الـ changelog الجديد
  const { data, error } = await supabase
    .from("leads")
    .update({ ...newRow, changelog: newChangelog })
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("updateLead:", error); return null; }
  return mapLead({ ...data, comments: comments || [] });
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

// ── Subscribe to Realtime ────────────────────────────────────────────────
// استخدمها في صفحة السيلز والأدمن عشان التحديثات تظهر فورًا
//
// مثال:
//   useEffect(() => {
//     const unsub = subscribeToLeads(({ type, lead, id }) => {
//       if (type === "INSERT") setLeads(prev => [lead, ...prev]);
//       if (type === "UPDATE") setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
//       if (type === "DELETE") setLeads(prev => prev.filter(l => l.id !== id));
//     });
//     return unsub;
//   }, []);
//
export function subscribeToLeads(onChange) {
  const channel = supabase
    .channel("leads-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "leads" },
      async (payload) => {
        if (payload.eventType === "INSERT") {
          // جيب الـ comments (فاضية للحاجة الجديدة)
          const lead = mapLead({ ...payload.new, comments: [] });
          onChange({ type: "INSERT", lead });
        }
        if (payload.eventType === "UPDATE") {
          // جيب الـ comments من DB عشان تكون complete
          const { data: comments } = await supabase
            .from("lead_comments")
            .select("id, text, by, time, created_at")
            .eq("lead_id", payload.new.id)
            .order("created_at", { ascending: false });
          const lead = mapLead({ ...payload.new, comments: comments || [] });
          onChange({ type: "UPDATE", lead });
        }
        if (payload.eventType === "DELETE") {
          onChange({ type: "DELETE", id: payload.old.id });
        }
      }
    )
    .subscribe();

  // بترجع دالة إلغاء الـ subscription عشان تستخدمها في cleanup
  return () => supabase.removeChannel(channel);
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
    // ✅ changelog: array من التعديلات مرتبة من الأحدث للأقدم
    changelog: Array.isArray(row.changelog) ? row.changelog : [],
    createdAt: row.created_at?.slice(0, 10) || "",
  };
}

// Component shape → DB row
function toRow(lead) {
  return {
    name:          lead.name,
    phone:         lead.phone || null,
    project:       lead.project || null,
    source:        lead.source || "manual",
    status:        lead.status || "new",
    priority:      lead.priority || "medium",
    assigned_to:   lead.assignedTo || null,
    callback_date: lead.callbackDate || null,
    callback_time: lead.callbackTime || null,
    client_type:   lead.clientInfo?.type || null,
    budget:        lead.clientInfo?.budget || null,
  };
}
