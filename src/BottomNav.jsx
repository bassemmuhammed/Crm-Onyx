import { useState, useEffect } from "react";
import Icons from "./Icons";

// ── ONYX Brand Tokens ─────────────────────────────────────
// Black: #000000 | Fiery Red: #cc1515 | White: #ffffff
// Vibrant Silver: #cecece | Anchor Gray: #595a5f | Bright Blue: #253ff6
// Typeface: Archivo

const DEFAULT_ITEMS = [
  { icon: "house",    label: "Home"     },
  { icon: "users",    label: "Leads"    },
  { icon: "calendar", label: "Timeline" },
  { icon: "task",     label: "Projects" },
];

export default function BottomNav({ activeTab = 0, onTabChange, items = DEFAULT_ITEMS }) {
  const [animKey, setAnimKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [activeTab]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.hasAttribute("data-modal-open"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-modal-open"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&display=swap');

        /* Active icon: smooth spring pop — circular feel */
        .onyx-nav-active-icon {
          animation: onyxPop 0.38s cubic-bezier(0.22, 1.4, 0.36, 1) forwards;
        }
        @keyframes onyxPop {
          0%   { top: 0px;  transform: translateX(-50%) scale(0.6); opacity: 0; }
          55%  { top: -17px; transform: translateX(-50%) scale(1.08); opacity: 1; }
          75%  { top: -15px; transform: translateX(-50%) scale(0.97); }
          100% { top: -16px; transform: translateX(-50%) scale(1);   opacity: 1; }
        }

        /* Label fade in on active */
        .onyx-nav-label-active {
          animation: labelReveal 0.25s ease forwards;
        }
        @keyframes labelReveal {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Inactive icon press */
        .onyx-nav-item:active .onyx-nav-icon-inactive {
          transform: scale(0.82);
        }

        /* Inactive icon hover */
        .onyx-nav-icon-inactive {
          transition: color .2s, transform .15s;
        }
      `}</style>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 100,
        overflow: "visible",
        fontFamily: "'Archivo', sans-serif",
        visibility: modalOpen ? "hidden" : "visible",
        pointerEvents: modalOpen ? "none" : "auto",
        transition: "visibility 0s",
      }}>
        {/* Bar */}
        <div style={{
          background: "#111111",
          borderRadius: 0,
          height: 62,
          display: "flex",
          borderTop: "1px solid #1e1e1e",
          position: "relative",
          overflow: "visible",
          boxShadow: "0 -1px 0 0 #cc1515 inset, 0 -8px 32px rgba(0,0,0,.6)",
          maxWidth: 430,
          margin: "0 auto",
        }}>

          {/* Active tab red underline indicator */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: `${(activeTab / items.length) * 100}%`,
            width: `${100 / items.length}%`,
            height: 2,
            background: "#cc1515",
            borderRadius: "2px 2px 0 0",
            transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 5,
          }} />

          {items.map((n, i) => {
            const active = activeTab === i;
            return (
              <div
                key={i}
                className="onyx-nav-item"
                onClick={() => onTabChange?.(i)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 9,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "visible",
                  userSelect: "none",
                  transition: "opacity .15s",
                }}
              >
                {/* Active: lifted circular icon */}
                {active && (
                  <div
                    key={`icon-${animKey}`}
                    className="onyx-nav-active-icon"
                    style={{
                      position: "absolute",
                      left: "50%",
                      width: 46,
                      height: 46,
                      borderRadius: "50%",           // ← دائري كامل
                      background: "#cc1515",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      boxShadow: "0 4px 22px rgba(204,21,21,.55), 0 1px 0 rgba(255,255,255,.1) inset",
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ transform: "scale(1.1)", display: "flex" }}>
                      {Icons[n.icon]}
                    </div>
                  </div>
                )}

                {/* Inactive icon */}
                {!active && (
                  <div
                    className="onyx-nav-icon-inactive"
                    style={{
                      color: "#595a5f",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 3,
                    }}
                  >
                    {Icons[n.icon]}
                  </div>
                )}

                {/* Label */}
                <div
                  key={`label-${animKey}-${i}`}
                  className={active ? "onyx-nav-label-active" : ""}
                  style={{
                    fontSize: ".55rem",
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: active ? "#cc1515" : "#595a5f",
                    transition: "color .2s",
                    marginTop: active ? 32 : 3,
                  }}>
                  {n.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
