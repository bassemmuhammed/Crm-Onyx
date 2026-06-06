// ── AdminHomePage.jsx ─────────────────────────────────────────
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { supabase } from "./sharedLeadsData";

const NoSelect = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700;800;900&display=swap');
  * { -webkit-user-select: none !important; user-select: none !important; font-family: 'Archivo', sans-serif !important; }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes countUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInLeft { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes arrowBounce { 0%{transform:translateX(0)} 50%{transform:translateX(4px)} 100%{transform:translateX(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`}</style>;

// ─── Animated Number Hook ──────────────────────────────────────
function useAnimatedNumber(target, duration = 800, delay = 0) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = null;
    let frame;
    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, [target, duration, delay]);
  return current;
}

// ─── ONYX Design Tokens (same as AdminLeadsPage) ──────────────
const C = {
  black:    "#000000",
  surface:  "#0D0D0D",
  card:     "#161618",
  border:   "#2A2A2E",
  cardAlt:  "#1E1E22",
  gray:     "#6B6C73",
  silver:   "#CECECE",
  white:    "#FFFFFF",
  red:      "#CC1515",
  blue:     "#253FF6",
  cardGrad1: "linear-gradient(145deg,#1A1A1E 0%,#141416 100%)",
  cardGrad2: "linear-gradient(145deg,#1C1C22 0%,#141418 100%)",
};

// ─── نفس STATUS_META بالظبط زي AdminLeadsPage ────────────────
const STATUS_META = {
  new:             { label: "New",             color: "#10b981", bg: "#10b98120" },
  callback:        { label: "Call Back",       color: "#f59e0b", bg: "#f59e0b20" },
  pendingMeeting:  { label: "Pending Meeting", color: "#253FF6", bg: "#253FF620" },
  meetingDone:     { label: "Meeting Done",    color: "#a855f7", bg: "#a855f720" },
  deal:            { label: "Deal",            color: "#CC1515", bg: "#CC151520" },
  onGoing:         { label: "On Going",        color: "#06b6d4", bg: "#06b6d420" },
  lowBudget:       { label: "Low Budget",      color: "#f97316", bg: "#f9731620" },
  noAnswer:        { label: "No Answer",       color: "#8b949e", bg: "#8b949e20" },
  notInterested:   { label: "Not Interested",  color: "#6b7280", bg: "#6b728020" },
  chooseCompetitor:{ label: "Competitor",      color: "#ec4899", bg: "#ec489920" },
  longTerm:        { label: "Long Term",       color: "#8b5cf6", bg: "#8b5cf620" },
  closed:          { label: "Closed",          color: "#374151", bg: "#37415130" },
};

// ─── Lead Overview Cards Meta ──────────────────────────────────
const LEAD_OVERVIEW_CARDS = [
  { key: "all",             label: "ALL LEADS",        iconKey: "users",         color: "#10b981", accentLine: "#10b981" },
  { key: "new",             label: "NEW LEADS",        iconKey: "sparkle",       color: "#10b981", accentLine: "#10b981", accent: true },
  { key: "callback",        label: "CALL BACK",        iconKey: "callback",      color: "#f59e0b", accentLine: "#f59e0b" },
  { key: "pendingMeeting",  label: "PENDING MEETING",  iconKey: "calendar",      color: "#253FF6", accentLine: "#253FF6" },
  { key: "meetingDone",     label: "MEETING DONE",     iconKey: "calendarCheck", color: "#a855f7", accentLine: "#a855f7" },
  { key: "deal",            label: "DEAL",             iconKey: "handshake",     color: "#CC1515", accentLine: "#CC1515" },
  { key: "onGoing",         label: "ON GOING",         iconKey: "hourglass",     color: "#06b6d4", accentLine: "#06b6d4" },
  { key: "lowBudget",       label: "LOW BUDGET",       iconKey: "chart",         color: "#f97316", accentLine: "#f97316" },
  { key: "noAnswer",        label: "NO ANSWER",        iconKey: "phoneCall",     color: "#8b949e", accentLine: "#8b949e" },
  { key: "notInterested",   label: "NOT INTERESTED",   iconKey: "prohibit",      color: "#6b7280", accentLine: "#6b7280" },
  { key: "chooseCompetitor",label: "COMPETITOR",       iconKey: "flag",          color: "#ec4899", accentLine: "#ec4899" },
  { key: "longTerm",        label: "LONG TERM",        iconKey: "hourglass",     color: "#8b5cf6", accentLine: "#8b5cf6" },
  { key: "closed",          label: "CLOSED",           iconKey: "checkSquare",   color: "#374151", accentLine: "#374151" },
];

// ─── Icon renderer — wraps Icons[key] with a color tint via CSS filter ───
// Icons من الملف المشترك بيكون عادةً SVG بلون ثابت،
// بنحطه جوه wrapper بـ opacity مناسب
function OvIcon({ iconKey, color }) {
  // clone the icon element with the right color applied via a wrapper
  return (
    <span style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      color: color,
      // force svg children to inherit currentColor where possible
    }}>
      {Icons[iconKey] ?? Icons["sparkle"]}
    </span>
  );
}

// ─── Lead Overview Animated Card ──────────────────────────────
function LeadOverviewCard({ card, value, index, accentColor, onClick }) {
  const animated = useAnimatedNumber(value, 700, index * 60);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1C1C22" : C.card,
        borderRadius: 14,
        padding: "14px 12px",
        border: `1px solid ${hovered ? card.color + "55" : C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 11,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all .22s ease",
        boxShadow: hovered ? `0 4px 20px ${card.color}22` : "0 2px 8px rgba(0,0,0,.3)",
        animation: `slideInLeft .35s ease both`,
        animationDelay: `${index * 55}ms`,
      }}
    >
      {/* Bottom accent line (like screenshot green line under NEW LEADS) */}
      {card.accent && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: card.accentLine, borderRadius: "0 0 14px 14px",
          animation: `slideInLeft .5s ease both`,
          animationDelay: `${index * 55 + 200}ms`,
        }} />
      )}

      {/* Icon with black background */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "#000000",
        border: `1px solid #222226`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.05)`,
        transition: "transform .2s ease",
        transform: hovered ? "scale(1.05)" : "scale(1)",
      }}>
        <OvIcon iconKey={card.iconKey} color={card.color} />
      </div>

      {/* Number + Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "1.6rem", fontWeight: 900, color: C.white,
          lineHeight: 1, letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
          animation: `countUp .4s ease both`,
          animationDelay: `${index * 60 + 100}ms`,
        }}>
          {animated}
        </div>
        <div style={{
          fontSize: ".55rem", fontWeight: 700, color: C.gray,
          marginTop: 4, textTransform: "uppercase", letterSpacing: "1.2px",
          lineHeight: 1.2,
        }}>
          {card.label}
        </div>
      </div>

      {/* Arrow → with bounce animation */}
      <div style={{
        color: hovered ? card.color : C.gray,
        transition: "color .2s ease",
        flexShrink: 0,
        animation: hovered ? "arrowBounce .6s ease infinite" : "none",
        fontSize: "1rem",
        fontWeight: 900,
      }}>
        ›
      </div>

      {/* Divider line at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 12, right: 12, height: "1px",
        background: C.border,
      }} />
    </div>
  );
}

// ─── Heatmap Table ────────────────────────────────────────────
function HeatmapTable({ teamData, onTabChange }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const statuses = Object.entries(STATUS_META);

  const maxPerStatus = Object.fromEntries(
    statuses.map(([key]) => [key, Math.max(...teamData.map(a => a[key] || 0), 1)])
  );

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"3px" }}>
        <thead>
          <tr>
            <th style={{ textAlign:"left", padding:"0 6px 8px 0", minWidth:90 }}>
              <span style={{ fontSize:".52rem", fontWeight:700, color:C.gray, textTransform:"uppercase", letterSpacing:"1px" }}>Agent</span>
            </th>
            {statuses.map(([key, m]) => (
              <th key={key} style={{ padding:"0 0 8px", minWidth:36 }}>
                <div style={{
                  writingMode:"vertical-rl", textOrientation:"mixed",
                  transform:"rotate(180deg)",
                  fontSize:".44rem", fontWeight:700, color:m.color,
                  textTransform:"uppercase", letterSpacing:".5px",
                  height:48, display:"flex", alignItems:"center", justifyContent:"flex-start",
                }}>
                  {m.label}
                </div>
              </th>
            ))}
            <th style={{ padding:"0 0 8px 6px", minWidth:36 }}>
              <div style={{
                writingMode:"vertical-rl", textOrientation:"mixed",
                transform:"rotate(180deg)",
                fontSize:".44rem", fontWeight:700, color:C.gray,
                textTransform:"uppercase", letterSpacing:".5px",
                height:48, display:"flex", alignItems:"center",
              }}>Total</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {teamData.map((agent, ri) => (
            <tr key={agent.id}>
              <td style={{ padding:"0 8px 3px 0", verticalAlign:"middle" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    background: agent.color || C.cardAlt,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:".52rem", fontWeight:900, color:"#fff", flexShrink:0,
                  }}>
                    {agent.name.charAt(0)}
                  </div>
                  <span style={{
                    fontSize:".6rem", fontWeight:700, color:C.white,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:60,
                  }}>
                    {agent.name.split(" ")[0]}
                  </span>
                </div>
              </td>
              {statuses.map(([key, m]) => {
                const val       = agent[key] || 0;
                const intensity = val / maxPerStatus[key];
                const cellId    = `${ri}-${key}`;
                const isHov     = hoveredCell === cellId;
                return (
                  <td key={key} style={{ padding:"0 0 3px", verticalAlign:"middle", textAlign:"center" }}>
                    <div
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onTouchStart={() => setHoveredCell(cellId)}
                      onTouchEnd={() => setTimeout(() => setHoveredCell(null), 1000)}
                      onClick={() => val > 0 && onTabChange && onTabChange("leads", { status: key, agent_id: agent.id })}
                      style={{
                        width:32, height:32, borderRadius:7, margin:"0 auto",
                        background: val === 0
                          ? C.cardAlt
                          : `${m.color}${Math.round(intensity * 200 + 30).toString(16).padStart(2,"0")}`,
                        border: isHov
                          ? `1px solid ${m.color}`
                          : val > 0 ? `1px solid ${m.color}30` : `1px solid ${C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        cursor: val > 0 ? "pointer" : "default",
                        transition:"all .15s ease",
                        transform: isHov && val > 0 ? "scale(1.15)" : "scale(1)",
                        boxShadow: isHov && val > 0 ? `0 0 10px ${m.color}44` : "none",
                        position:"relative",
                      }}
                    >
                      {val > 0 && (
                        <span style={{ fontSize:".58rem", fontWeight:900, color: intensity > 0.5 ? "#fff" : m.color }}>
                          {val}
                        </span>
                      )}
                      {isHov && val > 0 && (
                        <div style={{
                          position:"absolute", bottom:"calc(100% + 6px)", left:"50%",
                          transform:"translateX(-50%)",
                          background:C.cardAlt, border:`1px solid ${m.color}66`,
                          borderRadius:7, padding:"4px 8px",
                          pointerEvents:"none", whiteSpace:"nowrap", zIndex:20,
                          boxShadow:`0 4px 12px rgba(0,0,0,.5)`,
                        }}>
                          <div style={{ fontSize:".5rem", color:m.color, fontWeight:800 }}>{m.label}</div>
                          <div style={{ fontSize:".6rem", color:C.white, fontWeight:900, textAlign:"center" }}>{val}</div>
                          <div style={{
                            position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)",
                            width:0, height:0,
                            borderLeft:"4px solid transparent", borderRight:"4px solid transparent",
                            borderTop:`4px solid ${C.cardAlt}`,
                          }} />
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td style={{ padding:"0 0 3px 6px", textAlign:"center", verticalAlign:"middle" }}>
                <div style={{
                  width:32, height:32, borderRadius:7, margin:"0 auto",
                  background:"#CC151518", border:`1px solid #CC151544`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <span style={{ fontSize:".65rem", fontWeight:900, color:C.red }}>{agent.total}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AdminHomePage({ onTabChange }) {
  // ── Cache: invalidate old team cache that doesn't have avatar_url field ──
  const rawCachedTeam = JSON.parse(localStorage.getItem("cache_team") || "[]");
  const cachedTeamValid = rawCachedTeam.length > 0 && "avatar_url" in rawCachedTeam[0];
  if (!cachedTeamValid && rawCachedTeam.length > 0) {
    localStorage.removeItem("cache_team");
  }
  const cachedLeads = JSON.parse(localStorage.getItem("cache_leads") || "[]");
  const cachedTeam  = cachedTeamValid ? rawCachedTeam : [];

  const [leads,   setLeads]   = useState(cachedLeads);
  const [team,    setTeam]    = useState(cachedTeam);
  const [loading, setLoading] = useState(true); // always load fresh on mount

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [leadsRes, teamRes] = await Promise.all([
          supabase.from("leads").select("status, assigned_to"),
          supabase.from("users")
            .select("id, name, color, avatar_url")
            .neq("role", "admin")
            .neq("role", "owner"),
        ]);
        const newLeads = leadsRes.data || [];
        const newTeam  = teamRes.data  || [];
        localStorage.setItem("cache_leads", JSON.stringify(newLeads));
        localStorage.setItem("cache_team",  JSON.stringify(newTeam));
        setLeads(newLeads);
        setTeam(newTeam);
      } catch (err) {
        console.error("AdminHomePage load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("home-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Team data ──
  const teamData = team.map((agent) => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id);
    const byStatus = {};
    Object.keys(STATUS_META).forEach(key => { byStatus[key] = agentLeads.filter(l => l.status === key).length; });
    return { ...agent, total: agentLeads.length, ...byStatus };
  }).sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding:"16px 16px 0", background:C.surface, minHeight:"100vh", paddingBottom:90 }}>
      <NoSelect />

      {loading && (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif", animation:"pulse2 1.5s ease infinite" }}>
          Loading...
        </div>
      )}

      {!loading && (
        <>
          {/* ── Lead Overview Section ── */}
          <div style={{ marginBottom: 20 }}>
            {/* Section Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 14,
              animation: "fadeInUp .3s ease both",
            }}>
              <div style={{ width: 3, height: 18, background: C.red, borderRadius: 99 }} />
              <span style={{
                fontSize: ".72rem", fontWeight: 900, color: C.white,
                textTransform: "uppercase", letterSpacing: "2px",
              }}>
                LEAD OVERVIEW
              </span>
            </div>

            {/* Cards Grid — 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {LEAD_OVERVIEW_CARDS.map((card, i) => {
                const value = card.key === "all"
                  ? leads.length
                  : leads.filter(l => l.status === card.key).length;
                return (
                  <LeadOverviewCard
                    key={card.key}
                    card={card}
                    value={value}
                    index={i}
                    onClick={() => onTabChange && onTabChange("leads", { status: card.key === "all" ? null : card.key })}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Team Heatmap ── */}
          <div style={{
            background: C.cardGrad2, borderRadius:20,
            padding:"18px 16px 16px",
            boxShadow:"0 4px 32px rgba(0,0,0,.5)",
            marginBottom:16,
            border:`1px solid ${C.border}`,
            position:"relative", overflow:"hidden",
          }}>
            {/* Red top accent */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.red} 0%, transparent 100%)` }} />

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:18, background:C.red, borderRadius:99 }} />
                <div>
                  <div style={{ fontSize:".82rem", fontWeight:900, color:C.white, letterSpacing:"-0.01em" }}>Team Performance</div>
                  <div style={{ fontSize:".5rem", color:C.gray, fontWeight:600, marginTop:1, textTransform:"uppercase", letterSpacing:"1px" }}>
                    Tap a cell to filter leads
                  </div>
                </div>
              </div>
              <div style={{
                background:`${C.red}18`, border:`1px solid ${C.red}44`,
                borderRadius:8, padding:"5px 10px",
                fontSize:".58rem", fontWeight:800, color:C.red,
              }}>
                {leads.length} leads
              </div>
            </div>

            {/* Heatmap */}
            {teamData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.gray, fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>
                No team yet
              </div>
            ) : (
              <HeatmapTable teamData={teamData} onTabChange={onTabChange} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
