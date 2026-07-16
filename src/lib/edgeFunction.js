// ── lib/edgeFunction.js ────────────────────────────────────────────
// Helper لاستدعاء Supabase Edge Functions بدون x-client-info header
// (يصلح مشكلة CORS: "Request header field x-client-info is not allowed")
//
// الاستخدام (نفس API مثل supabase.functions.invoke):
//   const { data, error } = await invokeEdgeFunction("send-push", { user_id, title, body });
//   if (error) { ... }
//   else { ... }

import { supabase } from "./supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function invokeEdgeFunction(functionName, body = {}) {
  try {
    // احصل على access token من الـ session الحالية
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || SUPABASE_ANON_KEY;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "apikey": SUPABASE_ANON_KEY,
        // ملاحظة: لا نضيف x-client-info header (يسبب مشكلة CORS)
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { data: null, error: data?.error || data || { message: `HTTP ${response.status}` } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: String(err) } };
  }
}
