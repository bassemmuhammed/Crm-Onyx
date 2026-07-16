// ── BulkOperations.jsx ─────────────────────────────────────────────
// P0-3: العمليات المجمعة على Leads (مطابق AdminLeadsController في Flutter)
// يوفر:
//   - Selection mode (long-press لتفعيله، tap لاختيار/إلغاء)
//   - BulkActionBar: تغيير حالة جماعي / توزيع جماعي / حذف جماعي / تصدير CSV
//   - selectAll / clearSelection
//
// الاستخدام:
//   <BulkActionBar
//     selectedIds={[...]}
//     totalFiltered={N}
//     team={[...]}
//     onBulkStatus={(status) => ...}
//     onBulkAssign={(agentId) => ...}
//     onBulkDelete={() => ...}
//     onExportCsv={() => ...}
//     onSelectAll={() => ...}
//     onClear={() => ...}
//   />

import { useState, useEffect } from "react";
import { C } from "./theme";

const STATUS_OPTIONS = [
  { value: "new",            label: "New",            color: "#2563EB" },
  { value: "callback",       label: "Call Back",      color: "#F59E0B" },
  { value: "pendingMeeting", label: "Pending Meeting",color: "#F97316" },
  { value: "meetingDone",    label: "Meeting Done",   color: "#10B981" },
  { value: "deal",           label: "Deal",           color: "#10B981" },
  { value: "onGoing",        label: "On Going",       color: "#2563EB" },
  { value: "lowBudget",      label: "Low Budget",     color: "#F59E0B" },
  { value: "noAnswer",       label: "No Answer",      color: "#6B7280" },
  { value: "notInterested",  label: "Not Interested", color: "#DC2626" },
  { value: "chooseCompetitor", label: "Competitor",   color: "#DC2626" },
  { value: "longTerm",       label: "Long Term",      color: "#6B7280" },
  { value: "closed",         label: "Closed",         color: "#6B7280" },
];

// ─── Bulk Action Bar (overlay at bottom) ──────────────────────────
export function BulkActionBar({
  selectedCount,
  totalFiltered,
  team,
  onBulkStatus,
  onBulkAssign,
  onBulkDelete,
  onExportCsv,
  onSelectAll,
  onClear,
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showAgentPicker, setShowAgentPicker]   = useState(false);
  const [confirmDelete, setConfirmDelete]       = useState(false);

  const allSelected = selectedCount === totalFiltered && selectedCount > 0;

  return (
    <>
      <style>{`
        @keyframes bulkSlideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>

      {/* Main bar */}
      <div style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        animation: "bulkSlideUp 0.25s ease-out",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.red}`,
        borderRadius: 14,
        padding: "10px 12px",
        boxShadow: `0 8px 32px rgba(0,0,0,.6), 0 0 24px ${C.red}33`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "calc(100% - 28px)",
        maxWidth: 420,
        fontFamily: "Archivo, sans-serif",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: ".75rem", fontWeight: 800, color: C.white }}>
            {selectedCount} selected
            <span style={{ color: C.gray, fontWeight: 500, marginLeft: 6 }}>
              of {totalFiltered}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={onSelectAll}
              className="tap-btn"
              style={{
                padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.cardAlt, color: C.silver,
                fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={onClear}
              className="tap-btn"
              style={{
                padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.cardAlt, color: C.gray,
                fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Action buttons row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Bulk Status */}
          <button
            onClick={() => { setShowStatusPicker(true); setShowAgentPicker(false); }}
            className="tap-btn"
            style={{
              padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${C.amber}55`,
              background: `${C.amber}18`, color: C.amber,
              fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ⚡ Set Status
          </button>

          {/* Bulk Assign */}
          <button
            onClick={() => { setShowAgentPicker(true); setShowStatusPicker(false); }}
            className="tap-btn"
            style={{
              padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${C.blue}55`,
              background: `${C.blue}18`, color: C.blue,
              fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            👤 Assign
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="tap-btn"
            style={{
              padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${C.green}55`,
              background: `${C.green}18`, color: C.green,
              fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            📊 Export CSV
          </button>

          {/* Bulk Delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="tap-btn"
            style={{
              padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${C.red}55`,
              background: `${C.red}18`, color: C.red,
              fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            🗑 Delete
          </button>
        </div>

        {/* Status picker dropdown */}
        {showStatusPicker && (
          <div style={{
            background: C.cardAlt, borderRadius: 8, padding: 8,
            border: `1px solid ${C.border}`,
            display: "flex", gap: 5, flexWrap: "wrap",
          }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => { onBulkStatus(s.value); setShowStatusPicker(false); }}
                className="chip-btn"
                style={{
                  padding: "5px 10px", borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: s.color,
                  fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Agent picker dropdown */}
        {showAgentPicker && (
          <div style={{
            background: C.cardAlt, borderRadius: 8, padding: 8,
            border: `1px solid ${C.border}`,
            display: "flex", gap: 5, flexWrap: "wrap",
            maxHeight: 180, overflowY: "auto",
          }}>
            {team.length === 0 && (
              <div style={{ color: C.gray, fontSize: ".7rem", padding: "4px" }}>
                No team members available
              </div>
            )}
            {team.map(t => (
              <button
                key={t.id}
                onClick={() => { onBulkAssign(t.id); setShowAgentPicker(false); }}
                className="chip-btn"
                style={{
                  padding: "5px 10px", borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.silver,
                  fontSize: ".62rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color || C.blue }} />
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Confirm delete popup */}
        {confirmDelete && (
          <div style={{
            background: `${C.red}11`, borderRadius: 8, padding: 10,
            border: `1px solid ${C.red}55`,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ color: C.red, fontSize: ".72rem", fontWeight: 700 }}>
              ⚠️ Delete {selectedCount} leads permanently?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => { onBulkDelete(); setConfirmDelete(false); }}
                className="tap-btn"
                style={{
                  flex: 1, padding: "6px", borderRadius: 6,
                  background: C.red, color: C.white,
                  border: "none", fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="tap-btn"
                style={{
                  flex: 1, padding: "6px", borderRadius: 6,
                  background: C.cardAlt, color: C.silver,
                  border: `1px solid ${C.border}`,
                  fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Selection Checkbox (overlay on each card) ────────────────────
export function SelectionCheckbox({ checked, onToggle }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        position: "absolute",
        top: 8, right: 8,
        width: 22, height: 22, borderRadius: 6,
        border: checked ? `2px solid ${C.red}` : `2px solid ${C.silver}88`,
        background: checked ? C.red : "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10, cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {checked && (
        <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
