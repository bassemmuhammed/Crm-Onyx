// ── DeepLinkService.js ─────────────────────────────────────────────
// P0-4: Deep Linking لـ set-password flow (مطابق DeepLinkService في Flutter)
//
// الفرق الأساسي بين Flutter و React:
//   - Flutter يستخدم scheme مخصصة `onyxcrm://reset-password?token_hash=...&type=invite`
//   - React (web) يستخدم URL path/hash: `/reset-password#access_token=...&type=invite`
//   لذا الـ DeepLinkService هنا بيتعامل مع:
//     1. URL hash (من Supabase invite email redirect)
//     2. URL search params (fallback)
//     3. popstate event (للتغييرات أثناء التشغيل)
//
// الاستخدام:
//   import { initDeepLinkService, navigateToSetPassword } from "./DeepLinkService";
//   const cleanup = initDeepLinkService((url) => {
//     // اعرض شاشة set-password مع الـ url
//   });
//   // عند الخروج: cleanup();

// أنواع الـ tokens اللي Supabase بيبعتها في الـ email redirect
const SUPPORTED_TOKEN_TYPES = ["invite", "recovery", "signup"];

// استخراج token info من URL
export function parseDeepLinkUrl(url = window.location.href) {
  try {
    const u = new URL(url);
    // 1) hash params (Supabase default: #access_token=...&type=invite)
    const hashParams = new URLSearchParams(u.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const expiresIn = hashParams.get("expires_in");
    const tokenType = hashParams.get("type");
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (accessToken && SUPPORTED_TOKEN_TYPES.includes(tokenType)) {
      return {
        kind: "set_password",
        accessToken,
        refreshToken,
        expiresIn: expiresIn ? parseInt(expiresIn, 10) : null,
        tokenType,
        error: null,
      };
    }

    if (error) {
      return {
        kind: "error",
        error,
        errorDescription: errorDescription || error,
      };
    }

    // 2) query params fallback (old-style: ?token=...&type=recovery)
    const queryParams = u.searchParams;
    const token = queryParams.get("token");
    const type = queryParams.get("type");
    if (token && SUPPORTED_TOKEN_TYPES.includes(type)) {
      return {
        kind: "set_password",
        token,
        tokenType: type,
      };
    }

    return { kind: "none" };
  } catch (e) {
    console.error("DeepLinkService.parseDeepLinkUrl error:", e);
    return { kind: "error", error: "invalid_url", errorDescription: String(e) };
  }
}

// هل الـ URL الحالي هو set-password page؟
export function isSetPasswordUrl(url = window.location.href) {
  const parsed = parseDeepLinkUrl(url);
  return parsed.kind === "set_password";
}

// هل الـ URL الحالي هو reset-password page (الـ flow القديم)؟
export function isResetPasswordUrl(url = window.location.href) {
  const u = new URL(url);
  return u.pathname === "/reset-password" || parseDeepLinkUrl(url).kind === "set_password";
}

// الانتقال لـ set-password page (عن طريق تحديث الـ URL بدون reload)
export function navigateToSetPassword(tokenUrl) {
  if (tokenUrl) {
    // ضع الـ token في الـ hash
    try {
      const u = new URL(tokenUrl, window.location.origin);
      const hash = u.hash || `?${u.searchParams.toString()}`;
      window.location.hash = hash.replace(/^#/, "");
    } catch {
      // fallback: استخدم الـ URL كامل
      window.location.href = tokenUrl;
    }
  }
}

// تنظيف الـ URL بعد نجاح/فشل set-password (لمنع إعادة المعالجة عند الـ refresh)
export function clearDeepLinkFromUrl() {
  // استخدم history.replaceState لمسح الـ hash بدون reload
  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState({}, document.title, cleanUrl);
  window.location.hash = "";
}

// تهيئة الـ DeepLinkService
// onSetPassword: callback يُستدعى عند اكتشاف token في الـ URL
//   يتم تمرير { accessToken, tokenType, ... } أو { token, tokenType }
// onCleanup: callback اختياري للتنظيف
//
// يرجع دالة cleanup لإزالة الـ listeners
export function initDeepLinkService(onSetPassword) {
  // 1) cold-start: تحقق من الـ URL الحالي
  const initial = parseDeepLinkUrl();
  if (initial.kind === "set_password") {
    // اتصل بـ onSetPassword في الـ next tick (عشان نسمح للمكونات بالـ mount)
    setTimeout(() => onSetPassword(initial), 100);
  }

  // 2) warm-start: استمع لتغييرات الـ URL (hashchange + popstate)
  const onHashChange = () => {
    const parsed = parseDeepLinkUrl();
    if (parsed.kind === "set_password") {
      onSetPassword(parsed);
    }
  };

  const onPopState = () => {
    const parsed = parseDeepLinkUrl();
    if (parsed.kind === "set_password") {
      onSetPassword(parsed);
    }
  };

  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("popstate", onPopState);

  // cleanup
  return () => {
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("popstate", onPopState);
  };
}
