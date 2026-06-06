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

// ─── Rank badge styles ────────────────────────────────────────
const RANK_STYLES = [
  { bg:"linear-gradient(135deg,#FFD700 0%,#B8860B 100%)", label:"#000", border:"#FFD70066", glow:"#FFD70033" },
  { bg:"linear-gradient(135deg,#C0C0C0 0%,#808080 100%)", label:"#000", border:"#C0C0C066", glow:"#C0C0C022" },
  { bg:"linear-gradient(135deg,#CD7F32 0%,#8B4513 100%)", label:"#fff", border:"#CD7F3266", glow:"#CD7F3222" },
];

// ─── Leaderboard Cards (Option 1 from TeamPerformanceOptions) ─
function LeaderboardCards({ teamData, totalLeads, onTabChange }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {teamData.map((agent, i) => {
        const rank      = i + 1;
        const pct       = totalLeads > 0 ? Math.round((agent.total / totalLeads) * 100) : 0;
        const rankStyle = RANK_STYLES[i] || null;
        const isExp     = expanded === agent.id;
        const initial   = agent.name.charAt(0).toUpperCase();

        const topStatuses = Object.entries(STATUS_META)
          .map(([key, m]) => ({ key, ...m, count: agent[key] || 0 }))
          .filter(s => s.count > 0)
          .sort((a,b) => b.count - a.count)
          .slice(0, 4);

        return (
          <div
            key={agent.id}
            onClick={() => setExpanded(isExp ? null : agent.id)}
            style={{
              background: i === 0 ? "linear-gradient(135deg,#1C1A0E 0%,#161614 100%)" : "#161618",
              borderRadius: 16,
              border: `1px solid ${rankStyle ? rankStyle.border : C.border}`,
              boxShadow: rankStyle ? `0 0 20px ${rankStyle.glow}` : "0 2px 8px rgba(0,0,0,.4)",
              padding: "14px 14px",
              cursor: "pointer",
              transition: "all .2s ease",
              position: "relative",
              overflow: "hidden",
              animation: `slideUp .4s ease both`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* top accent line for #1 */}
            {i === 0 && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:2,
                background:"linear-gradient(90deg,#FFD700,transparent)",
              }} />
            )}

            {/* Main row */}
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>

              {/* Rank badge */}
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0,
                background: rankStyle ? rankStyle.bg : C.cardAlt,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:".7rem", fontWeight:900,
                color: rankStyle ? rankStyle.label : C.gray,
              }}>
                {rank <= 3 ? `#${rank}` : rank}
              </div>

              {/* Avatar */}
              <div style={{
                width:38, height:38, borderRadius:"50%", flexShrink:0,
                background: agent.color || C.cardAlt,
                border:`2px solid ${agent.color || C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:".78rem", fontWeight:900, color:"#fff",
                boxShadow: i === 0 ? `0 0 12px ${agent.color}55` : "none",
              }}>
                {agent.avatar_url
                  ? <img src={agent.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                  : initial}
              </div>

              {/* Name + segmented bar */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:".75rem", fontWeight:800, color:C.white,
                  marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {agent.name}
                </div>
                <div style={{ height:5, background:C.border, borderRadius:99, overflow:"hidden", display:"flex", gap:1 }}>
                  {topStatuses.map(s => (
                    <div key={s.key} style={{
                      height:"100%",
                      width:`${agent.total > 0 ? (s.count / agent.total) * pct : 0}%`,
                      background:s.color,
                      transition:"width .6s ease",
                      borderRadius:99,
                    }} />
                  ))}
                </div>
              </div>

              {/* Total + pct */}
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{
                  fontSize:"1.1rem", fontWeight:900, color: rankStyle ? "#FFD700" : C.white,
                  lineHeight:1,
                }}>
                  {agent.total}
                </div>
                <div style={{ fontSize:".48rem", color:C.gray, fontWeight:700, marginTop:2 }}>
                  {pct}% share
                </div>
              </div>
            </div>

            {/* Expanded status pills */}
            {isExp && (
              <div style={{
                marginTop:12, paddingTop:10,
                borderTop:`1px solid ${C.border}`,
                display:"flex", flexWrap:"wrap", gap:5,
              }}>
                {Object.entries(STATUS_META)
                  .map(([key, m]) => ({ key, ...m, count: agent[key] || 0 }))
                  .filter(s => s.count > 0)
                  .sort((a,b) => b.count - a.count)
                  .map(s => (
                    <div
                      key={s.key}
                      onClick={(e) => { e.stopPropagation(); onTabChange && onTabChange("leads", { status: s.key, agent_id: agent.id }); }}
                      style={{
                        display:"flex", alignItems:"center", gap:4,
                        background:`${s.color}15`, border:`1px solid ${s.color}44`,
                        borderRadius:6, padding:"3px 8px", cursor:"pointer",
                      }}
                    >
                      <div style={{ width:5, height:5, borderRadius:"50%", background:s.color }} />
                      <span style={{ fontSize:".52rem", fontWeight:700, color:s.color }}>{s.label}</span>
                      <span style={{ fontSize:".58rem", fontWeight:900, color:C.white }}>{s.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
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

          {/* ── Team Leaderboard ── */}
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
                  <div style={{ fontSize:".82rem", fontWeight:900, color:C.white, letterSpacing:"-0.01em" }}>Team Leaderboard</div>
                  <div style={{ fontSize:".5rem", color:C.gray, fontWeight:600, marginTop:1, textTransform:"uppercase", letterSpacing:"1px" }}>
                    Tap a card to see details
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

            {/* Cards */}
            {teamData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.gray, fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>
                No team yet
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <LeaderboardCards teamData={teamData} totalLeads={leads.length} onTabChange={onTabChange} />

                {/* Unassigned */}
                {(() => {
                  const unassigned = leads.filter(l => !l.assigned_to).length;
                  if (!unassigned) return null;
                  const pct = leads.length > 0 ? Math.round((unassigned / leads.length) * 100) : 0;
                  return (
                    <div style={{
                      display:"flex", alignItems:"center", gap:11,
                      padding:"11px 14px",
                      background: C.card,
                      borderRadius:14, border:`1px solid ${C.border}`,
                    }}>
                      <div style={{
                        width:28, height:28, borderRadius:8, flexShrink:0,
                        background:C.cardAlt, border:`1px dashed ${C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:".6rem", fontWeight:900, color:C.gray,
                      }}>?</div>
                      <div style={{
                        width:40, height:40, borderRadius:"50%", flexShrink:0,
                        background:C.cardAlt, border:`2px dashed ${C.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:".65rem", fontWeight:900, color:C.gray,
                      }}>–</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:".7rem", fontWeight:700, color:C.gray, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>Unassigned</div>
                        <div style={{ height:4, background:C.border, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:C.cardAlt, borderRadius:99, transition:"width .5s ease" }} />
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:"1.1rem", fontWeight:900, color:C.gray }}>{unassigned}</div>
                        <div style={{ fontSize:".48rem", color:C.gray, fontWeight:700 }}>{pct}%</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
