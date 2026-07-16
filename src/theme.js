// ── theme.js ───────────────────────────────────────────────────────
// نظام التصميم المركزي — Dark Theme (مطابقة الموك أب)
//
// الألوان والخطوط مأخوذة من onyx_dashboard_mockup.html
// هذا هو المصدر الوحيد للحقيقة (single source of truth) لكل الألوان.

// ══════════════════════════════════════════════════════════════════
// CSS VARIABLES — تُحقن في :root عبر OnyxGlobalStyles في App.jsx
// ══════════════════════════════════════════════════════════════════
export const CSS_VARS = `
  --bg-base:#0B0D12;
  --bg-elevated:#12151C;
  --surface:#171B24;
  --surface-hover:#1D2230;
  --border:#242938;
  --border-soft:#1B1F2A;
  --text-primary:#F2F3F7;
  --text-secondary:#8B93A7;
  --text-tertiary:#5B6478;
  --accent:#E23A4E;
  --accent-hover:#FF4C5E;
  --accent-dim:rgba(226,58,78,0.12);
  --success:#2BD97C;
  --success-dim:rgba(43,217,124,0.12);
  --warning:#F2A93B;
  --warning-dim:rgba(242,169,59,0.12);
  --info:#4C8DFF;
  --info-dim:rgba(76,141,255,0.12);
  --violet:#9B7CFF;
  --violet-dim:rgba(155,124,255,0.12);
  --sidebar-w:264px;
  --radius:14px;
  --radius-sm:10px;
  --font-display:'Space Grotesk',sans-serif;
  --font-body:'Inter',sans-serif;
  --font-mono:'JetBrains Mono',monospace;
`;

// ══════════════════════════════════════════════════════════════════
// JS VALUES — للاستخدام في inline styles
// ══════════════════════════════════════════════════════════════════

// Backgrounds
export const bg = {
  base:           "#0B0D12",
  elevated:       "#12151C",
  surface:        "#171B24",
  surfaceHover:   "#1D2230",
  sidebar:        "#12151C",
  input:          "#171B24",
  overlay:        "rgba(0,0,0,0.6)",
};

// Borders
export const border = {
  default: "#242938",
  soft:   "#1B1F2A",
};

// Text
export const text = {
  primary:   "#F2F3F7",
  secondary: "#8B93A7",
  tertiary:  "#5B6478",
  onDark:    "#FFFFFF",
  white:     "#FFFFFF",
};

// Primary (Brand)
export const primary = {
  main:   "#E23A4E",
  hover:  "#FF4C5E",
  dim:    "rgba(226,58,78,0.12)",
};

// Status
export const status = {
  success: { color: "#2BD97C", bg: "rgba(43,217,124,0.12)",  dim: "rgba(43,217,124,0.12)"  },
  info:    { color: "#4C8DFF", bg: "rgba(76,141,255,0.12)",  dim: "rgba(76,141,255,0.12)"  },
  warning: { color: "#F2A93B", bg: "rgba(242,169,59,0.12)",  dim: "rgba(242,169,59,0.12)"  },
  danger:  { color: "#E23A4E", bg: "rgba(226,58,78,0.12)",   dim: "rgba(226,58,78,0.12)"   },
  violet:  { color: "#9B7CFF", bg: "rgba(155,124,255,0.12)", dim: "rgba(155,124,255,0.12)" },
  orange:  { color: "#F2A93B", bg: "rgba(242,169,59,0.12)",  dim: "rgba(242,169,59,0.12)"  },
  neutral: { color: "#8B93A7", bg: "#1D2230",                dim: "#1D2230"                },
};

// Shadows
export const shadow = {
  sm: "0 1px 3px rgba(0,0,0,0.3)",
  md: "0 4px 12px rgba(0,0,0,0.4)",
  lg: "0 10px 25px rgba(0,0,0,0.5)",
  accent: "0 4px 14px rgba(226,58,78,0.35)",
};

// Radius
export const radius = {
  sm:   10,
  md:   14,
  lg:   16,
  full: 9999,
};

// Fonts
export const fonts = {
  display: "'Space Grotesk', sans-serif",
  body:    "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// Layout
export const layout = {
  sidebarWidth:     264,
  mobileBreakpoint: 1024,
  contentPadding:   32,
  contentMaxWidth:  1180,
  cardPadding:      20,
  cardGap:          16,
};

// ══════════════════════════════════════════════════════════════════
// LEAD STATUS META
// ══════════════════════════════════════════════════════════════════
export const LEAD_STATUS_META = {
  new:              { label: "New",              ...status.success },
  callback:         { label: "Call Back",        ...status.warning },
  pendingMeeting:   { label: "Pending Meeting",  ...status.orange  },
  meetingDone:      { label: "Meeting Done",     ...status.violet  },
  deal:             { label: "Deal",             ...status.danger  },
  onGoing:          { label: "On Going",         ...status.info    },
  lowBudget:        { label: "Low Budget",       ...status.warning },
  noAnswer:         { label: "No Answer",        ...status.neutral },
  notInterested:    { label: "Not Interested",   ...status.neutral },
  chooseCompetitor: { label: "Competitor",       ...status.danger  },
  longTerm:         { label: "Long Term",        ...status.violet  },
  closed:           { label: "Closed",           ...status.neutral },
  duplicate:        { label: "Duplicate",        ...status.neutral },
};

// ══════════════════════════════════════════════════════════════════
// COMPATIBILITY OBJECT — C
// ══════════════════════════════════════════════════════════════════
export const C = {
  // Backgrounds
  black:     "#0B0D12",
  surface:   "#0B0D12",
  card:      "#171B24",
  cardAlt:   "#1D2230",
  cardHover: "#1D2230",
  cardGrad1: "#171B24",
  cardGrad2: "#171B24",
  unread:    "#1D2230",

  // Borders
  border:    "#242938",
  borderLt:  "#1B1F2A",
  divider:   "#1B1F2A",

  // Text
  white:     "#F2F3F7",
  silver:    "#F2F3F7",
  gray:      "#8B93A7",
  muted:     "#5B6478",

  // Primary
  red:       "#E23A4E",
  redLight:  "#FF4C5E",
  redBg:     "rgba(226,58,78,0.12)",

  // Status
  green:     "#2BD97C",
  greenBg:   "rgba(43,217,124,0.12)",
  blue:      "#4C8DFF",
  blueBg:    "rgba(76,141,255,0.12)",
  amber:     "#F2A93B",
  amberBg:   "rgba(242,169,59,0.12)",
  orange:    "#F2A93B",
  orangeBg:  "rgba(242,169,59,0.12)",
  purple:    "#9B7CFF",
  purpleBg:  "rgba(155,124,255,0.12)",
};

// Aliases
export const shadows = shadow;

export default C;
