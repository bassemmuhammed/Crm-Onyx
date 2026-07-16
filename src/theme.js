// ── theme.js ───────────────────────────────────────────────────────
// نظام الألوان المركزي — Light Theme (ONYX CRM)
//
// كل مكونات التطبيق تستورد القيم من هنا لضمان الاتساق.
// لتغيير لون في كل التطبيق: عدّله هنا فقط.

// ══════════════════════════════════════════════════════════════════
// BACKGROUNDS — الخلفيات
// ══════════════════════════════════════════════════════════════════
export const backgrounds = {
  page:        "#F5F6FA",  // خلفية الصفحة الرئيسية
  sidebar:     "#FFFFFF",  // خلفية الـ Sidebar
  card:        "#FFFFFF",  // خلفية الكروت
  header:      "#FFFFFF",  // خلفية الـ Header/Topbar
  cardAlt:     "#F9FAFB",  // خلفية ثانوية للكروت (hover states, inputs)
  input:       "#F9FAFB",  // خلفية حقول الإدخال
  hover:       "#F3F4F6",  // خلفية عامة عند hover
};

// ══════════════════════════════════════════════════════════════════
// BORDERS / DIVIDERS — الحدود والفواصل
// ══════════════════════════════════════════════════════════════════
export const borders = {
  card:      "#E5E7EB",  // حدود الكروت
  divider:   "#EDEEF2",  // خط فاصل عام
  input:     "#E5E7EB",  // حدود حقول الإدخال
  sidebar:   "#E5E7EB",  // حدود الـ sidebar
  light:     "#F3F4F6",  // حدود خفيفة جداً
};

// ══════════════════════════════════════════════════════════════════
// TEXT — النصوص
// ══════════════════════════════════════════════════════════════════
export const text = {
  primary:     "#1A1A2E",  // نص أساسي (عناوين، أسماء)
  secondary:   "#6B7280",  // نص ثانوي (تفاصيل، أرقام تليفون)
  muted:       "#9CA3AF",  // نص باهت جداً (placeholders)
  white:       "#FFFFFF",
  inverse:     "#FFFFFF",  // نص على خلفيات داكنة
};

// ══════════════════════════════════════════════════════════════════
// PRIMARY / ACCENT — اللون المميز (أحمر ONYX)
// ══════════════════════════════════════════════════════════════════
export const primary = {
  main:        "#DC2626",  // أحمر أساسي
  hover:       "#B91C1C",  // أحمر عند hover
  light:       "#FEE2E2",  // أحمر فاتح للخلفيات الثانوية (badges)
  lighter:     "#FEF2F2",  // أحمر فاتح جداً
  dark:        "#991B1B",  // أحمر داكن
};

// ══════════════════════════════════════════════════════════════════
// STATUS COLORS — ألوان الحالات (للبادجات)
// ══════════════════════════════════════════════════════════════════
export const status = {
  // أخضر (New/نشط)
  green:      { color: "#10B981", bg: "#D1FAE5" },
  // بنفسجي (Long Term)
  purple:     { color: "#8B5CF6", bg: "#EDE9FE" },
  // أصفر/برتقالي (تحذير)
  amber:      { color: "#F59E0B", bg: "#FEF3C7" },
  // رمادي (افتراضي)
  gray:       { color: "#6B7280", bg: "#F3F4F6" },
  // أحمر (خطر/مرفوض)
  red:        { color: "#DC2626", bg: "#FEE2E2" },
  // أزرق (معلومات)
  blue:       { color: "#2563EB", bg: "#DBEAFE" },
  // برتقالي (تنبيه)
  orange:     { color: "#F97316", bg: "#FFEDD5" },
};

// ══════════════════════════════════════════════════════════════════
// SHADOWS — الظلال
// ══════════════════════════════════════════════════════════════════
export const shadows = {
  // ظل خفيف للكروت العادية
  sm:    "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
  // ظل متوسط للكروت المرفوعة (hover, modals)
  md:    "0 4px 12px rgba(0, 0, 0, 0.1)",
  // ظل قوي للـ dropdowns و modals
  lg:    "0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)",
  // ظل للـ active/focused elements
  focus: "0 0 0 3px rgba(220, 38, 38, 0.15)",
};

// ══════════════════════════════════════════════════════════════════
// LAYOUT — أبعاد ثابتة
// ══════════════════════════════════════════════════════════════════
export const layout = {
  sidebarWidth:      240,        // عرض الـ sidebar في desktop
  mobileBreakpoint:  1024,       // breakpoint للـ mobile
  contentPadding:    24,         // padding لمنطقة المحتوى
  contentMaxWidth:   1200,       // max-width للمحتوى
  cardPadding:       18,         // padding داخلي للكروت
  cardRadius:        12,         // border-radius للكروت
  cardGap:           12,         // مسافة بين الكروت
  pillRadius:        9999,       // border-radius للـ badges (دائري)
};

// ══════════════════════════════════════════════════════════════════
// COMPATIBILITY — اختصارات للتوافق مع الكود القديم
// (الكود القديم يستخدم C.black, C.card, C.red, إلخ)
// ══════════════════════════════════════════════════════════════════
export const C = {
  // Backgrounds
  black:    backgrounds.page,     // legacy: كان أسود، الآن خلفية الصفحة
  surface:  backgrounds.page,
  card:     backgrounds.card,
  cardAlt:  backgrounds.cardAlt,
  cardHover: backgrounds.hover,
  unread:   backgrounds.cardAlt,

  // Borders
  border:    borders.card,
  borderLt:  borders.light,
  divider:   borders.divider,

  // Text
  white:    text.white,
  silver:   text.primary,         // legacy: كان فضي، الآن أساسي
  gray:     text.secondary,
  muted:    text.muted,

  // Primary (أحمر)
  red:      primary.main,
  redLight: primary.hover,
  redBg:    primary.light,

  // Status
  green:    status.green.color,
  greenBg:  status.green.bg,
  blue:     status.blue.color,
  blueBg:   status.blue.bg,
  amber:    status.amber.color,
  amberBg:  status.amber.bg,
  orange:   status.orange.color,
  orangeBg: status.orange.bg,
  purple:   status.purple.color,
  purpleBg: status.purple.bg,
};

// ══════════════════════════════════════════════════════════════════
// STATUS META — بيانات الـ Lead statuses (للـ badges)
// ══════════════════════════════════════════════════════════════════
export const LEAD_STATUS_META = {
  new:              { label: "New",              color: status.green.color,  bg: status.green.bg  },
  callback:         { label: "Call Back",        color: status.amber.color,  bg: status.amber.bg  },
  pendingMeeting:   { label: "Pending Meeting",  color: status.orange.color, bg: status.orange.bg },
  meetingDone:      { label: "Meeting Done",     color: status.blue.color,   bg: status.blue.bg   },
  deal:             { label: "Deal",             color: status.green.color,  bg: status.green.bg  },
  onGoing:          { label: "On Going",         color: status.blue.color,   bg: status.blue.bg   },
  lowBudget:        { label: "Low Budget",       color: status.amber.color,  bg: status.amber.bg  },
  noAnswer:         { label: "No Answer",        color: status.gray.color,   bg: status.gray.bg   },
  notInterested:    { label: "Not Interested",   color: status.red.color,    bg: status.red.bg    },
  chooseCompetitor: { label: "Competitor",       color: status.red.color,    bg: status.red.bg    },
  longTerm:         { label: "Long Term",        color: status.purple.color, bg: status.purple.bg },
  closed:           { label: "Closed",           color: status.gray.color,   bg: status.gray.bg   },
  duplicate:        { label: "Duplicate",        color: status.gray.color,   bg: status.gray.bg   },
};

export default C;
