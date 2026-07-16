// ── RoleGuard.jsx ────────────────────────────────────────────────────
// ONYX CRM — Defense-in-depth role guard (React port of Flutter's
// lib/widgets/role_guard.dart)
//
// Even if a route is somehow rendered for a user whose role doesn't
// permit it, this wrapper re-checks the role on every mount and
// renders an "Access denied" placeholder instead of the body.
//
// The brief explicitly requires:
//   "تأكد أن أي محاولة وصول مباشرة (عبر deep link أو تعديل الرابط) لأي
//    شاشة غير مصرح بها لدور المستخدم الحالي، يتم رفضها وإعادة التوجيه
//    لصفحته الافتراضية"
//
// Usage:
//   <RoleGuard
//     user={currentUser}
//     allowed={(role) => canAccessInventory(role)}
//     renderAccessDenied={() => <Navigate to="/" replace />}
//   >
//     <InventoryPage />
//   </RoleGuard>
//
// Or with the simpler `allowedRole` shortcut:
//   <RoleGuard allowedRole={UserRole.adminBroker} user={currentUser}>
//     <InventoryPage />
//   </RoleGuard>

import { useEffect, useState } from "react";
import { userRoleFromString } from "./userRole";
import { refreshRoleFromServer, hasLiveSession } from "./roleSession";
import { C } from "./theme";

/**
 * Wraps a role-protected screen. The children only render when
 * `predicate(currentRole)` returns true AND the live Supabase
 * session is valid. Otherwise the access-denied panel is shown.
 *
 * On every mount, it kicks off an async re-check against the
 * `users` table — this satisfies the brief's requirement that the
 * role is verified on every screen load, not just at login.
 */
export default function RoleGuard({
  user,
  allowed,
  allowedRole,           // shortcut: pass a single UserRole string
  children,
  renderAccessDenied,    // optional: custom denied UI
  renderLoading,         // optional: custom loading UI
}) {
  // Result of the synchronous check on the cached user map.
  // Used to render the FIRST frame immediately.
  const syncedRole = userRoleFromString(user?.role);

  // Result of the async refresh. Null until the refresh completes.
  const [refreshedRole, setRefreshedRole] = useState(null);

  // True while the async refresh is in flight.
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await refreshRoleFromServer();
      if (cancelled) return;
      setRefreshedRole(r);
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // The authoritative role: prefer the refreshed value once it
  // arrives; fall back to the synced value while loading.
  const effectiveRole = refreshedRole ?? syncedRole;

  // Resolve the predicate. If `allowed` is provided, use it.
  // Otherwise check against the single `allowedRole` string.
  const predicate = allowed
    ? allowed
    : (role) => (allowedRole != null && role === allowedRole);

  const canAccess = predicate(effectiveRole) && hasLiveSession();

  // While the first server refresh is in flight AND the synced
  // value says allowed, show a loading spinner so we don't flash
  // the body before the server confirms.
  if (refreshing && predicate(syncedRole) && hasLiveSession()) {
    return renderLoading ? renderLoading() : <RoleGuardLoading />;
  }

  if (!canAccess) {
    return renderAccessDenied ? renderAccessDenied() : <AccessDenied />;
  }

  return children;
}

function RoleGuardLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: C?.black ?? "#0B0D12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `2px solid ${C?.border ?? "#242938"}`,
        borderTopColor: C?.red ?? "#E23A4E",
        animation: "onyx-role-guard-spin 0.8s linear infinite",
      }} />
      <style>{`
        @keyframes onyx-role-guard-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      minHeight: "100vh",
      background: C?.black ?? "#0B0D12",
      color: C?.white ?? "#F2F3F7",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 32px",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 360,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: C?.redBg ?? "rgba(226,58,78,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke={C?.red ?? "#E23A4E"} strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div style={{
          fontSize: 18, fontWeight: 600, marginBottom: 8,
          color: C?.white ?? "#F2F3F7",
        }}>
          Access Restricted
        </div>
        <div style={{
          fontSize: 13, lineHeight: 1.5,
          color: C?.gray ?? "#8B93A7",
        }}>
          Your account does not have permission to view this screen.
          If you believe this is an error, please contact the
          administrator.
        </div>
      </div>
    </div>
  );
}
