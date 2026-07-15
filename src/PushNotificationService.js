// ── PushNotificationService.js ──────────────────────────────────────
// P0-5: خدمة Push Notifications للـ React (Web Push VAPID — مطابقة منطقياً لـ NotificationService في Flutter)
//
// الفرق الأساسي بين Flutter و React:
//   - Flutter: FCM HTTP v1 + جدول fcm_tokens + Firebase SDK
//   - React:   Web Push VAPID + جدول push_subscriptions + navigator.serviceWorker
//
// هذه الخدمة تتعامل مع:
//   1. الـ subscription للـ Web Push (تخزين في push_subscriptions)
//   2. تحديث الـ FCM token في جدول fcm_tokens (للتوافق المستقبلي مع Flutter)
//   3. جدولة التذكيرات في scheduled_notifications (3 تذكيرات: 24h, 1h, 5m — مطابق Flutter)
//   4. منع التكرار (deduplication عبر tag)

import { supabase } from "./lib/supabase";

// 🔒 مطابق Flutter: 3 تذكيرات فقط (وليس 4)
export const REMINDER_OFFSETS = [
  { ms: 24 * 60 * 60 * 1000, label: "24 hours", suffix: "_24h" },
  { ms: 60 * 60 * 1000,       label: "1 hour",   suffix: "_1h"  },
  { ms: 5 * 60 * 1000,        label: "5 minutes", suffix: "_5m" },
];

// ── 1) الـ subscription للـ Web Push (VAPID) ────────────────────────
// يخزن subscription في جدول push_subscriptions
export async function subscribeToPush(userId, vapidPublicKey) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return null;
  }

  try {
    // انتظر الـ service worker يكون ready
    const reg = await navigator.serviceWorker.ready;

    // اطلب الإذن
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    // جيب أو أنشئ subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // خزّن في DB
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to save push subscription:", error);
      return null;
    }

    return subscription;
  } catch (err) {
    console.error("subscribeToPush error:", err);
    return null;
  }
}

// ── 2) تحديث FCM token (للتوافق المستقبلي مع Flutter) ──────────────
// ملاحظة: في الـ web، لا نستخدم FCM مباشرة. لكن نخزن placeholder row
// في fcm_tokens لكي يعمل جدول fcm_tokens لو قررنا الترحيل لـ FCM لاحقاً.
export async function saveFcmToken(userId, token) {
  if (!userId || !token) return false;
  const { error } = await supabase
    .from("fcm_tokens")
    .upsert({ user_id: userId, token }, { onConflict: "user_id" });
  if (error) {
    console.error("Failed to save FCM token:", error);
    return false;
  }
  return true;
}

// ── 3) جدولة تذكير لـ lead ──────────────────────────────────────────
// مطابق NotificationService.scheduleTaskReminder في Flutter
// offsets = REMINDER_OFFSETS (3 تذكيرات)
export async function scheduleLeadReminder({
  userId,
  leadId,
  leadName,
  status,        // "callback" أو "pendingMeeting"
  dueAt,         // Date object
  typePrefix,    // "callback" أو "meeting"
}) {
  if (!userId || !leadId || !dueAt) return;

  // امسح التذكيرات القديمة لهذا الـ lead أولاً (deduplication)
  await supabase
    .from("scheduled_notifications")
    .delete()
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .eq("status", "pending");

  const label = status === "callback" ? "Call Back" : "Pending Meeting";
  const now = new Date();

  for (const offset of REMINDER_OFFSETS) {
    const sendAt = new Date(dueAt.getTime() - offset.ms);
    // فقط التذكيرات المستقبلية (مطابق Flutter)
    if (sendAt <= now) continue;

    const tag = `${typePrefix}${offset.suffix}_${leadId}`;
    const title = `${label} in ${offset.label}`;
    const body = `${leadName} — ${label.toLowerCase()} reminder`;

    await supabase
      .from("scheduled_notifications")
      .insert({
        user_id: userId,
        lead_id: leadId,
        title,
        body,
        tag,
        send_at: sendAt.toISOString(),
        status: "pending",
        attempts: 0,
      });
  }
}

// ── 4) إلغاء تذكير لـ lead ───────────────────────────────────────────
export async function cancelLeadReminder(userId, leadId) {
  if (!userId || !leadId) return;
  await supabase
    .from("scheduled_notifications")
    .delete()
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .eq("status", "pending");
}

// ── 5) جدولة التذكيرات لكل الـ leads الموجودة (عند login) ───────────
// مطابق NotificationService._scheduleExistingLeads في Flutter
export async function scheduleExistingLeadReminders(userId) {
  if (!userId) return;

  // امسح كل التذكيرات القديمة لهذا المستخدم
  await supabase
    .from("scheduled_notifications")
    .delete()
    .eq("user_id", userId)
    .eq("status", "pending");

  // جيب كل الـ leads النشطة (callback أو pendingMeeting)
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, status, callback_date, callback_time, meeting_date, meeting_time")
    .eq("assigned_to", userId)
    .in("status", ["callback", "pendingMeeting"]);

  if (error || !leads) return;

  for (const lead of leads) {
    // حدد الـ dueAt والـ typePrefix بناءً على الـ status
    let dueAt = null;
    let typePrefix = "";
    if (lead.status === "callback" && lead.callback_date) {
      dueAt = parseDateTime(lead.callback_date, lead.callback_time);
      typePrefix = "callback";
    } else if (lead.status === "pendingMeeting" && lead.meeting_date) {
      dueAt = parseDateTime(lead.meeting_date, lead.meeting_time);
      typePrefix = "meeting";
    } else if (lead.status === "pendingMeeting" && lead.callback_date) {
      // fallback: pendingMeeting بدون meeting_date — استخدم callback
      dueAt = parseDateTime(lead.callback_date, lead.callback_time);
      typePrefix = "meeting";
    }

    if (dueAt) {
      await scheduleLeadReminder({
        userId,
        leadId: lead.id,
        leadName: lead.name,
        status: lead.status,
        dueAt,
        typePrefix,
      });
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buf) {
  if (!buf) return null;
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    // dateStr ممكن يكون "YYYY-MM-DD" أو ISO
    // timeStr ممكن يكون "HH:MM" أو "HH:MM AM/PM" أو null
    const iso = timeStr
      ? `${dateStr}T${timeStr.length <= 5 ? timeStr : "00:00"}:00`
      : `${dateStr}T09:00:00`;
    return new Date(iso);
  } catch {
    return null;
  }
}
