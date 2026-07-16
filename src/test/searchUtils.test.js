// ── searchUtils.test.js ────────────────────────────────────────────
// P3-2: Tests لـ searchUtils (Fuzzy Search + Date Range Filter)

import { describe, it, expect } from 'vitest';
import { fuzzyMatch, multiFieldSearch, isWithinDateRange, formatRangeLabel } from '../searchUtils.js';

describe('fuzzyMatch', () => {
  it('returns true for empty query', () => {
    expect(fuzzyMatch('', 'anything')).toBe(true);
  });

  it('returns false for empty target', () => {
    expect(fuzzyMatch('test', '')).toBe(false);
  });

  it('matches exact subsequence', () => {
    expect(fuzzyMatch('bsm', 'bassem')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(fuzzyMatch('BSM', 'bassem')).toBe(true);
  });

  it('returns false for non-subsequence', () => {
    expect(fuzzyMatch('xyz', 'bassem')).toBe(false);
  });

  it('matches full string', () => {
    expect(fuzzyMatch('bassem', 'bassem')).toBe(true);
  });

  it('handles Arabic text', () => {
    expect(fuzzyMatch('بس', 'باسم')).toBe(true);
  });
});

describe('multiFieldSearch', () => {
  it('returns true for empty query', () => {
    expect(multiFieldSearch(['name', 'phone'], '')).toBe(true);
  });

  it('finds match in first field (substring)', () => {
    expect(multiFieldSearch(['Bassem', '12345'], 'bas')).toBe(true);
  });

  it('finds match in second field (substring)', () => {
    expect(multiFieldSearch(['Bassem', '12345'], '234')).toBe(true);
  });

  it('returns false when no match', () => {
    expect(multiFieldSearch(['Bassem', '12345'], 'xyz')).toBe(false);
  });

  it('works with fuzzy matching', () => {
    expect(multiFieldSearch(['Bassem', '12345'], 'bsm', true)).toBe(true);
  });

  it('handles null fields', () => {
    expect(multiFieldSearch([null, '12345'], '123')).toBe(true);
  });
});

describe('isWithinDateRange', () => {
  it('returns true when no filter set', () => {
    expect(isWithinDateRange('2026-01-15', '', '')).toBe(true);
  });

  it('returns true when only dateFrom and date is after', () => {
    expect(isWithinDateRange('2026-01-15', '2026-01-01', '')).toBe(true);
  });

  it('returns false when only dateFrom and date is before', () => {
    expect(isWithinDateRange('2025-12-31', '2026-01-01', '')).toBe(false);
  });

  it('returns true when only dateTo and date is before', () => {
    expect(isWithinDateRange('2026-01-15', '', '2026-01-31')).toBe(true);
  });

  it('returns false when only dateTo and date is after', () => {
    expect(isWithinDateRange('2026-02-15', '', '2026-01-31')).toBe(false);
  });

  it('returns true when date is within range', () => {
    expect(isWithinDateRange('2026-01-15', '2026-01-01', '2026-01-31')).toBe(true);
  });

  it('returns false when date is outside range', () => {
    expect(isWithinDateRange('2026-02-15', '2026-01-01', '2026-01-31')).toBe(false);
  });

  it('returns false for empty date string', () => {
    expect(isWithinDateRange('', '2026-01-01', '2026-01-31')).toBe(false);
  });

  it('handles ISO date strings', () => {
    expect(isWithinDateRange('2026-01-15T10:30:00Z', '2026-01-01', '2026-01-31')).toBe(true);
  });
});

describe('formatRangeLabel', () => {
  it('returns "All dates" when no filter', () => {
    expect(formatRangeLabel('', '')).toBe('All dates');
  });

  it('returns "From X" when only dateFrom', () => {
    expect(formatRangeLabel('2026-01-01', '')).toBe('From 2026-01-01');
  });

  it('returns "Until X" when only dateTo', () => {
    expect(formatRangeLabel('', '2026-01-31')).toBe('Until 2026-01-31');
  });

  it('returns "X → Y" when both set', () => {
    expect(formatRangeLabel('2026-01-01', '2026-01-31')).toBe('2026-01-01 → 2026-01-31');
  });
});
