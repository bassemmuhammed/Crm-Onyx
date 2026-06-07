// ── NotificationContext.jsx — ONYX CRM ───────────────────────────
// Global notifications state shared across all pages

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";

const NotificationContext = createContext(null);

// ── Request Notification Permission ──────────────────────────────
async function requestPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ── Send Push via Service Worker ─────────────────────────────────
async function sendPush(title, body, tag = "onyx-notif") {
  const allowed = await requestPermission();
  if (!allowed) return;

  // لو الـ Service Worker شغال — ابعت منه (أفضل على موبايل)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SCHEDULE_NOTIFICATION",
      id: tag,
      title,
      body,
      triggerTime: Date.now(), // فوري
    });
  } else {
    // fallback: notification عادية
    new Notification(title, { body, icon: "/favicon.ico", tag });
  }
}

// ── Insert notification into Supabase ────────────────────────────
async function insertNotif(text, color = "#CC1515", userId = null, type = "general") {
  await supabase.from("notifications").insert({ text, color, is_read: false, user_id: userId, type });
}

// ── Schedule Reminders via Service Worker ─────────────────────────
// بيشتغل حتى لو الـ app في الـ background
async function scheduleLeadReminder(lead, scheduledIds, userId) {
  const dateStr = lead.callbackDate || lead.meetingDate || lead.callback_date || lead.meeting_date;
  const timeStr = lead.callbackTime || lead.meetingTime || lead.callback_time || lead.meeting_time;
  if (!dateStr || !timeStr) return;

  const meetingTime = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(meetingTime.getTime())) return;

  const key = `${lead.id}-${dateStr}-${timeStr}`;
  if (scheduledIds.current.has(key)) return;
  scheduledIds.current.add(key);

  const now = Date.now();
  const label = lead.status === "callback" ? "Call Back" : "Pending Meeting";
  const name  = lead.name || "Lead";

  const allowed = await requestPermission();
  if (!allowed) return;

  const sw = navigator.serviceWorker?.controller;

  // ── التوقيتات الأربعة ──────────────────────────────────────────
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
    if (triggerTime <= now) continue; // الوقت عدى

    const delay = triggerTime - now;

    if (sw) {
      // ── عن طريق Service Worker (أفضل — بيشتغل في background) ──
      sw.postMessage({
        type:        "SCHEDULE_NOTIFICATION",
        id:          reminder.key,
        title:       reminder.title,
        body:        reminder.body,
        triggerTime: triggerTime,
      });
    } else {
      // ── fallback: setTimeout (بيشتغل بس لو الـ tab مفتوح) ──
      setTimeout(async () => {
        new Notification(reminder.title, {
          body: reminder.body,
          icon: "/favicon.ico",
          tag:  reminder.key,
        });
        await insertNotif(
          `${reminder.title}: ${name} (${dateStr} ${timeStr})`,
          reminder.color,
          userId,
          reminder.type
        );
      }, delay);
    }

    // ── حفظ في Supabase عند الوقت المحدد (عشان يظهر في الـ panel) ──
    setTimeout(async () => {
      await insertNotif(
        `${reminder.title}: ${name} (${dateStr} ${timeStr})`,
        reminder.color,
        userId,
        reminder.type
      );
    }, delay);
  }
}

// ── Provider ─────────────────────────────────────────────────────
export function NotificationProvider({ children, currentUser }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const scheduledIds          = useRef(new Set());

  // ── Fetch من Supabase ─────────────────────────────────────────
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

  // ── Load on mount ─────────────────────────────────────────────
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Realtime: notifications table ─────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("notifications-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifs())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotifs]);

  // ── Realtime: watch leads ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("leads-notif-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new;
        if (lead.assigned_to === currentUser.id) {
          sendPush("New Lead Assigned 🎯", `${lead.name || "Unknown"} has been assigned to you`, `new-lead-${lead.id}`);
          insertNotif(`New lead assigned: ${lead.name || "Unknown"}`, "#10b981", currentUser.id, "new_lead");
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new;
        if (
          lead.assigned_to === currentUser.id &&
          (lead.status === "callback" || lead.status === "pendingMeeting")
        ) {
          scheduleLeadReminder(lead, scheduledIds, currentUser.id);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser?.id]);

  // ── On login: جيب الـ leads وعمل schedule للـ reminders ───────
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
  }, [currentUser?.id]);

  // ── Mark all as read ──────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    const unreadIds = notifs.filter(n => n.unread).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  }, [notifs]);

  // ── Mark single as read ───────────────────────────────────────
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

// ── Hook ─────────────────────────────────────────────────────────
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

// ── Helper ───────────────────────────────────────────────────────
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
