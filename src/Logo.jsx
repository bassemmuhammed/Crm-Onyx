// ── Logo.jsx ─────────────────────────────────────────────────────────
// ONYX CRM — Brand logo component
//
// Renders the actual ONYX_logo_transparent.png from src/assets/.
// Used by:
//   - AppHeader (top of every screen on mobile)
//   - Sidebar (top of every screen on desktop)
//   - Login screen
//   - Splash screen / loading state
//
// Replaces the previous inline SVG "OnyxMark" placeholder with the
// real transparent PNG logo.

import onyxLogo from "./assets/ONYX_logo_transparent.png";

/**
 * The ONYX CRM logo.
 *
 * @param {object}  props
 * @param {number}  [props.height=32]  - Logo height in px. Width auto.
 * @param {number}  [props.width]      - Optional explicit width.
 * @param {string}  [props.alt="ONYX CRM"] - Alt text for accessibility.
 * @param {object}  [props.style]      - Additional inline styles.
 */
export default function Logo({ height = 32, width, alt = "ONYX CRM", style }) {
  return (
    <img
      src={onyxLogo}
      alt={alt}
      height={height}
      width={width}
      style={{
        height,
        width: width ?? "auto",
        objectFit: "contain",
        display: "block",
        userSelect: "none",
        ...style,
      }}
      draggable={false}
    />
  );
}
