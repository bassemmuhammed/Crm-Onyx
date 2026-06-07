// ── ONYX CRM — Service Worker ──────────────────────────────────────
// ضيف الملف ده في مجلد /public/sw.js

const CACHE_NAME = "onyx-crm-v1";

// ── Push Event: لما تيجي notification من السيرفر ──
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "ONYX CRM";
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "onyx-notif",
    data: data.url || "/",
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click: لما اليوزر يضغط على الـ notification ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

// ── Message: لاستقبال الـ scheduled notifications من الـ app ──
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, triggerTime } = event.data;
    const delay = triggerTime - Date.now();
    if (delay <= 0) return;

    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: id,
        vibrate: [200, 100, 200],
      });
    }, delay);
  }
});
