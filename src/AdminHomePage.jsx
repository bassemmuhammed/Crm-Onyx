// ── AdminHomePage.jsx ─────────────────────────────────────────
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { supabase } from "./sharedLeadsData";

const NoSelect = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700;800;900&display=swap');
  * { -webkit-user-select: none !important; user-select: none !important; font-family: 'Archivo', sans-serif !important; }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:.35} }
`}</style>;

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

// الـ metrics للشارت — نفس أسماء الـ status
const METRICS = Object.entries(STATUS_META).map(([key, m]) => ({ key, label: m.label, color: m.color }));

const AVATARS = ["#CC1515","#6B6C73","#CECECE","#253FF6","#10b981","#f59e0b","#a855f7"];

const STAT_META = [
  { key: "total",        label: "Total Leads",    icon: "users",     color: C.white,  bg: C.cardAlt },
  { key: "new",          label: "New",            icon: "sparkle",   color: "#10b981", bg: "#10b98115" },
  { key: "deal",         label: "Deals",          icon: "handshake", color: C.red,    bg: "#CC151515" },
  { key: "callback",     label: "Call Backs",     icon: "hourglass", color: "#f59e0b", bg: "#f59e0b15" },
];

// ─── StatCard ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{
      background: C.cardGrad1, borderRadius:16, padding:"16px",
      boxShadow:"0 2px 24px rgba(0,0,0,.5)",
      display:"flex", alignItems:"center", gap:12,
      border:`1px solid ${C.border}`,
      position:"relative", overflow:"hidden",
    }}>
      {/* Gradient top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.red} 0%, transparent 100%)` }} />
      <div style={{
        width:46, height:46, borderRadius:10,
        background:bg, display:"flex", alignItems:"center",
        justifyContent:"center", color, flexShrink:0,
        border:`1px solid ${C.border}`,
      }}>
        {Icons[icon]}
      </div>
      <div>
        <div style={{ fontSize:"1.4rem", fontWeight:900, color:C.white, lineHeight:1, letterSpacing:"-0.02em" }}>{value}</div>
        <div style={{ fontSize:".58rem", color:C.gray, fontWeight:700, marginTop:3, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Modern Bar Chart ─────────────────────────────────────────
function BarChart({ data, metric }) {
  const [hovered, setHovered] = useState(null);
  const maxVal = Math.max(...data.map(d => d[metric.key] || 0), 1);

  return (
    <div style={{ width:"100%", position:"relative" }}>
      {/* Y-axis grid lines */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", paddingBottom:40 }}>
        {[100, 75, 50, 25, 0].map(pct => (
          <div key={pct} style={{
            position:"absolute", left:28, right:0,
            bottom:`calc(${pct}% + 40px)`,
            borderTop:`1px dashed ${C.border}`,
            display:"flex", alignItems:"center",
          }}>
            <span style={{
              fontSize:".45rem", color:C.gray, fontWeight:700,
              position:"absolute", left:-28, lineHeight:1,
            }}>
              {Math.round(maxVal * pct / 100)}
            </span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:180, paddingBottom:40, paddingLeft:32, position:"relative" }}>
        {data.map((person, i) => {
          const val  = person[metric.key] || 0;
          const pct  = (val / maxVal) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={i}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", cursor:"pointer", position:"relative" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(i)}
              onTouchEnd={() => setTimeout(() => setHovered(null), 1200)}
            >
              {/* Value label on top of bar */}
              {val > 0 && (
                <div style={{
                  fontSize:".52rem", fontWeight:800,
                  color: isHov ? C.white : metric.color,
                  marginBottom:3, transition:"color .2s",
                  opacity: isHov ? 1 : 0.7,
                }}>{val}</div>
              )}

              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position:"absolute", bottom:`calc(${pct}% + 52px)`,
                  background:C.cardAlt, color:C.white,
                  border:`1px solid ${metric.color}66`,
                  fontSize:".58rem", fontWeight:800,
                  padding:"5px 10px", borderRadius:8,
                  pointerEvents:"none", whiteSpace:"nowrap",
                  zIndex:10,
                  boxShadow:`0 4px 16px rgba(0,0,0,.5)`,
                  letterSpacing:".3px",
                }}>
                  <span style={{ color:metric.color }}>{person.full}</span>
                  <span style={{ color:C.gray, margin:"0 4px" }}>·</span>
                  <span>{val} {metric.label}</span>
                  <div style={{
                    position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)",
                    width:0, height:0,
                    borderLeft:"4px solid transparent", borderRight:"4px solid transparent",
                    borderTop:`4px solid ${C.cardAlt}`,
                  }} />
                </div>
              )}

              {/* Bar with gradient */}
              <div style={{
                width:"100%",
                height:`${Math.max(pct, val > 0 ? 3 : 0)}%`,
                background: isHov
                  ? `linear-gradient(180deg, ${metric.color} 0%, ${metric.color}88 100%)`
                  : `linear-gradient(180deg, ${metric.color}cc 0%, ${metric.color}44 100%)`,
                borderRadius:"6px 6px 3px 3px",
                transition:"all .25s ease",
                boxShadow: isHov ? `0 -4px 20px ${metric.color}55` : "none",
                position:"relative", overflow:"hidden",
              }}>
                {/* Shine effect */}
                {isHov && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0, height:"40%",
                    background:"rgba(255,255,255,.08)", borderRadius:"6px 6px 0 0",
                  }} />
                )}
              </div>

              {/* X label */}
              <div style={{
                fontSize:".46rem", color: isHov ? metric.color : C.gray,
                fontWeight: isHov ? 800 : 600,
                marginTop:5, textAlign:"center", lineHeight:1.2,
                transition:"color .2s", maxWidth:"100%",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {person.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Metric Selector Chips ────────────────────────────────────
function MetricChips({ metrics, activeKey, onSelect, totals }) {
  return (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
      {metrics.filter(m => totals[m.key] > 0 || m.key === activeKey).map(m => {
        const active = m.key === activeKey;
        return (
          <div
            key={m.key}
            onClick={() => onSelect(m)}
            style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"5px 10px", borderRadius:6,
              background: active ? `${m.color}18` : C.cardAlt,
              border: active ? `1px solid ${m.color}66` : `1px solid ${C.border}`,
              cursor:"pointer", transition:"all .2s",
            }}
          >
            {active && <div style={{ width:5, height:5, borderRadius:"50%", background:m.color, flexShrink:0 }} />}
            <span style={{ fontSize:".6rem", fontWeight:700, color: active ? C.white : C.gray, fontFamily:"Archivo,sans-serif" }}>
              {m.label}
            </span>
            <span style={{ fontSize:".55rem", fontWeight:800, color: active ? m.color : C.gray }}>
              {totals[m.key] || 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Distribution Row ────────────────────────────────────
function TeamDistRow({ agent, totalLeads }) {
  const pct = totalLeads > 0 ? (agent.total / totalLeads) * 100 : 0;

  // Top 3 statuses for this agent
  const topStatuses = Object.entries(STATUS_META)
    .map(([key, m]) => ({ key, ...m, count: agent[key] || 0 }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"11px 0",
      borderBottom:`1px solid ${C.border}`,
    }}>
      <div style={{
        width:34, height:34, borderRadius:9, flexShrink:0,
        background: agent.color || agent.avatarColor,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:".72rem", fontWeight:900, color:"#fff",
        border:`1px solid ${C.border}`,
      }}>
        {agent.name.charAt(0)}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
          <div style={{ fontSize:".72rem", fontWeight:800, color:C.white }}>{agent.name}</div>
          <div style={{ display:"flex", gap:4 }}>
            {topStatuses.map(s => (
              <span key={s.key} style={{
                fontSize:".5rem", fontWeight:800, color:s.color,
                background:`${s.color}18`, padding:"2px 6px", borderRadius:4,
                border:`1px solid ${s.color}44`,
              }}>{s.label.split(" ")[0]} {s.count}</span>
            ))}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:4, background:C.border, borderRadius:99, overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:`linear-gradient(90deg, ${C.red}, ${C.red}60)`,
            borderRadius:99, transition:"width .6s ease",
          }} />
        </div>
      </div>

      <div style={{ fontSize:".8rem", fontWeight:900, color:C.red, flexShrink:0, minWidth:24, textAlign:"right" }}>
        {agent.total}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AdminHomePage({ onTabChange }) {
  const cachedLeads = JSON.parse(localStorage.getItem("cache_leads") || "[]");
  const cachedTeam  = JSON.parse(localStorage.getItem("cache_team")  || "[]");

  const [leads,        setLeads]        = useState(cachedLeads);
  const [team,         setTeam]         = useState(cachedTeam);
  const [loading,      setLoading]      = useState(cachedLeads.length === 0);
  const [activeMetric, setActiveMetric] = useState(METRICS[0]);

  useEffect(() => {
    const load = async () => {
      if (cachedLeads.length === 0) setLoading(true);
      const [{ data: leadsData }, { data: teamData }] = await Promise.all([
        supabase.from("leads").select("status, assigned_to"),
        supabase.from("users").select("id, name, color").neq("role", "admin").neq("role", "owner"),
      ]);
      const newLeads = leadsData || [];
      const newTeam  = teamData  || [];
      localStorage.setItem("cache_leads", JSON.stringify(newLeads));
      localStorage.setItem("cache_team",  JSON.stringify(newTeam));
      setLeads(newLeads);
      setTeam(newTeam);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("home-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Derived stats ──
  const stats = STAT_META.map(s => ({
    ...s,
    value: s.key === "total" ? leads.length : leads.filter(l => l.status === s.key).length,
  }));

  // ── Team data ──
  const teamData = team.map((agent, i) => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id);
    const byStatus = {};
    METRICS.forEach(m => { byStatus[m.key] = agentLeads.filter(l => l.status === m.key).length; });
    return { ...agent, total: agentLeads.length, ...byStatus, avatarColor: AVATARS[i % AVATARS.length] };
  }).sort((a, b) => b.total - a.total);

  // ── Chart data ──
  const chartData = teamData
    .map(a => ({ name: a.name.split(" ")[0], full: a.name, ...Object.fromEntries(METRICS.map(m => [m.key, a[m.key]])) }))
    .sort((a, b) => (b[activeMetric.key] || 0) - (a[activeMetric.key] || 0));

  // ── Totals per status ──
  const totals = Object.fromEntries(
    METRICS.map(m => [m.key, leads.filter(l => l.status === m.key).length])
  );

  return (
    <div style={{ padding:"16px 16px 0", background:C.surface, minHeight:"100vh" }}>
      <NoSelect />

      {loading && (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.gray, fontSize:".82rem", fontFamily:"Archivo,sans-serif", animation:"pulse2 1.5s ease infinite" }}>
          Loading...
        </div>
      )}

      {!loading && (
        <>
          {/* ── Stats Grid ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          {/* ── Team Performance Chart ── */}
          <div style={{
            background: C.cardGrad2, borderRadius:20,
            padding:"18px 16px 16px",
            boxShadow:"0 4px 32px rgba(0,0,0,.5)",
            marginBottom:14,
            border:`1px solid ${C.border}`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.red} 0%, transparent 100%)` }} />

            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:".88rem", fontWeight:900, color:C.white, letterSpacing:"-0.01em" }}>Team Performance</div>
                <div style={{ fontSize:".55rem", color:C.gray, fontWeight:600, marginTop:2, textTransform:"uppercase", letterSpacing:"1px" }}>
                  {activeMetric.label} · {totals[activeMetric.key] || 0} total
                </div>
              </div>
              {/* Active metric color dot */}
              <div style={{
                display:"flex", alignItems:"center", gap:5,
                background:`${activeMetric.color}18`, border:`1px solid ${activeMetric.color}44`,
                borderRadius:8, padding:"5px 10px",
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:activeMetric.color }} />
                <span style={{ fontSize:".6rem", fontWeight:800, color:activeMetric.color }}>{activeMetric.label}</span>
              </div>
            </div>

            <BarChart data={chartData} metric={activeMetric} />

            {/* Metric chips */}
            <div style={{ marginTop:14 }}>
              <MetricChips metrics={METRICS} activeKey={activeMetric.key} onSelect={setActiveMetric} totals={totals} />
            </div>
          </div>

          {/* ── Team Distribution Card ── */}
          <div style={{
            background: C.cardGrad2, borderRadius:20,
            padding:"16px",
            boxShadow:"0 4px 32px rgba(0,0,0,.5)",
            marginBottom:100,
            border:`1px solid ${C.border}`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.red} 0%, transparent 100%)` }} />

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:".82rem", fontWeight:900, color:C.white, letterSpacing:"-0.01em" }}>Lead Distribution</div>
              <div style={{ fontSize:".58rem", color:C.gray, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>{leads.length} leads total</div>
            </div>

            {teamData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.gray, fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>No team yet</div>
            ) : teamData.map((agent) => (
              <TeamDistRow key={agent.id} agent={agent} totalLeads={leads.length} />
            ))}

            {/* Unassigned row */}
            {(() => {
              const unassigned = leads.filter(l => !l.assigned_to).length;
              if (!unassigned) return null;
              const pct = leads.length > 0 ? (unassigned / leads.length) * 100 : 0;
              return (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderTop:`1px solid ${C.border}`, marginTop:4 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:C.cardAlt, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900, color:C.gray, flexShrink:0, border:`1px dashed ${C.border}` }}>?</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:".68rem", fontWeight:700, color:C.gray, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>Unassigned</div>
                    <div style={{ height:4, background:C.border, borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:C.cardAlt, borderRadius:99, transition:"width .5s ease" }} />
                    </div>
                  </div>
                  <div style={{ fontSize:".72rem", fontWeight:900, color:C.gray, flexShrink:0 }}>{unassigned}</div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
