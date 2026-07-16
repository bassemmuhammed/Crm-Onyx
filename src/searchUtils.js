// ── searchUtils.js ─────────────────────────────────────────────────
// P2-4: Fuzzy Search + P2-5: Date Range Filter
// (مطابقة utils/search.dart و DateRangeFilter في Flutter)

// ══════════════════════════════════════════════════════════════════
// P2-4: FUZZY SEARCH (subsequence matching)
// مطابقة utils/search.dart في Flutter
// ══════════════════════════════════════════════════════════════════

// fuzzyMatch: يتحقق إذا كان الـ query هو subsequence من الـ target
// مثال: fuzzyMatch("bso", "Bassem") = true (b-a-s-s-e-m → b-s-o? لا، لكن "baso" = true)
// يدعم Arabic و English
export function fuzzyMatch(query, target) {
  if (!query || !query.trim()) return true;  // empty query matches everything
  if (!target) return false;
  const q = String(query).toLowerCase().trim();
  const t = String(target).toLowerCase();
  if (q.length === 0) return true;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
    }
  }
  return qi === q.length;
}

// multiFieldSearch: يبحث في عدة حقول
// fields: array of strings (قيم الحقول للبحث فيها)
// query: النص المطلوب البحث عنه
// useFuzzy: إذا true، يستخدم fuzzy matching؛ إذا false، يستخدم substring
export function multiFieldSearch(fields, query, useFuzzy = false) {
  if (!query || !query.trim()) return true;
  const q = query.trim();

  for (const field of fields) {
    if (field == null) continue;
    const fieldStr = String(field);
    if (useFuzzy) {
      if (fuzzyMatch(q, fieldStr)) return true;
    } else {
      if (fieldStr.toLowerCase().includes(q.toLowerCase())) return true;
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════════════════
// P2-5: DATE RANGE FILTER
// مطابقة DateRangeFilter في Flutter
// ══════════════════════════════════════════════════════════════════

// isWithinDateRange: يتحقق إذا كان التاريخ ضمن النطاق
// dateStr: التاريخ كـ string (ISO أو YYYY-MM-DD)
// dateFrom: بداية النطاق (YYYY-MM-DD) أو null
// dateTo: نهاية النطاق (YYYY-MM-DD) أو null
export function isWithinDateRange(dateStr, dateFrom, dateTo) {
  if (!dateStr) return false;
  if (!dateFrom && !dateTo) return true; // مفيش فلتر

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (date < from) return false;
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (date > to) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// formatRangeLabel: نص وصفي للنطاق
export function formatRangeLabel(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return "All dates";
  if (dateFrom && dateTo) {
    return `${dateFrom} → ${dateTo}`;
  }
  if (dateFrom) return `From ${dateFrom}`;
  if (dateTo) return `Until ${dateTo}`;
}
