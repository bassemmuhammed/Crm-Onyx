// ── ErrorBoundary.jsx ──────────────────────────────────────────────
// P3-1: Error Boundary — منع انهيار التطبيق عند أي خطأ
// (مطابقة Firebase Crashlytics في Flutter — يلتقط الأخطاء ويعرض UI بديل)
//
// بدلاً من أن أي خطأ في أي component ينهار التطبيق بالكامل (شاشة بيضاء)،
// الـ Error Boundary يلتقط الخطأ ويعرض رسالة خطأ ودية مع زر لإعادة المحاولة.
//
// الاستخدام:
//   import ErrorBoundary from "./ErrorBoundary";
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>

import { Component } from "react";

const C = {
  page:    "#F5F6FA",
  card:    "#FFFFFF",
  border:  "#E5E7EB",
  text:    "#1A1A2E",
  gray:    "#6B7280",
  red:     "#DC2626",
  redBg:   "#FEE2E2",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // تسجيل الخطأ (يمكن استبداله بـ Sentry أو Crashlytics لاحقاً)
    console.error("🚨 ErrorBoundary caught:", error);
    console.error("Stack:", errorInfo?.componentStack);

    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // ✅ إرسال الخطأ لـ Supabase (اختياري — يمكن تفعيله لاحقاً)
    // try {
    //   await supabase.from("error_logs").insert({
    //     message: error.message,
    //     stack: error.stack,
    //     component_stack: errorInfo?.componentStack,
    //     url: window.location.href,
    //     user_agent: navigator.userAgent,
    //     created_at: new Date().toISOString(),
    //   });
    // } catch (e) { /* ignore */ }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div style={{
          minHeight: "100dvh",
          background: C.page,
          fontFamily: "'Archivo', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 32,
            maxWidth: 460,
            width: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}>
            {/* Error Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: C.redBg,
              display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              marginBottom: 16, fontSize: 32,
            }}>
              ⚠️
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 20, fontWeight: 800, color: C.text,
              margin: "0 0 8px",
            }}>
              Something went wrong
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 14, color: C.gray, fontWeight: 500,
              margin: "0 0 20px", lineHeight: 1.5,
            }}>
              The app encountered an unexpected error. You can try again or reload the page.
              {errorCount > 1 && (
                <span style={{ display: "block", marginTop: 8, color: C.red, fontWeight: 600 }}>
                  (Error occurred {errorCount} times)
                </span>
              )}
            </p>

            {/* Error message (collapsible) */}
            {error && (
              <details style={{
                textAlign: "left",
                background: C.page,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 20,
                fontSize: 12,
              }}>
                <summary style={{
                  cursor: "pointer", fontWeight: 700, color: C.gray,
                  fontSize: 12,
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: 8,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  color: C.red, fontSize: 11, fontFamily: "monospace",
                }}>
                  {error.message}
                  {errorInfo?.componentStack && (
                    "\n\nComponent Stack:" + errorInfo.componentStack
                  )}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={this.handleRetry}
                style={{
                  flex: 1, padding: "12px",
                  background: C.red, color: "#fff",
                  border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1, padding: "12px",
                  background: "transparent", color: C.gray,
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
