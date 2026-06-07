// ── pushSubscription.js — ONYX CRM ───────────────────────────────
// حفظ الـ push subscription في Supabase

import { supabase } from "./lib/supabase";

const VAPID_PUBLIC_KEY = "BJ8g0liFATpHtHn-jxth-PrFGFwTnpgNbnkV_TzqmCujc4b-OMndJklVKvXtv1KJLujr7SiC-Ymp9g_LNvPmPPI";

// ── تحويل الـ VAPID key لـ Uint8Array ──
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── طلب Permission وحفظ الـ Subscription ──
export async function subscribeToPush(userId) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push not supported");
      return null;
    }

    // انتظر الـ Service Worker يبقى جاهز
    const reg = await navigator.serviceWorker.ready;

    // طلب Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission denied");
      return null;
    }

    // جيب الـ subscription الموجودة أو عمل واحدة جديدة
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // احفظ الـ subscription في Supabase
    const subJson = subscription.toJSON();
    await supabase.from("push_subscriptions").upsert({
      user_id:  userId,
      endpoint: subJson.endpoint,
      p256dh:   subJson.keys.p256dh,
      auth:     subJson.keys.auth,
    }, { onConflict: "user_id" });

    console.log("✅ Push subscription saved");
    return subscription;
  } catch (err) {
    console.error("Push subscription error:", err);
    return null;
  }
}

// ── إرسال Push عن طريق Edge Function ──
export async function sendScheduledPush(userId, title, body, tag) {
  try {
    // جيب الـ subscription من Supabase
    const { data } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return;

    const subscription = {
      endpoint: data.endpoint,
      keys: { p256dh: data.p256dh, auth: data.auth },
    };

    // ابعت للـ Edge Function
    await fetch("https://kacpohuwvketovcrzols.supabase.co/functions/v1/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthY3BvaHV3dmtldG92Y3J6b2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTI2MDQsImV4cCI6MjA5NjAyODYwNH0.ZjINtibUHFu8aKkM08K0qEdHU9WHdqsf_YOY0q5kAKg`,
      },
      body: JSON.stringify({ subscription, title, body, tag }),
    });
  } catch (err) {
    console.error("Send push error:", err);
  }
}
