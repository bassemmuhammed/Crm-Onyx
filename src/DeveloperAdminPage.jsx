// ── DeveloperAdminPage.jsx ─────────────────────────────────────────
// P0-7: شاشة أدمن المطور (مطابقة DeveloperAdminScreen في Flutter)
// بسيطة من ناحية التصميم (مطابقة لأسلوب React الحالي)
//
// 3 تبويبات (مطابقة Flutter):
//   1. Pending Bookings — قائمة الحجوزات المعلقة + Approve/Reject
//   2. Inventory Management — قائمة كل الوحدات + Lock/Unlock
//   3. Project Stats — إحصائيات الوحدات والحجوزات

import { useState, useMemo } from "react";
import { C } from "./theme";
import {  getDeveloperBookings,
  getAllUnits,
  approveBooking,
  rejectBooking,
  lockUnit,
  unlockUnit,
  getDeveloperStats,
  UnitStatus,
  BookingStatus,
} from "./developerData";

const TAB_PENDING    = 0;
const TAB_INVENTORY  = 1;
const TAB_STATS      = 2;

export default function DeveloperAdminPage() {
  const [activeTab, setActiveTab] = useState(TAB_PENDING);
  // re-render trigger بعد أي mutation
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const bookings = useMemo(() => getDeveloperBookings(), []);
  const units    = useMemo(() => getAllUnits(), []);
  const stats    = useMemo(() => getDeveloperStats(), [bookings, units]);

  const pendingBookings   = bookings.filter(b => b.status === BookingStatus.PENDING);
  const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
  const rejectedBookings  = bookings.filter(b => b.status === BookingStatus.REJECTED);

  const handleApprove = (bookingId) => {
    approveBooking(bookingId, "Approved by admin");
    refresh();
  };

  const handleReject = (bookingId) => {
    rejectBooking(bookingId, "Rejected by admin");
    refresh();
  };

  const handleLock = (unitId) => {
    lockUnit(unitId);
    refresh();
  };

  const handleUnlock = (unitId) => {
    unlockUnit(unitId);
    refresh();
  };

  return (
    <div style={{
      fontFamily: "Inter, sans-serif",
      background: "transparent",
      color: C.white,
      colorScheme: "dark",
      userSelect: "none",
      WebkitUserSelect: "none",
      minHeight: "100%",
      paddingBottom: 100,
    }}>
      {/* ── Tabs ── */}
      <div style={{
        display: "flex", gap: 0, padding: "12px 14px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {[
          { value: TAB_PENDING,   label: `Pending (${pendingBookings.length})` },
          { value: TAB_INVENTORY, label: `Inventory (${units.length})` },
          { value: TAB_STATS,     label: "Stats" },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            style={{
              flex: 1, padding: "8px 4px",
              background: activeTab === t.value ? `${C.red}15` : "transparent",
              border: "none",
              borderBottom: activeTab === t.value ? `2px solid ${C.red}` : `2px solid transparent`,
              color: activeTab === t.value ? C.white : C.gray,
              fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: "12px 14px" }}>
        {activeTab === TAB_PENDING && (
          <PendingBookingsTab
            pending={pendingBookings}
            confirmed={confirmedBookings}
            rejected={rejectedBookings}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {activeTab === TAB_INVENTORY && (
          <InventoryTab units={units} onLock={handleLock} onUnlock={handleUnlock} />
        )}
        {activeTab === TAB_STATS && (
          <StatsTab stats={stats} />
        )}
      </div>
    </div>
  );
}

// ── Pending Bookings Tab ──
function PendingBookingsTab({ pending, confirmed, rejected, onApprove, onReject }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Pending */}
      <div>
        <div style={{ fontSize: ".72rem", fontWeight: 800, color: C.amber, marginBottom: 8, textTransform: "uppercase" }}>
          ⏳ Pending ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.gray, fontSize: ".78rem" }}>
            No pending bookings
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onApprove={() => onApprove(b.id)}
                onReject={() => onReject(b.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <div>
          <div style={{ fontSize: ".72rem", fontWeight: 800, color: C.green, marginBottom: 8, marginTop: 14, textTransform: "uppercase" }}>
            ✅ Confirmed ({confirmed.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {confirmed.map(b => (
              <BookingCard key={b.id} booking={b} readonly />
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div>
          <div style={{ fontSize: ".72rem", fontWeight: 800, color: C.red, marginBottom: 8, marginTop: 14, textTransform: "uppercase" }}>
            ❌ Rejected ({rejected.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rejected.map(b => (
              <BookingCard key={b.id} booking={b} readonly />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, onApprove, onReject, readonly }) {
  const calc = booking.priceSnapshot;
  const statusColor = booking.status === BookingStatus.PENDING ? C.amber
                    : booking.status === BookingStatus.CONFIRMED ? C.green
                    : C.red;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${statusColor}`,
      borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.white }}>
            {booking.unitCode} — {booking.buyerName}
          </div>
          <div style={{ fontSize: ".6rem", color: C.gray, marginTop: 2 }}>
            Sales: {booking.salesName} · {booking.buyerPhone}
          </div>
          {booking.note && (
            <div style={{ fontSize: ".6rem", color: C.silver, marginTop: 4, fontStyle: "italic" }}>
              "{booking.note}"
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: ".58rem", fontWeight: 700, color: statusColor,
            background: `${statusColor}18`, padding: "2px 6px", borderRadius: 5,
            marginBottom: 4,
          }}>
            {booking.status.toUpperCase()}
          </div>
          <div style={{ fontSize: ".7rem", fontWeight: 700, color: C.green }}>
            EGP {calc?.finalTotal?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}
          </div>
        </div>
      </div>

      {/* Approve / Reject buttons (فقط للـ pending وغير readonly) */}
      {!readonly && booking.status === BookingStatus.PENDING && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1, padding: "6px", borderRadius: 6,
              background: C.green, color: C.white, border: "none",
              fontSize: ".6rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ✓ Approve
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1, padding: "6px", borderRadius: 6,
              background: C.red, color: C.white, border: "none",
              fontSize: ".6rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ✕ Reject
          </button>
        </div>
      )}

      {/* Admin note (للـ confirmed/rejected) */}
      {booking.adminNote && booking.decidedAt && (
        <div style={{
          fontSize: ".55rem", color: C.gray, marginTop: 6, fontStyle: "italic",
        }}>
          Admin: {booking.adminNote} · {new Date(booking.decidedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// ── Inventory Tab ──
function InventoryTab({ units, onLock, onUnlock }) {
  const [filter, setFilter] = useState("all");

  const filtered = units.filter(u => filter === "all" || u.status === filter);

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { value: "all",                     label: `All (${units.length})` },
          { value: UnitStatus.AVAILABLE,      label: `Available (${units.filter(u => u.status === UnitStatus.AVAILABLE).length})` },
          { value: UnitStatus.RESERVED,       label: `Reserved (${units.filter(u => u.status === UnitStatus.RESERVED).length})` },
          { value: UnitStatus.SOLD,           label: `Sold (${units.filter(u => u.status === UnitStatus.SOLD).length})` },
          { value: UnitStatus.LOCKED,         label: `Locked (${units.filter(u => u.status === UnitStatus.LOCKED).length})` },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "4px 8px", borderRadius: 5,
              border: filter === opt.value ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
              background: filter === opt.value ? `${C.red}15` : C.cardAlt,
              color: filter === opt.value ? C.white : C.gray,
              fontSize: ".58rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Units list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(u => {
          const statusMeta = {
            [UnitStatus.AVAILABLE]: { label: "Available", color: C.green },
            [UnitStatus.RESERVED]:  { label: "Reserved",  color: C.amber },
            [UnitStatus.SOLD]:      { label: "Sold",      color: C.red },
            [UnitStatus.LOCKED]:    { label: "Locked",    color: C.gray },
          }[u.status];

          const canToggleLock = u.status === UnitStatus.AVAILABLE || u.status === UnitStatus.LOCKED;

          return (
            <div key={u.id} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${statusMeta.color}`,
              borderRadius: 8, padding: "8px 10px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: C.white }}>
                  {u.code}
                </div>
                <div style={{ fontSize: ".58rem", color: C.gray, marginTop: 1 }}>
                  Floor {u.floor} · {u.areaSqm}m² · {u.bedrooms}BR
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  fontSize: ".55rem", fontWeight: 700, color: statusMeta.color,
                  background: `${statusMeta.color}18`,
                  padding: "2px 6px", borderRadius: 4,
                }}>
                  {statusMeta.label}
                </div>
                {canToggleLock && (
                  <button
                    onClick={() => u.status === UnitStatus.LOCKED ? onUnlock(u.id) : onLock(u.id)}
                    style={{
                      padding: "3px 8px", borderRadius: 5,
                      background: u.status === UnitStatus.LOCKED ? C.green : C.gray,
                      color: C.white, border: "none",
                      fontSize: ".55rem", fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {u.status === UnitStatus.LOCKED ? "🔓 Unlock" : "🔒 Lock"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Tab ──
function StatsTab({ stats }) {
  const { unitCounts, bookingCounts, totalUnits } = stats;

  return (
    <div>
      {/* Unit stats */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: ".72rem", fontWeight: 800, color: C.silver, marginBottom: 8, textTransform: "uppercase" }}>
          🏢 Units (Total: {totalUnits})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <StatCard label="Available" value={unitCounts.available} color={C.green} />
          <StatCard label="Reserved"  value={unitCounts.reserved}  color={C.amber} />
          <StatCard label="Sold"      value={unitCounts.sold}      color={C.red} />
          <StatCard label="Locked"    value={unitCounts.locked}    color={C.gray} />
        </div>
      </div>

      {/* Booking stats */}
      <div>
        <div style={{ fontSize: ".72rem", fontWeight: 800, color: C.silver, marginBottom: 8, textTransform: "uppercase" }}>
          📋 Bookings
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <StatCard label="Pending"   value={bookingCounts.pending}   color={C.amber} />
          <StatCard label="Confirmed" value={bookingCounts.confirmed} color={C.green} />
          <StatCard label="Rejected"  value={bookingCounts.rejected}  color={C.red} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ fontSize: ".55rem", color: C.gray, fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: color, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
