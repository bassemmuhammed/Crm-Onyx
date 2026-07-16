// ── roleSession.js ───────────────────────────────────────────────────
// ONYX CRM — Authoritative role check (React port of Flutter's
// lib/services/role_session.dart)
//
// Enforces the security requirement from the brief:
//
//   "تأكد أن أي محاولة وصول مباشرة (عبر deep link أو تعديل الرابط) لأي
//    شاشة غير مصرح بها لدور المستخدم الحالي، يتم رفضها وإعادة التوجيه
//    لصفحته الافتراضية"
//
// How it works:
//   1. `currentRole()` — synchronous check using the cached user map +
//      live Supabase session. Use this from render() methods.
//   2. `refreshRoleFromServer()` — authoritative async check that
//      fetches the `role` column fresh from the `users` table.
//      Call this from `RoleGuard`'s useEffect so every screen entry
//      re-confirms the role against the database (defense-in-depth
//      against role changes mid-session).
//
// Why this matters:
//   The brief says broker accounts must NEVER see screens they're not
//   authorized for. But what if a sales_broker is downgraded to sales
//   while they're logged in? The cached `currentUser.role` would still
//   say 'sales_broker' until they re-login. This service closes that
//   hole by querying Supabase on every screen entry.

import { supabase } from "./lib/supabase";
import { UserRole, userRoleFromString } from "./userRole";

/** Synchronous check: is there a live session right now? */
export function hasLiveSession() {
  return !!supabase.auth.currentSession;
}

/**
 * Synchronous check using only what's already in memory.
 * Use this from render() methods. For the authoritative answer,
 * call `refreshRoleFromServer()` first.
 */
export function currentRole(cachedUser) {
  if (!hasLiveSession()) return UserRole.sales;
  if (cachedUser) return userRoleFromString(cachedUser.role);
  // No cached user map — fall through to a best-effort read from
  // the JWT's user metadata. If `role` isn't in the JWT, we return
  // sales (fail-closed).
  const user = supabase.auth.currentUser;
  if (!user) return UserRole.sales;
  return userRoleFromString(user.appMetadata?.role);
}

/**
 * Authoritative async check: fetches the `users` row from Supabase
 * and reads the `role` column.
 *
 * Returns UserRole.sales on any error (fail-closed per the brief).
 */
export async function refreshRoleFromServer() {
  if (!hasLiveSession()) return UserRole.sales;
  const uid = supabase.auth.currentUser?.id;
  if (!uid || uid.length === 0) return UserRole.sales;
  try {
    const { data: row, error } = await supabase
      .from("users")
      .select("id, role, active")
      .eq("id", uid)
      .maybeSingle();
    if (error) throw error;
    if (!row) return UserRole.sales;
    // Deactivated user? Fail-closed to sales (least privilege).
    const active = row.active ?? true;
    if (!active) return UserRole.sales;
    return userRoleFromString(row.role);
  } catch (e) {
    console.warn("refreshRoleFromServer error:", e);
    return UserRole.sales;
  }
}
