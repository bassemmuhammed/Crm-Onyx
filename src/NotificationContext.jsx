// ── NotificationContext.jsx — ONYX CRM ───────────────────────────
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
<<<<<<< HEAD
import {
  scheduleLeadReminder as pushScheduleLeadReminder,
  cancelLeadReminder,
  scheduleExistingLeadReminders,
} from "./PushNotificationService";
=======
>>>>>>> 245bd7ba88f9296961214b0e9cf43bf3bd743016

const NotificationContext = createContext(null);

// ── Insert notification into Supabase ────────────────────────────
async function insertNotif(text, color = "#CC1515", userId = null, type = "general") {
  await supabase.from("notifications").insert({ text, color, is_read: false, user_id: userId, type });
}

// ── Schedule Reminders في جدول scheduled_notifications ───────────
<<<<<<< HEAD
// ✅ P0-5: استخدم PushNotificationService الجديد (3 تذكيرات مطابق Flutter، schema مطابق)
// الـ scheduledNotifications ref يُستخدم فقط لـ deduplication محلي (للـ real-time updates)
async function scheduleLeadReminder(lead, scheduledIds, userId) {
  const dateStr = lead.callbackDate || lead.meetingDate || lead.callback_date || lead.meeting_date;
  const timeStr = lead.callbackTime || lead.meetingTime || lead.callback_time || lead.meeting_time;
  if (!dateStr) return;

  // بناء Date object
  const iso = timeStr
    ? `${dateStr}T${timeStr.length <= 5 ? timeStr : "09:00"}:00`
    : `${dateStr}T09:00:00`;
  const dueAt = new Date(iso);
  if (isNaN(dueAt.getTime())) return;

  // deduplication محلي
  const key = `${lead.id}-${dateStr}-${timeStr || "09:00"}`;
  if (scheduledIds.current.has(key)) return;
  scheduledIds.current.add(key);

  // استخدم الـ service الجديد (3 تذكيرات: 24h, 1h, 5m — مطابق Flutter)
  await pushScheduleLeadReminder({
    userId,
    leadId: lead.id,
    leadName: lead.name || "Lead",
    status: lead.status,
    dueAt,
    typePrefix: lead.status === "callback" ? "callback" : "meeting",
  });
=======
async function scheduleLeadReminder(lead, scheduledIds, userId) {
  const dateStr = lead.callbackDate || lead.meetingDate || lead.callback_date || lead.meeting_date;
  const timeStr = lead.callbackTime || lead.meetingTime || lead.callback_time || lead.meeting_time;
  if (!dateStr || !timeStr) return;

  const meetingTime = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(meetingTime.getTime())) return;

  const key = `${lead.id}-${dateStr}-${timeStr}`;
  if (scheduledIds.current.has(key)) return;
  scheduledIds.current.add(key);

  const now   = Date.now();
  const label = lead.status === "callback" ? "Call Back" : "Pending Meeting";
  const name  = lead.name || "Lead";

  const reminders = [
    {
      key:   `${key}-1d`,
      diff:  24 * 60 * 60 * 1000,
      title: `📅 ${label} غداً`,
      body:  `${name} — ${dateStr} الساعة ${timeStr}`,
      type:  lead.status === "callback" ? "callback_1d" : "meeting_1d",
      color: "#3b82f6",
    },
    {
      key:   `${key}-1h`,
      diff:  60 * 60 * 1000,
      title: `⏰ ${label} خلال ساعة`,
      body:  `${name} — ${dateStr} الساعة ${timeStr}`,
      type:  lead.status === "callback" ? "callback_1h" : "meeting_1h",
      color: "#f59e0b",
    },
    {
      key:   `${key}-5m`,
      diff:  5 * 60 * 1000,
      title: `🔔 ${label} خلال 5 دقايق`,
      body:  `${name} — ${dateStr} الساعة ${timeStr}`,
      type:  lead.status === "callback" ? "callback_5m" : "meeting_5m",
      color: "#ef4444",
    },
    {
      key:   `${key}-now`,
      diff:  0,
      title: `🚨 ${label} دلوقتي!`,
      body:  `${name} — حان الوقت!`,
      type:  lead.status === "callback" ? "callback_now" : "meeting_now",
      color: "#CC1515",
    },
  ];

  for (const reminder of reminders) {
    const triggerTime = meetingTime.getTime() - reminder.diff;
    if (triggerTime <= now) continue;

    const sendAt = new Date(triggerTime).toISOString();

    await supabase.from("scheduled_notifications").upsert({
      user_id: userId,
      title:   reminder.title,
      body:    reminder.body,
      tag:     reminder.key,
      send_at: sendAt,
      sent:    false,
    }, { onConflict: "tag" });

    const delay = triggerTime - now;
    setTimeout(async () => {
      await insertNotif(
        `${reminder.title}: ${name} (${dateStr} ${timeStr})`,
        reminder.color,
        userId,
        reminder.type
      );
    }, delay);
  }
>>>>>>> 245bd7ba88f9296961214b0e9cf43bf3bd743016
}

// ── Provider ─────────────────────────────────────────────────────
export function NotificationProvider({ children, currentUser }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const scheduledIds          = useRef(new Set());

  const fetchNotifs = useCallback(async () => {
    if (!currentUser?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifs(data.map(n => ({
        id:     n.id,
        text:   n.text,
        time:   formatTime(n.created_at),
        color:  n.color || "#CC1515",
        unread: !n.is_read,
        type:   n.type || "general",
      })));
    }
    setLoading(false);
  }, [currentUser?.id]);

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // ── Realtime: notifications ───────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("notifications-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifs())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotifs]);

  // ── Realtime: leads ───────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel("leads-notif-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, async (payload) => {
        const lead = payload.new;
        if (lead.assigned_to === currentUser.id) {
          await insertNotif(`New lead assigned: ${lead.name || "Unknown"}`, "#10b981", currentUser.id, "new_lead");
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new;
        if (lead.assigned_to === currentUser.id &&
            (lead.status === "callback" || lead.status === "pendingMeeting")) {
          scheduleLeadReminder(lead, scheduledIds, currentUser.id);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [currentUser?.id]);

  // ── On login: schedule existing leads ─────────────────────────
<<<<<<< HEAD
  // ✅ P0-5: استخدم scheduleExistingLeadReminders الجديد (يطبق 3 تذكيرات مطابق Flutter)
  useEffect(() => {
    if (!currentUser?.id) return;
    scheduleExistingLeadReminders(currentUser.id);
=======
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", currentUser.id)
        .in("status", ["callback", "pendingMeeting"]);
      if (data) data.forEach(l => scheduleLeadReminder(l, scheduledIds, currentUser.id));
    })();
>>>>>>> 245bd7ba88f9296961214b0e9cf43bf3bd743016
  }, [currentUser?.id]);

  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    const unreadIds = notifs.filter(n => n.unread).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  }, [notifs]);

  const markRead = useCallback(async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;

  return (
    <NotificationContext.Provider value={{ notifs, loading, unreadCount, markAllRead, markRead, refresh: fetchNotifs }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

function formatTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
