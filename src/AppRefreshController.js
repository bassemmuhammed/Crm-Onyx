// ── AppRefreshController.js ────────────────────────────────────────
// P2-2: AppRefreshController — تنسيق التحديث
// (مطابقة AppRefreshController في Flutter)
//
// بدلاً من أن كل صفحة تدير تحديثها بشكل منفصل،
// هذا الـ controller يجمع عمليات التحديث في مكان واحد.
// يمكن استدعاء refresh() من أي مكان لتحديث كل الـ handlers المسجلة.
//
// الاستخدام:
//   import { registerRefreshHandler, unregisterRefreshHandler, refreshAll } from "./AppRefreshController";
//
//   // في صفحة AdminLeads:
//   useEffect(() => {
//     registerRefreshHandler("AdminLeads", async () => { await loadLeads(); });
//     return () => unregisterRefreshHandler("AdminLeads");
//   }, []);
//
//   // في أي مكان (مثل بعد تعديل lead):
//   await refreshAll();

const _handlers = new Map(); // id → handler

// ── تسجيل handler جديد (idempotent) ────────────────────────────────
export function registerRefreshHandler(id, handler) {
  _handlers.set(id, handler);
}

// ── إزالة handler ──────────────────────────────────────────────────
export function unregisterRefreshHandler(id) {
  _handlers.delete(id);
}

// ── تحديث كل الـ handlers المسجلة (بالتوازي) ──────────────────────
export async function refreshAll() {
  const handlers = Array.from(_handlers.values());
  if (handlers.length === 0) return;

  // تنفيذ كل الـ handlers بالتوازي
  await Promise.allSettled(
    handlers.map(async (handler) => {
      try {
        await handler();
      } catch (err) {
        console.error(`AppRefreshController handler error:`, err);
      }
    })
  );
}

// ── تحديث handler واحد ──────────────────────────────────────────────
export async function refreshOne(id) {
  const handler = _handlers.get(id);
  if (!handler) return;
  try {
    await handler();
  } catch (err) {
    console.error(`AppRefreshController.refreshOne(${id}) error:`, err);
  }
}

// ── الحصول على قائمة الـ handlers المسجلة (للتشخيص) ────────────────
export function getRegisteredHandlers() {
  return Array.from(_handlers.keys());
}
