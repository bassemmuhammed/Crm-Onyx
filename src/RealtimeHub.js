// ── RealtimeHub.js ─────────────────────────────────────────────────
// P2-1: RealtimeHub Singleton — قناة مشتركة لجدول leads
// (مطابقة RealtimeHub في Flutter — يحل مشكلة N×N subscriptions)
//
// بدلاً من أن كل صفحة تفتح channel منفصل لجدول leads،
// هذا الـ singleton يفتح channel واحد فقط ويوزع الأحداث على كل المستمعين.
//
// الاستخدام:
//   import { addLeadsListener, removeLeadsListener } from "./RealtimeHub";
//   useEffect(() => {
//     const handler = (event) => { ... };
//     addLeadsListener("MyPage", handler);
//     return () => removeLeadsListener("MyPage");
//   }, []);

import { supabase } from "./lib/supabase";

// ── LeadChangeEvent (مطابق Flutter) ────────────────────────────────
// event: { type: "INSERT" | "UPDATE" | "DELETE", newRecord, oldRecord, leadId }

let _channel = null;
let _listeners = new Map(); // owner → listener

// ── إضافة مستمع جديد ────────────────────────────────────────────────
// owner: معرّف فريد للمستمع (مثل اسم الصفحة)
// listener: دالة تستقبل LeadChangeEvent
export function addLeadsListener(owner, listener) {
  _listeners.set(owner, listener);

  // لو أول مستمع، افتح الـ channel
  if (_listeners.size === 1 && !_channel) {
    _subscribe();
  }
}

// ── إزالة مستمع ─────────────────────────────────────────────────────
export function removeLeadsListener(owner) {
  _listeners.delete(owner);

  // لو آخر مستمع، أغلق الـ channel
  if (_listeners.size === 0 && _channel) {
    _unsubscribe();
  }
}

// ── إزالة مستمع واحد (alias) ────────────────────────────────────────
export const removeOneListener = removeLeadsListener;

// ── الاشتراك في القناة المشتركة ─────────────────────────────────────
function _subscribe() {
  _channel = supabase
    .channel("onyx-leads-hub")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "leads" },
      (payload) => {
        _dispatch(payload);
      }
    )
    .subscribe();
}

// ── إلغاء الاشتراك ──────────────────────────────────────────────────
function _unsubscribe() {
  if (_channel) {
    supabase.removeChannel(_channel);
    _channel = null;
  }
}

// ── توزيع الحدث على كل المستمعين ───────────────────────────────────
function _dispatch(payload) {
  const event = {
    type: payload.eventType, // INSERT | UPDATE | DELETE
    newRecord: payload.new,
    oldRecord: payload.old,
    leadId: payload.new?.id || payload.old?.id,
  };

  // نسخة من الـ listeners (لتفادي مشاكل التعديل أثناء التكرار)
  const snapshot = Array.from(_listeners.values());

  for (const listener of snapshot) {
    try {
      listener(event);
    } catch (err) {
      console.error(`RealtimeHub listener error:`, err);
    }
  }
}

// ── الحصول على حالة الـ hub (للتشخيص) ──────────────────────────────
export function getHubStatus() {
  return {
    channelActive: !!_channel,
    listenerCount: _listeners.size,
    listeners: Array.from(_listeners.keys()),
  };
}
