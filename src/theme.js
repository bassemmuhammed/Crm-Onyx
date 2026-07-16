// ── theme.js ───────────────────────────────────────────────────────
// نظام الألوان المركزي الموحّد — Light Theme (ONYX CRM)
//
// هذا هو المصدر الوحيد للحقيقة (single source of truth) لكل الألوان في التطبيق.
// ممنوع استخدام أي hardcoded hex value في أي component — استورد من هنا فقط.
//
// لتحديث لون في كل التطبيق: عدّله هنا فقط.

// ══════════════════════════════════════════════════════════════════
// CSS VARIABLES — تُحقن في :root عبر OnyxGlobalStyles في App.jsx
// ══════════════════════════════════════════════════════════════════
export const CSS_VARS = `
  --bg-page: #F5F6FA;
  --bg-surface: #FFFFFF;
  --bg-surface-hover: #F9FAFB;
  --bg-sidebar: #FFFFFF;

  --border-default: #E5E7EB;
  --border-light: #EDEEF2;

  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --text-on-dark: #FFFFFF;

  --primary: #DC2626;
  --primary-hover: #B91C1C;
  --primary-light: #FEE2E2;

  --status-success: #10B981;
  --status-success-bg: #D1FAE5;
  --status-info: #3B82F6;
  --status-info-bg: #DBEAFE;
  --status-warning: #F59E0B;
  --status-warning-bg: #FEF3C7;
  --status-danger: #EF4444;
  --status-danger-bg: #FEE2E2;
  --status-purple: #8B5CF6;
  --status-purple-bg: #EDE9FE;
  --status-orange: #F97316;
  --status-orange-bg: #FFEDD5;
  --status-neutral: #6B7280;
  --status-neutral-bg: #F3F4F6;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
`;

// ══════════════════════════════════════════════════════════════════
// JS VALUES — للاستخدام في inline styles
// ══════════════════════════════════════════════════════════════════

// Backgrounds
export const bg = {
  page:           "#F5F6FA",
  surface:        "#FFFFFF",
  surfaceHover:   "#F9FAFB",
  sidebar:        "#FFFFFF",
  input:          "#F9FAFB",
  overlay:        "rgba(0,0,0,0.5)",
};

// Borders
export const border = {
  default: "#E5E7EB",
  light:   "#EDEEF2",
};

// Text
export const text = {
  primary:   "#1A1A2E",
  secondary: "#6B7280",
  muted:     "#9CA3AF",
  onDark:    "#FFFFFF",
  white:     "#FFFFFF",  // alias
};

// Primary (Brand)
export const primary = {
  main:   "#DC2626",
  hover:  "#B91C1C",
  light:  "#FEE2E2",
};

// Status
export const status = {
  success: { color: "#10B981", bg: "#D1FAE5" },
  info:    { color: "#3B82F6", bg: "#DBEAFE" },
  warning: { color: "#F59E0B", bg: "#FEF3C7" },
  danger:  { color: "#EF4444", bg: "#FEE2E2" },
  purple:  { color: "#8B5CF6", bg: "#EDE9FE" },
  orange:  { color: "#F97316", bg: "#FFEDD5" },
  neutral: { color: "#6B7280", bg: "#F3F4F6" },
};

// Shadows
export const shadow = {
  sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 12px rgba(0,0,0,0.1)",
  lg: "0 10px 25px rgba(0,0,0,0.15)",
};

// Radius
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  full: 9999,
};

// Layout
export const layout = {
  sidebarWidth:     240,
  mobileBreakpoint: 1024,
  contentPadding:   24,
  contentMaxWidth:  1200,
  cardPadding:      18,
  cardGap:          12,
};

// ══════════════════════════════════════════════════════════════════
// LEAD STATUS META — بيانات الـ Lead statuses
// ══════════════════════════════════════════════════════════════════
export const LEAD_STATUS_META = {
  new:              { label: "New",              ...status.success },
  callback:         { label: "Call Back",        ...status.warning },
  pendingMeeting:   { label: "Pending Meeting",  ...status.orange  },
  meetingDone:      { label: "Meeting Done",     ...status.info    },
  deal:             { label: "Deal",             ...status.success },
  onGoing:          { label: "On Going",         ...status.info    },
  lowBudget:        { label: "Low Budget",       ...status.warning },
  noAnswer:         { label: "No Answer",        ...status.neutral },
  notInterested:    { label: "Not Interested",   ...status.danger  },
  chooseCompetitor: { label: "Competitor",       ...status.danger  },
  longTerm:         { label: "Long Term",        ...status.purple  },
  closed:           { label: "Closed",           ...status.neutral },
  duplicate:        { label: "Duplicate",        ...status.neutral },
};

// ══════════════════════════════════════════════════════════════════
// COMPATIBILITY OBJECT — C (للتوافق مع الكود القديم)
// كل ملف يستورد C من هنا بدلاً من تعريفه محلياً
// ══════════════════════════════════════════════════════════════════
export const C = {
  // Backgrounds
  black:     bg.page,
  surface:   bg.page,
  card:      bg.surface,
  cardAlt:   bg.surfaceHover,
  cardHover: bg.surfaceHover,
  unread:    bg.surfaceHover,

  // Borders
  border:    border.default,
  borderLt:  border.light,
  divider:   border.light,

  // Text
  white:    text.primary,        // legacy: كان أبيض، الآن أساسي
  silver:   text.primary,        // legacy: كان فضي، الآن أساسي
  gray:     text.secondary,
  muted:    text.muted,

  // Primary
  red:      primary.main,
  redLight: primary.hover,
  redBg:    primary.light,

  // Status (legacy aliases)
  green:    status.success.color,
  greenBg:  status.success.bg,
  blue:     status.info.color,
  blueBg:   status.info.bg,
  amber:    status.warning.color,
  amberBg:  status.warning.bg,
  orange:   status.orange.color,
  orangeBg: status.orange.bg,
  purple:   status.purple.color,
  purpleBg: status.purple.bg,
};

// Aliases للظلال (للتوافق)
export const shadows = shadow;

export default C;
