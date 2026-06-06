// ── NotificationContext.jsx — ONYX CRM ───────────────────────────
// Global notifications state shared across all pages
// Wrap your app root with <NotificationProvider> once,
// then use useNotifications() anywhere.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";

const NotificationContext = createContext(null);

// ── Push Notification Helper ──
function sendPush(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => {
      if (p === "granted") new Notification(title, { body, icon: "/favicon.ico" });
    });
  }
}

// ── Insert notification into Supabase ──
async function insertNotif(text, color = "#CC1515", userId = null) {
  await supabase.from("notifications").insert({ text, color, is_read: false, user_id: userId });
}

// ── Schedule push for upcoming meeting/callback ──
function scheduleLeadReminder(lead, scheduledIds) {
  // callback: use callbackDate + callbackTime
  // pendingMeeting: use meetingDate + meetingTime (or same fields)
  const dateStr = lead.callbackDate || lead.meetingDate;
  const timeStr = lead.callbackTime || lead.meetingTime;
  if (!dateStr || !timeStr) return;

  const meetingTime = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(meetingTime.getTime())) return;

  const notifyAt60 = meetingTime.getTime() - 60 * 60 * 1000; // 1 hour before
  const notifyAt15 = meetingTime.getTime() - 15 * 60 * 1000; // 15 min before
  const now = Date.now();

  const key = `${lead.id}-${dateStr}-${timeStr}`;
  if (scheduledIds.current.has(key)) return;
  scheduledIds.current.add(key);

  const label = lead.status === "callback" ? "Call Back" : "Pending Meeting";

  if (notifyAt60 > now) {
    setTimeout(() => {
      sendPush(`${label} in 1 hour ⏰`, `${lead.name} — ${dateStr} at ${timeStr}`);
      insertNotif(`⏰ ${label} in 1 hour: ${lead.name} (${dateStr} ${timeStr})`, "#f59e0b");
    }, notifyAt60 - now);
  }

  if (notifyAt15 > now) {
    setTimeout(() => {
      sendPush(`${label} in 15 min 🔔`, `${lead.name} — ${dateStr} at ${timeStr}`);
      insertNotif(`🔔 ${label} in 15 min: ${lead.name} (${dateStr} ${timeStr})`, "#CC1515");
    }, notifyAt15 - now);
  }
}

export function NotificationProvider({ children, currentUser }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scheduledIds = useRef(new Set());

  // ── Fetch from Supabase ──
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
      })));
    }
    setLoading(false);
  }, [currentUser?.id]);

  // ── Load on mount ──
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Realtime: notifications table ──
  useEffect(() => {
    const channel = supabase
      .channel("notifications-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifs())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchNotifs]);

  // ── Realtime: watch leads for new assignments + schedule reminders ──
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("leads-notif-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new;
        // New lead assigned to me
        if (lead.assignedTo === currentUser.id || lead.assigned_to === currentUser.id) {
          const text = `🆕 New lead assigned: ${lead.name || "Unknown"}`;
          sendPush("New Lead! 🆕", `${lead.name || "Unknown"} has been assigned to you`);
          insertNotif(text, "#10b981", currentUser.id);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new;
        const myId = currentUser.id;
        // If callback or pendingMeeting with a date, schedule push reminder
        if ((lead.assignedTo === myId || lead.assigned_to === myId) &&
            (lead.status === "callback" || lead.status === "pendingMeeting")) {
          scheduleLeadReminder(lead, scheduledIds);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser?.id]);

  // ── On login: fetch my leads and schedule existing reminders ──
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .or(`assignedTo.eq.${currentUser.id},assigned_to.eq.${currentUser.id}`)
        .in("status", ["callback", "pendingMeeting"]);
      if (data) data.forEach(l => scheduleLeadReminder(l, scheduledIds));
    })();
  }, [currentUser?.id]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    const unreadIds = notifs.filter(n => n.unread).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  }, [notifs]);

  // ── Mark single as read ──
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

// ── Hook ──
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

// ── Helper ──
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
