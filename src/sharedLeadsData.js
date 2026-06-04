// ── sharedLeadsData.js
// متربط بـ Supabase — مفيش fake data

import { supabase } from "./lib/supabase";
export { supabase };

export const PROJECTS = ["Nile Heights", "Capital Hub", "Zed East", "Sky Plaza"];

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

// ── Fetch Leads (with comments) ─────────────────────────
export async function fetchLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      *,
      comments: lead_comments ( id, text, by, time, created_at )
    `)
    .order("created_at", { ascending: false });
  if (error) console.error("fetchLeads:", error);

  // Map to match old shape used in AdminLeadsPage
  return (data || []).map(mapLead);
}

// ── Add Lead ────────────────────────────────────────────
export async function addLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .insert([toRow(lead)])
    .select()
    .single();
  if (error) { console.error("addLead:", error); return null; }
  return mapLead({ ...data, comments: [] });
}

// ── Update Lead ─────────────────────────────────────────
export async function updateLead(lead) {
  const { id, comments, ...rest } = lead;
  const { data, error } = await supabase
    .from("leads")
    .update(toRow(rest))
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
    comments:  (row.comments || []).map(c => ({
      id:   c.id,
      text: c.text,
      by:   c.by,
      time: c.time,
    })),
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
