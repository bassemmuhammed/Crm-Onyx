// ── AppHeader.jsx ─────────────────────────────────────────
// الهيدر المشترك لكل صفحات ONYX CRM
//
// Props:
//   unreadCount   {number}   - عدد الإشعارات غير المقروءة  (default: 0)
//   onBellClick   {function} - لما المستخدم يضغط على الجرس
//   onProfileClick{function} - لما المستخدم يضغط على الأيقونة الشخصية
//
// Example usage:
//   import AppHeader from "./AppHeader";
//   <AppHeader unreadCount={3} onBellClick={() => setNotifOpen(true)} onProfileClick={() => setProfileOpen(true)} />

import Icons from "./Icons";

// ── ONYX Brand Tokens ─────────────────────────────────────
// Black: #000000 | Fiery Red: #cc1515 | White: #ffffff
// Vibrant Silver: #cecece | Anchor Gray: #595a5f | Bright Blue: #253ff6
// Typeface: Archivo (900 weight for logo)

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&display=swap');

  .onyx-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #111111;
    padding: 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 62px;
    font-family: 'Archivo', sans-serif;
    overflow: hidden;
  }

  /* Red slash accent line at bottom — signature brand element */
  .onyx-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #cc1515 0%, #ff2a2a 40%, transparent 100%);
  }

  /* Subtle diagonal background texture */
  .onyx-header::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: #cc1515;
    opacity: 0.04;
    transform: rotate(30deg) skewX(-15deg);
    pointer-events: none;
  }

  /* ── Logo ── */
  .onyx-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }

  .onyx-wordmark {
    display: flex;
    align-items: baseline;
    gap: 0;
    font-family: 'Archivo', sans-serif;
    font-weight: 900;
    font-size: 1.25rem;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .onyx-wordmark-ony {
    color: #ffffff;
  }

  /* The "X" replaced with the brand's red slash symbol */
  .onyx-wordmark-x {
    color: #cc1515;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    margin-left: 1px;
  }

  .onyx-wordmark-x svg {
    width: 18px;
    height: 18px;
    margin-bottom: -1px;
  }

  .onyx-crm-label {
    color: #595a5f;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-left: 2px;
    align-self: center;
  }

  /* Broker badge — sharp-cornered, red-accented */
  .onyx-badge {
    background: transparent;
    border: 1px solid #cc1515;
    color: #cc1515;
    font-family: 'Archivo', sans-serif;
    font-size: 0.5rem;
    font-weight: 800;
    padding: 3px 8px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }

  /* Subtle red fill on badge */
  .onyx-badge::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #cc1515;
    opacity: 0.08;
  }

  /* ── Action Buttons ── */
  .onyx-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .onyx-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;              /* ← دائري كامل */
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    color: #cecece;
    transition: border-color 0.15s, background 0.15s, transform 0.15s;
  }

  .onyx-btn:active {
    background: #222222;
    border-color: #cc1515;
    transform: scale(0.9);
  }

  /* Notification badge */
  .onyx-notif-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #cc1515;
    color: #ffffff;
    font-family: 'Archivo', sans-serif;
    font-size: 0.48rem;
    font-weight: 900;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #111111;
    letter-spacing: 0;
  }

  /* Divider between bell and profile */
  .onyx-btn-divider {
    width: 1px;
    height: 20px;
    background: #2a2a2a;
  }
`;

// The ONYX brand "X" — abstract slash mark in SVG
const OnyxMark = () => (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="15" x2="15" y2="3" stroke="#cc1515" strokeWidth="2.8" strokeLinecap="round"/>
    <line x1="3" y1="3" x2="10" y2="10" stroke="#cc1515" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);

export default function AppHeader({ unreadCount = 0, onBellClick, onProfileClick }) {
  return (
    <>
      <style>{styles}</style>
      <div className="onyx-header">

        {/* ── Logo ── */}
        <div className="onyx-logo">
          <div className="onyx-wordmark">
            <span className="onyx-wordmark-ony">ONY</span>
            <span className="onyx-wordmark-x">
              <OnyxMark />
            </span>
            <span className="onyx-crm-label">CRM</span>
          </div>

        </div>

        {/* ── Actions ── */}
        <div className="onyx-actions">
          {/* Bell */}
          <div className="onyx-btn" onClick={onBellClick}>
            {Icons.bell}
            {unreadCount > 0 && (
              <div className="onyx-notif-badge">{unreadCount}</div>
            )}
          </div>

          <div className="onyx-btn-divider" />

          {/* Profile */}
          <div className="onyx-btn" onClick={onProfileClick}>
            {Icons.user}
          </div>
        </div>

      </div>
    </>
  );
}
