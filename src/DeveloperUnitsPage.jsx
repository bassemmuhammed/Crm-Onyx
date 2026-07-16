// ── DeveloperUnitsPage.jsx ─────────────────────────────────────────
// P0-7: شاشة وحدات المطور (مطابقة DeveloperUnitsScreen في Flutter)
// بسيطة من ناحية التصميم (مطابقة لأسلوب React الحالي)
//
// الميزات:
//   - استعراض المباني والوحدات (mock data)
//   - فلترة بالحالة (available/reserved/sold/locked)
//   - Payment Calculator (مطابق Flutter بالضبط)
//   - Booking form (يفتح للوحدات المتاحة فقط)
//   - "Print" button (TODO — مطابق Flutter)

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { C } from "./theme";
import {  getDeveloperProject,
  getAllUnits,
  submitBooking,
  calculatePayment,
  InstallmentFrequency,
  PaymentMode,
  UnitStatus,
  PROJECT_SETTINGS,
} from "./developerData";

const STATUS_META = {
  [UnitStatus.AVAILABLE]: { label: "Available", color: "#10B981" },
  [UnitStatus.RESERVED]:  { label: "Reserved",  color: "#F59E0B" },
  [UnitStatus.SOLD]:      { label: "Sold",      color: "#DC2626" },
  [UnitStatus.LOCKED]:    { label: "Locked",    color: "#6B7280" },
};

export default function DeveloperUnitsPage({ currentUser }) {
  const [project] = useState(() => getDeveloperProject());
  const [filter, setFilter]   = useState("all");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showBooking, setShowBooking]   = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const allUnits = useMemo(() => getAllUnits(), []);

  const filteredUnits = allUnits.filter(u => {
    if (filter === "all") return true;
    return u.status === filter;
  });

  const handleBook = (bookingData) => {
    const booking = submitBooking({
      ...bookingData,
      salesId:   currentUser?.id || "unknown",
      salesName: currentUser?.name || "Unknown Sales",
    });
    setBookingSuccess(booking);
    setShowBooking(false);
    setSelectedUnit(null);
    // بعد 2 ثانية، امسح رسالة النجاح
    setTimeout(() => setBookingSuccess(null), 3000);
  };

  return (
    <div style={{
      fontFamily: "Archivo, sans-serif",
      background: "transparent",
      color: C.white,
      colorScheme: "light",
      userSelect: "none",
      WebkitUserSelect: "none",
      minHeight: "100%",
      paddingBottom: 100,
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Project Header ── */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.red}`,
          borderRadius: 14, padding: "14px 16px",
        }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: C.white }}>
            🏢 {project.name}
          </div>
          <div style={{ fontSize: ".7rem", color: C.gray, marginTop: 4 }}>
            📍 {project.location} · {allUnits.length} units · {project.buildings.length} buildings
          </div>
          <div style={{ fontSize: ".62rem", color: C.silver, marginTop: 6 }}>
            Max Discount: {project.maxDiscountPercent}% · Utilities: EGP {project.utilitiesFee.toLocaleString()} · Maintenance: {project.maintenanceDepositPercent}%
          </div>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 12px", flexWrap: "wrap" }}>
        {[
          { value: "all",                          label: `All (${allUnits.length})` },
          { value: UnitStatus.AVAILABLE,           label: `Available (${allUnits.filter(u => u.status === UnitStatus.AVAILABLE).length})` },
          { value: UnitStatus.RESERVED,            label: `Reserved (${allUnits.filter(u => u.status === UnitStatus.RESERVED).length})` },
          { value: UnitStatus.SOLD,                label: `Sold (${allUnits.filter(u => u.status === UnitStatus.SOLD).length})` },
          { value: UnitStatus.LOCKED,              label: `Locked (${allUnits.filter(u => u.status === UnitStatus.LOCKED).length})` },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "5px 10px", borderRadius: 6,
              border: filter === opt.value ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
              background: filter === opt.value ? `${C.red}15` : C.cardAlt,
              color: filter === opt.value ? C.white : C.gray,
              fontSize: ".6rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Success message ── */}
      {bookingSuccess && (
        <div style={{
          margin: "0 14px 12px",
          background: `${C.green}15`,
          border: `1px solid ${C.green}44`,
          borderRadius: 10, padding: "10px 12px",
          color: C.green, fontSize: ".72rem", fontWeight: 600,
          animation: "fadeIn .3s ease",
        }}>
          ✅ Booking submitted for unit {bookingSuccess.unitCode}! Admin will review it shortly.
        </div>
      )}

      {/* ── Units list ── */}
      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {filteredUnits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: ".82rem" }}>
            No units match this filter
          </div>
        ) : filteredUnits.map(unit => {
          const statusMeta = STATUS_META[unit.status];
          const originalPrice = unit.areaSqm * unit.pricePerMeter;
          const building = project.buildings.find(b => b.id === unit.buildingId);
          return (
            <div key={unit.id} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${statusMeta.color}`,
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: ".82rem", fontWeight: 800, color: C.white }}>
                    {unit.code}
                  </div>
                  <div style={{ fontSize: ".6rem", color: C.gray, marginTop: 2 }}>
                    {building?.name} · Floor {unit.floor}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <Chip label={`${unit.areaSqm} m²`} color={C.blue} />
                    <Chip label={`${unit.bedrooms} BR`} color={C.amber} />
                    <Chip label={`${unit.bathrooms} BA`} color={C.orange} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: ".6rem", fontWeight: 700,
                    color: statusMeta.color,
                    background: `${statusMeta.color}18`,
                    padding: "3px 8px", borderRadius: 6,
                    marginBottom: 4,
                  }}>
                    {statusMeta.label}
                  </div>
                  <div style={{ fontSize: ".65rem", color: C.silver }}>
                    EGP {unit.pricePerMeter.toLocaleString()}/m²
                  </div>
                  <div style={{ fontSize: ".78rem", fontWeight: 700, color: C.white, marginTop: 2 }}>
                    EGP {originalPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {unit.status === UnitStatus.AVAILABLE && (
                <button
                  onClick={() => { setSelectedUnit(unit); setShowBooking(true); }}
                  style={{
                    width: "100%", marginTop: 8, padding: "8px",
                    background: C.green, color: C.white, border: "none",
                    borderRadius: 8, fontSize: ".68rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  🏠 Book This Unit
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Booking Modal ── */}
      {showBooking && selectedUnit && (
        <BookingModal
          unit={selectedUnit}
          project={project}
          onClose={() => { setShowBooking(false); setSelectedUnit(null); }}
          onSubmit={handleBook}
        />
      )}
    </div>
  );
}

function Chip({ label, color }) {
  return (
    <div style={{
      fontSize: ".55rem", fontWeight: 600, color: color,
      background: `${color}15`,
      border: `1px solid ${color}33`,
      padding: "2px 6px", borderRadius: 5,
    }}>
      {label}
    </div>
  );
}

// ── Booking Modal with Payment Calculator ──
function BookingModal({ unit, project, onClose, onSubmit }) {
  const originalPrice = unit.areaSqm * unit.pricePerMeter;

  const [calc, setCalc] = useState({
    paymentMode: PaymentMode.INSTALLMENTS,
    discountPercent: 5,
    downPaymentPercent: 20,
    installmentYears: 5,
    frequency: InstallmentFrequency.QUARTERLY.value,
    utilitiesFee: project.utilitiesFee,
    utilitiesDiscount: 0,
    maintenanceDepositPercent: project.maintenanceDepositPercent,
    maintenanceDiscount: 0,
  });

  const [buyer, setBuyer] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    buyerNationalId: "",
    note: "",
  });

  const setCalcField = (k, v) => setCalc(c => ({ ...c, [k]: v }));
  const setBuyerField = (k, v) => setBuyer(b => ({ ...b, [k]: v }));

  // Live calculation
  const result = calculatePayment({
    originalPrice,
    paymentMode: calc.paymentMode,
    discountPercent: Math.min(calc.discountPercent, project.maxDiscountPercent),
    downPaymentPercent: calc.downPaymentPercent,
    installmentYears: calc.installmentYears,
    frequency: calc.frequency,
    utilitiesFee: calc.utilitiesFee,
    utilitiesDiscount: calc.utilitiesDiscount,
    maintenanceDepositPercent: calc.maintenanceDepositPercent,
    maintenanceDiscount: calc.maintenanceDiscount,
  });

  const handleSubmit = () => {
    if (!buyer.buyerName || !buyer.buyerPhone) {
      alert("Please fill buyer name and phone");
      return;
    }
    onSubmit({
      unit,
      priceSnapshot: result,
      ...buyer,
    });
  };

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", zIndex: 500,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: "20px 20px 0 0", padding: "18px 16px 24px",
        width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto",
        animation: "slideUp 0.25s ease-out",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: ".92rem", fontWeight: 800, color: C.white }}>
              Book Unit {unit.code}
            </div>
            <div style={{ fontSize: ".65rem", color: C.gray, marginTop: 2 }}>
              Original Price: EGP {originalPrice.toLocaleString()}
            </div>
          </div>
          <div onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, background: C.cardAlt,
            border: `1px solid ${C.border}`, display: "flex",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.gray, fontSize: ".8rem",
          }}>✕</div>
        </div>

        {/* ── Payment Calculator ── */}
        <div style={{
          background: C.cardAlt, borderRadius: 10, padding: 12,
          border: `1px solid ${C.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, color: C.silver, marginBottom: 10, textTransform: "uppercase" }}>
            💰 Payment Calculator
          </div>

          {/* Payment Mode */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[PaymentMode.CASH, PaymentMode.INSTALLMENTS].map(m => (
              <button
                key={m}
                onClick={() => setCalcField("paymentMode", m)}
                style={{
                  flex: 1, padding: "8px", borderRadius: 8,
                  border: calc.paymentMode === m ? `1px solid ${C.red}66` : `1px solid ${C.border}`,
                  background: calc.paymentMode === m ? `${C.red}15` : C.card,
                  color: calc.paymentMode === m ? C.white : C.gray,
                  fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Discount */}
          <FieldRow
            label={`Discount % (max ${project.maxDiscountPercent}%)`}
            value={calc.discountPercent}
            onChange={v => setCalcField("discountPercent", Math.min(Number(v) || 0, project.maxDiscountPercent))}
            type="number"
          />

          {/* Down Payment */}
          <FieldRow
            label="Down Payment %"
            value={calc.downPaymentPercent}
            onChange={v => setCalcField("downPaymentPercent", Number(v) || 0)}
            type="number"
          />

          {/* Installments (only if not cash) */}
          {calc.paymentMode === PaymentMode.INSTALLMENTS && (
            <>
              <FieldRow
                label="Installment Years"
                value={calc.installmentYears}
                onChange={v => setCalcField("installmentYears", Number(v) || 0)}
                type="number"
              />
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: ".62rem", color: C.silver, fontWeight: 600, marginBottom: 4, display: "block" }}>
                  Frequency
                </label>
                <select
                  value={calc.frequency}
                  onChange={e => setCalcField("frequency", e.target.value)}
                  style={selectStyle}
                >
                  <option value={InstallmentFrequency.MONTHLY.value}>Monthly (12/yr)</option>
                  <option value={InstallmentFrequency.QUARTERLY.value}>Quarterly (4/yr)</option>
                  <option value={InstallmentFrequency.YEARLY.value}>Yearly (1/yr)</option>
                </select>
              </div>
            </>
          )}

          {/* Utilities */}
          <FieldRow
            label="Utilities Discount %"
            value={calc.utilitiesDiscount}
            onChange={v => setCalcField("utilitiesDiscount", Number(v) || 0)}
            type="number"
          />

          {/* Maintenance */}
          <FieldRow
            label="Maintenance Discount %"
            value={calc.maintenanceDiscount}
            onChange={v => setCalcField("maintenanceDiscount", Number(v) || 0)}
            type="number"
          />

          {/* Result */}
          <div style={{
            background: C.card, borderRadius: 8, padding: 10,
            marginTop: 10, border: `1px solid ${C.green}33`,
          }}>
            <ResultRow label="Price after discount" value={result.priceAfterDiscount} color={C.white} />
            <ResultRow label="Down payment"         value={result.downPayment}        color={C.amber} />
            {result.installmentCount > 0 && (
              <ResultRow
                label={`Installment (${result.installmentCount}x)`}
                value={result.installmentAmount}
                color={C.blue}
              />
            )}
            <ResultRow label="Utilities"            value={result.utilitiesAfter}     color={C.gray} />
            <ResultRow label="Maintenance"          value={result.maintenanceAfter}   color={C.gray} />
            <div style={{
              borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6,
              display: "flex", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: C.green }}>
                Final Total
              </div>
              <div style={{ fontSize: ".82rem", fontWeight: 800, color: C.green }}>
                EGP {result.finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Buyer Info ── */}
        <div style={{
          background: C.cardAlt, borderRadius: 10, padding: 12,
          border: `1px solid ${C.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: ".7rem", fontWeight: 700, color: C.silver, marginBottom: 10, textTransform: "uppercase" }}>
            👤 Buyer Information
          </div>
          <FieldRow label="Buyer Name *"  value={buyer.buyerName}     onChange={v => setBuyerField("buyerName", v)} />
          <FieldRow label="Phone *"       value={buyer.buyerPhone}    onChange={v => setBuyerField("buyerPhone", v)} />
          <FieldRow label="Email"         value={buyer.buyerEmail}    onChange={v => setBuyerField("buyerEmail", v)} />
          <FieldRow label="National ID"   value={buyer.buyerNationalId} onChange={v => setBuyerField("buyerNationalId", v)} />
          <FieldRow label="Note"          value={buyer.note}          onChange={v => setBuyerField("note", v)} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "13px",
            background: C.red, color: C.white,
            border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            cursor: "pointer", boxShadow: `0 6px 20px ${C.red}44`,
          }}
        >
          Submit Booking
        </button>
      </div>
    </div>,
    document.body
  );
}

function FieldRow({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: ".62rem", color: C.silver, fontWeight: 600, marginBottom: 4, display: "block" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function ResultRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <div style={{ fontSize: ".62rem", color: C.gray }}>{label}</div>
      <div style={{ fontSize: ".68rem", fontWeight: 600, color }}>
        EGP {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8,
  border: `1px solid #E5E7EB`, background: "#FFFFFF",
  color: "#1A1A2E", fontSize: ".72rem", fontFamily: "inherit",
  outline: "none",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};
