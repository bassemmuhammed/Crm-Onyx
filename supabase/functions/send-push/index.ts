// ── send-push/index.ts ─────────────────────────────────────────────
// P0-5: Web Push (VAPID) Edge Function (مطابق send-push في Flutter لكن لـ Web)
//
// الـ Flutter version تستخدم FCM HTTP v1 (مناسبة للموبايل).
// الـ React (web) version تستخدم Web Push API (VAPID) — أنسب للـ web.
//
// يحتاج الـ secrets التالية في Supabase:
//   - VAPID_PRIVATE_KEY: المفتاح الخاص بـ ECDSA P-256
//   - VAPID_PUBLIC_KEY: المفتاح العام (يُرسل للعميل)
//   - VAPID_SUBJECT: mailto: أو URL للتواصل
//
// الجداول المطلوبة:
//   - push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
//   - fcm_tokens (user_id, token, created_at) — للتوافق مع Flutter لو احتجنا مستقبلاً
//
// الاستخدام:
//   POST { user_id, title, body, data? }
//   → { ok: true, sent: N } أو { ok: false, error }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helper: Base64Url encode/decode ─────────────────────────────────
function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Helper: Import VAPID private key (P-256 ECDSA) ──────────────────
async function importVapidPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  // الـ private key بـ base64url encoded DER PKCS8
  const derBytes = base64Decode(privateKeyBase64);
  return await crypto.subtle.importKey(
    "pkcs8",
    derBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );
}

function base64Decode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ── Helper: Generate JWT for VAPID (RFC 8292) ───────────────────────
async function generateVapidJwt(audience: string, subject: string, privateKey: CryptoKey): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    enc.encode(unsigned),
  );

  return `${unsigned}.${base64UrlEncode(signature)}`;
}

// ── Helper: Encrypt payload (RFC 8291 — aes128gcm) ──────────────────
// هذا منطق معقد لـ Web Push encryption. نستخدم مكتبة جاهزة من esm.sh
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<ArrayBuffer> {
  // استيراد مكتبة من deno.land
  const { encrypt } = await import("https://esm.sh/web-push@3.6.7");
  // مكتبة web-push تتوقع الـ keys بصيغة معينة
  return await encrypt(payload, {
    p256dh,
    auth,
  }, new Uint8Array(16)); // salt عشوائي
}

// ── Main handler ────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, data } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ ok: false, error: "user_id, title, body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // إنشاء Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // جيب كل الـ subscriptions للمستخدم
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      return new Response(
        JSON.stringify({ ok: false, error: subError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // مفيش subscriptions — مش خطأ، بس مفيش حاجة نبعتها
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: "no_subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // تحميل VAPID keys من secrets
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@onyxcrm.com";

    if (!vapidPrivateKey) {
      console.error("VAPID_PRIVATE_KEY secret is not set");
      return new Response(
        JSON.stringify({ ok: false, error: "VAPID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const privateKey = await importVapidPrivateKey(vapidPrivateKey);

    let sentCount = 0;
    let failedCount = 0;
    const failedEndpoints: string[] = [];

    // إرسال لكل subscription
    for (const sub of subscriptions) {
      try {
        // استخراج origin من الـ endpoint لاستخدامه كـ audience في VAPID JWT
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        // توليد VAPID JWT
        const vapidJwt = await generateVapidJwt(audience, vapidSubject, privateKey);

        // تشفير الـ payload
        const payloadStr = JSON.stringify({
          notification: {
            title,
            body,
            data: data || {},
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [100, 50, 100],
            tag: data?.tag || "onyx-crm",
            requireInteraction: data?.requireInteraction || false,
          },
        });

        const encryptedPayload = await encryptPayload(payloadStr, sub.p256dh, sub.auth);

        // إرسال لـ Web Push endpoint
        const pushRes = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "Content-Length": String(encryptedPayload.byteLength),
            "Authorization": `vapid t=${vapidJwt}`,
            "TTL": "2419200", // 4 weeks
            "Urgency": "high",
          },
          body: encryptedPayload,
        });

        if (pushRes.ok) {
          sentCount++;
        } else if (pushRes.status === 404 || pushRes.status === 410) {
          // الـ subscription انتهت صلاحيتها — امسحها من DB
          failedEndpoints.push(sub.endpoint);
          failedCount++;
        } else {
          console.error(`Push failed for ${sub.endpoint}: ${pushRes.status} ${await pushRes.text()}`);
          failedCount++;
        }
      } catch (err) {
        console.error(`Push error for ${sub.endpoint}:`, err);
        failedCount++;
      }
    }

    // امسح الـ subscriptions المنتهية
    if (failedEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints);
    }

    return new Response(
      JSON.stringify({
        ok: sentCount > 0,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        status: sentCount > 0 ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
