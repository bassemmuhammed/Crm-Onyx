// ── NotificationContext.jsx — ONYX CRM ───────────────────────────
// Global notifications state shared across all pages
// Wrap your app root with <NotificationProvider> once,
// then use useNotifications() anywhere.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch from Supabase ──
  const fetchNotifs = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
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
  }, []);

  // ── Load on mount ──
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Realtime subscription — new notifications appear instantly ──
  useEffect(() => {
    const channel = supabase
      .channel("notifications-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchNotifs()   // re-fetch on any change
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchNotifs]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));

    const unreadIds = notifs.filter(n => n.unread).map(n => n.id);
    if (!unreadIds.length) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
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
