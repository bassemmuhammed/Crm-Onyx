// ── AdminPushHelpers.js ─────────────────────────────────────────────
// P0-5: إشعارات الأدمن التلقائية (مطابقة NotificationService في Flutter)
//
// هذه الدوال تُستدعى من قبل الـ sales (ليس admin/owner) لإرسال push للأدمن:
//   - notifyAdminsOnStatusChange: عند تغيير حالة الـ lead
//   - notifyAdminsOnReminderUpdate: عند تحديث موعد الـ lead
//   - notifyAdminOnComment: عند إضافة تعليق
//   - notifyAdminsOnSalesPresence: عند login أو app resume
//
// الأدمن لا يستلم إشعارات للتغييرات التي يبدأها هو بنفسه (مطابق Flutter).

import { supabase } from "./lib/supabase";
import { invokeEdgeFunction } from "./lib/edgeFunction";

// ── Arabic status labels (مطابقة _statusLabelAr في Flutter) ─────────
const STATUS_LABELS_AR = {
  new:               "جديد",
  callback:          "مكالمة لاحقة",
  pendingMeeting:    "اجتماع معلق",
  meetingDone:       "تم الاجتماع",
  deal:              "صفقة",
  onGoing:           "قيد التنفيذ",
  lowBudget:         "ميزانية منخفضة",
  noAnswer:          "لا يرد",
  notInterested:     "غير مهتم",
  chooseCompetitor:  "اختار منافس",
  longTerm:          "طويل الأجل",
  closed:            "مغلق",
  duplicate:         "مكرر",
};

// ── 1) جلب قائمة الأدمن/owner ───────────────────────────────────────
async function fetchAdminIds() {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .in("role", ["admin", "owner"]);
  if (error || !data) return [];
  return data.map(u => u.id);
}

// ── 2) إرسال push للأدمن (يستدعي send-push Edge Function لكل أدمن) ──
async function invokeSendPushForAllAdmins({ title, body, data }) {
  const adminIds = await fetchAdminIds();
  const currentUserId = (await supabase.auth.getUser()).data?.user?.id;

  const promises = adminIds
    .filter(id => id !== currentUserId) // skip self
    .map(adminId =>
      invokeEdgeFunction("send-push", { user_id: adminId, title, body, data })
        .catch(err => console.warn(`send-push failed for admin ${adminId}:`, err))
    );

  await Promise.allSettled(promises);
}

// ── 3) إدراج إشعار في-app (notifications table) ─────────────────────
async function insertNotif({ userId, text, color = "#CC1515", type = "general" }) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    text,
    color,
    is_read: false,
    type,
  });
  if (error) console.error("insertNotif error:", error);
}

// ════════════════════════════════════════════════════════════════════
// PUBLIC API — مطابقة NotificationService في Flutter
// ════════════════════════════════════════════════════════════════════

// ── notifyAdminsOnStatusChange ───────────────────────────────────────
// يُستدعى عند تغيير sales لحالة الـ lead
export async function notifyAdminsOnStatusChange({ leadName, oldStatus, newStatus, salesName }) {
  // لا شيء لو لم تتغير الحالة
  if (oldStatus === newStatus) return;

  const oldLabel = STATUS_LABELS_AR[oldStatus] || oldStatus;
  const newLabel = STATUS_LABELS_AR[newStatus] || newStatus;

  const title = "ONYX CRM — Lead Update";
  const body = `${salesName} changed "${leadName}" from ${oldLabel} to ${newLabel}`;
  const data = { type: "status_change", leadName, oldStatus, newStatus, salesName };

  await invokeSendPushForAllAdmins({ title, body, data });

  // also insert in-app notif for each admin
  const adminIds = await fetchAdminIds();
  for (const adminId of adminIds) {
    await insertNotif({
      userId: adminId,
      text: body,
      color: "#CC1515",
      type: "status_change",
    });
  }
}

// ── notifyAdminsOnReminderUpdate ─────────────────────────────────────
// يُستدعى عند تحديث sales لموعد callback/meeting (بدون تغيير الحالة)
export async function notifyAdminsOnReminderUpdate({ leadName, status, newDateTime, salesName }) {
  const statusLabel = STATUS_LABELS_AR[status] || status;
  const formatted = newDateTime ? new Date(newDateTime).toLocaleString() : "—";

  const title = "ONYX CRM — Reminder Update";
  const body = `${salesName} updated "${leadName}" ${statusLabel} to ${formatted}`;
  const data = { type: "reminder_update", leadName, status, newDateTime, salesName };

  await invokeSendPushForAllAdmins({ title, body, data });
}

// ── notifyAdminOnComment ─────────────────────────────────────────────
// يُستدعى عند إضافة sales لتعليق على الـ lead
export async function notifyAdminOnComment({ leadName, salesName, commentText }) {
  const title = "ONYX CRM — New Comment";
  const truncatedComment = commentText.length > 80
    ? commentText.slice(0, 80) + "…"
    : commentText;
  const body = `${salesName} commented on "${leadName}": ${truncatedComment}`;
  const data = { type: "comment", leadName, salesName, commentText };

  await invokeSendPushForAllAdmins({ title, body, data });
}

// ── notifyAdminsOnSalesPresence ──────────────────────────────────────
// يُستدعى عند login أو app resume
// kind: 'logged in' | 'opened the app'
let lastPresencePushAt = 0;
const PRESENCE_THROTTLE_MS = 30 * 1000; // 30 seconds (مطابق Flutter)

export async function notifyAdminsOnSalesPresence({ salesName, kind = "opened the app" }) {
  // throttle (مطابق Flutter: 30s)
  const now = Date.now();
  if (now - lastPresencePushAt < PRESENCE_THROTTLE_MS) return;
  lastPresencePushAt = now;

  const title = "ONYX CRM — Sales Activity";
  const body = `${salesName} ${kind}`;
  const data = { type: "sales_presence", salesName, kind };

  await invokeSendPushForAllAdmins({ title, body, data });
}
