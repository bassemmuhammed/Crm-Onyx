// ── theme.test.js ──────────────────────────────────────────────────
// P3-2: Tests لـ theme.js (التأكد من صحة الألوان)

import { describe, it, expect } from 'vitest';
import { C, bg, text, primary, status, LEAD_STATUS_META } from '../theme.js';

describe('theme C object', () => {
  it('has all required background colors', () => {
    expect(C.black).toBeDefined();
    expect(C.card).toBeDefined();
    expect(C.cardAlt).toBeDefined();
  });

  it('has all required border colors', () => {
    expect(C.border).toBeDefined();
    expect(C.divider).toBeDefined();
  });

  it('has all required text colors', () => {
    expect(C.white).toBeDefined();
    expect(C.silver).toBeDefined();
    expect(C.gray).toBeDefined();
  });

  it('has primary red color', () => {
    expect(C.red).toBeDefined();
    expect(C.redLight).toBeDefined();
  });

  it('has all status colors', () => {
    expect(C.green).toBeDefined();
    expect(C.blue).toBeDefined();
    expect(C.amber).toBeDefined();
    expect(C.orange).toBeDefined();
    expect(C.purple).toBeDefined();
  });
});

describe('LEAD_STATUS_META', () => {
  it('has all 13 lead statuses', () => {
    const expectedStatuses = [
      'new', 'callback', 'pendingMeeting', 'meetingDone', 'deal',
      'onGoing', 'lowBudget', 'noAnswer', 'notInterested',
      'chooseCompetitor', 'longTerm', 'closed', 'duplicate'
    ];
    for (const status of expectedStatuses) {
      expect(LEAD_STATUS_META[status]).toBeDefined();
      expect(LEAD_STATUS_META[status].label).toBeDefined();
      expect(LEAD_STATUS_META[status].color).toBeDefined();
    }
  });

  it('each status has label, color, and bg', () => {
    for (const key of Object.keys(LEAD_STATUS_META)) {
      const meta = LEAD_STATUS_META[key];
      expect(meta.label).toBeTypeOf('string');
      expect(meta.color).toBeTypeOf('string');
      expect(meta.bg).toBeTypeOf('string');
    }
  });
});
