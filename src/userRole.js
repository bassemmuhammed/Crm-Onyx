// ── userRole.js ──────────────────────────────────────────────────────
// ONYX CRM — Unified 4-role permission system (React port of Flutter's
// lib/models/user_role.dart)
//
// Roles (stored as lowercase strings in the `users.role` column):
//   'admin'        → admin        (Home, Leads, Add Project, Settings)
//   'sales'        → sales        (Home, Leads, Projects)
//   'admin_broker' → adminBroker  (Home, Leads, Add Project, Settings, Inventory)
//   'sales_broker' → salesBroker  (Home, Leads, Units)
//
// Hierarchy:
//   Each `sales_broker` is linked to exactly one `admin_broker` via the
//   `broker_admin_id` column on the `users` table. An `admin_broker`
//   can see only the units/bookings of the `sales_broker` accounts that
//   belong to them (filtered via RLS — see SQL migration).
//
// Legacy role 'owner' is still recognised and treated as admin-like
// (same access as 'admin').

/**
 * The four first-class roles the app distinguishes between.
 *
 * Use `userRoleFromString` / `userRoleFromUserMap` to convert the raw
 * DB value into the enum-like string. Unknown / null values default
 * to 'sales' (fail-safe — never accidentally grant admin privileges).
 */
export const UserRole = Object.freeze({
  admin:        "admin",
  sales:        "sales",
  adminBroker:  "admin_broker",
  salesBroker:  "sales_broker",
});

/**
 * Parse the raw string coming from Supabase.
 *
 * - 'admin'        → UserRole.admin
 * - 'admin_broker' → UserRole.adminBroker
 * - 'sales_broker' → UserRole.salesBroker
 * - 'sales' / 'agent' / unknown / null → UserRole.sales (fail-safe)
 * - 'owner'        → UserRole.admin (legacy — owner treated as admin)
 */
export function userRoleFromString(raw) {
  if (raw == null) return UserRole.sales;
  const s = String(raw).trim().toLowerCase();
  switch (s) {
    case "admin":
      return UserRole.admin;
    case "admin_broker":
      return UserRole.adminBroker;
    case "sales_broker":
      return UserRole.salesBroker;
    case "owner":
      // Legacy owner role — treated as admin (full access).
      return UserRole.admin;
    case "sales":
    case "agent":
    case "broker":
      return UserRole.sales;
    default:
      return UserRole.sales;
  }
}

/**
 * Convenience: derive the role from the user map (the same map that's
 * passed around the app from login/splash).
 */
export function userRoleFromUserMap(user) {
  if (!user) return UserRole.sales;
  return userRoleFromString(user.role);
}

/**
 * Convenience getters — encode the permission table from the brief:
 *
 *   | Role         | Home | Leads | AddProject | Settings | Projects | Units | Inventory |
 *   |--------------|:----:|:-----:|:----------:|:--------:|:--------:|:-----:|:---------:|
 *   | admin        |  ✓   |   ✓   |     ✓      |    ✓     |          |       |           |
 *   | sales        |  ✓   |   ✓   |            |          |    ✓     |       |           |
 *   | admin_broker |  ✓   |   ✓   |     ✓      |    ✓     |          |       |     ✓     |
 *   | sales_broker |  ✓   |   ✓   |            |          |          |   ✓   |           |
 */

/** Admin-like: can add projects, manage settings, assign leads.
 *  True for admin and admin_broker (and legacy 'owner'). */
export function isAdminLikeRole(role) {
  const r = userRoleFromString(role);
  return r === UserRole.admin || r === UserRole.adminBroker;
}

/** Sales-like: sees the sales variant of the Home screen and the sales
 *  lead detail UI (Share button instead of Assign).
 *  True for sales and sales_broker. */
export function isSalesLikeRole(role) {
  const r = userRoleFromString(role);
  return r === UserRole.sales || r === UserRole.salesBroker;
}

/** True only for admin_broker — can access the Inventory screen
 *  (formerly called "Admin"). */
export function canAccessInventory(role) {
  return userRoleFromString(role) === UserRole.adminBroker;
}

/** True only for sales_broker — can access the Units screen. */
export function canAccessUnits(role) {
  return userRoleFromString(role) === UserRole.salesBroker;
}

/** True for admin and admin_broker — can add/edit projects. */
export function canAccessAddProject(role) {
  return isAdminLikeRole(role);
}

/** True for admin and admin_broker — can change app settings. */
export function canAccessSettings(role) {
  return isAdminLikeRole(role);
}

/** True only for sales — can see the Projects tab.
 *  Note: sales_broker does NOT see Projects (they see Units instead). */
export function canAccessProjects(role) {
  return userRoleFromString(role) === UserRole.sales;
}

/** Broker-tier accounts (have a parent/child relationship).
 *  True for admin_broker and sales_broker. */
export function isBrokerTier(role) {
  const r = userRoleFromString(role);
  return r === UserRole.adminBroker || r === UserRole.salesBroker;
}

/** Human-readable label for display in profile / settings. */
export function userRoleLabel(role) {
  switch (userRoleFromString(role)) {
    case UserRole.admin:
      return "Admin";
    case UserRole.sales:
      return "Sales";
    case UserRole.adminBroker:
      return "Broker Admin";
    case UserRole.salesBroker:
      return "Broker Sales";
    default:
      return "Sales";
  }
}
