// ── AdminHomePage.jsx ─────────────────────────────────────────
import { useState, useEffect } from "react";
import Icons from "./Icons";
import { supabase } from "./sharedLeadsData";

const NoSelect = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700;800;900&display=swap');
  * { -webkit-user-select: none !important; user-select: none !important; font-family: 'Archivo', sans-serif !important; }
`}</style>;

// ONYX Brand Colors
// Black: #000000 | Fiery Red: #cc1515 | White: #ffffff | Vibrant Silver: #cecece | Anchor Gray: #595a5f | Bright Blue: #253ff6
const METRICS = [
  { key: "deal",          label: "المبيعات",   color: "#cc1515" },
  { key: "new",           label: "جديد",        color: "#ffffff" },
  { key: "callback",      label: "Call Back",   color: "#cecece" },
  { key: "notInterested", label: "غير مهتم",    color: "#595a5f" },
  { key: "meeting",       label: "الميتينج",    color: "#253ff6" },
];

const AVATARS = ["#cc1515","#595a5f","#cecece","#253ff6","#ffffff"];

const STAT_META = [
  { key: "total",    label: "Total Leads",  icon: "users",     color: "#ffffff", bg: "#1a1a1a" },
  { key: "new",      label: "New",          icon: "sparkle",   color: "#ffffff", bg: "#1a1a1a" },
  { key: "deal",     label: "Deals Closed", icon: "handshake", color: "#ffffff", bg: "#1a1a1a" },
  { key: "callback", label: "Pending CB",   icon: "hourglass", color: "#ffffff", bg: "#1a1a1a" },
];

// ─── StatCard ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{
      background:"#252525", borderRadius:16, padding:"16px",
      boxShadow:"0 2px 24px rgba(0,0,0,.5)",
      display:"flex", alignItems:"center", gap:12,
      border:"1px solid #333333",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"#cc1515", borderRadius:"16px 16px 0 0" }} />
      <div style={{
        width:46, height:46, borderRadius:10,
        background:bg, display:"flex", alignItems:"center",
        justifyContent:"center", color, flexShrink:0,
        border:"1px solid #383838",
      }}>
        {Icons[icon]}
      </div>
      <div>
        <div style={{ fontSize:"1.4rem", fontWeight:900, color:"#ffffff", lineHeight:1, letterSpacing:"-0.02em" }}>{value}</div>
        <div style={{ fontSize:".58rem", color:"#595a5f", fontWeight:700, marginTop:3, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────
function BarChart({ data, metric, period }) {
  const [hovered, setHovered] = useState(null);
  const maxVal = Math.max(...data.map(d => d[metric.key]), 1);

  return (
    <div style={{ width:"100%", position:"relative" }}>
      {/* Y-axis lines */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", paddingBottom:36 }}>
        {[100,75,50,25,0].map(pct => (
          <div key={pct} style={{
            position:"absolute", left:0, right:0,
            bottom:`calc(${pct}% + 36px)`,
            borderTop:"1px dashed #222222",
            display:"flex", alignItems:"center",
          }}>
            <span style={{ fontSize:".48rem", color:"#595a5f", fontWeight:700, background:"#222222", paddingRight:3, lineHeight:1 }}>
              {Math.round(maxVal * pct / 100)}
            </span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:160, paddingBottom:36, position:"relative" }}>
        {data.map((person, i) => {
          const pct  = (person[metric.key] / maxVal) * 100;
          const isHov = hovered === i;
          return (
            <div
              key={i}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:0, height:"100%", justifyContent:"flex-end", cursor:"pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position:"absolute", bottom: `calc(${pct}% + 40px)`,
                  background:"#cc1515", color:"#fff",
                  fontSize:".6rem", fontWeight:800,
                  padding:"4px 8px", borderRadius:6,
                  pointerEvents:"none", whiteSpace:"nowrap",
                  zIndex:10,
                  boxShadow:"0 4px 16px rgba(204,21,21,.4)",
                  letterSpacing:".5px",
                }}>
                  {person.full}: {person[metric.key]}
                  <div style={{
                    position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)",
                    width:0, height:0,
                    borderLeft:"4px solid transparent", borderRight:"4px solid transparent",
                    borderTop:`4px solid #cc1515`,
                  }} />
                </div>
              )}

              {/* Bar */}
              <div style={{
                width:"100%",
                height:`${pct}%`,
                minHeight: person[metric.key] > 0 ? 6 : 0,
                background: isHov
                  ? `linear-gradient(180deg, ${metric.color}, ${metric.color}cc)`
                  : i === 0
                    ? `linear-gradient(180deg, ${metric.color}, ${metric.color}99)`
                    : `linear-gradient(180deg, ${metric.color}55, ${metric.color}33)`,
                borderRadius:"8px 8px 4px 4px",
                transition:"all .3s ease",
                transform: isHov ? "scaleX(1.05)" : "scaleX(1)",
                boxShadow: isHov ? `0 -4px 16px ${metric.color}50` : "none",
              }} />

              {/* X label */}
              <div style={{
                fontSize:".5rem", color: isHov ? "#cc1515" : "#595a5f",
                fontWeight: isHov ? 800 : 600,
                marginTop:6, textAlign:"center", lineHeight:1.2,
                transition:"color .2s",
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

// ─── Summary mini stats row (clickable filter) ────────────────
function MiniStatRow({ totals, activeKey, onSelect }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {totals.map(m => {
        const active = m.key === activeKey;
        return (
          <div
            key={m.key}
            onClick={() => onSelect(m)}
            style={{
              flex:1, textAlign:"center",
              background: active ? "#cc1515" : "#252525",
              borderRadius:10, padding:"8px 4px",
              border: active ? "none" : "1px solid #222222",
              transition:"all .25s",
              cursor:"pointer",
              boxShadow: active ? `0 4px 16px rgba(204,21,21,.4)` : "none",
              transform: active ? "translateY(-2px)" : "none",
            }}
          >
            <div style={{ fontSize:".85rem", fontWeight:900, color: active ? "#fff" : "#cecece", lineHeight:1 }}>{m.total}</div>
            <div style={{ fontSize:".42rem", color: active ? "rgba(255,255,255,.7)" : "#595a5f", fontWeight:700, marginTop:2, lineHeight:1.2 }}>{m.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Distribution Row ────────────────────────────────────
function TeamDistRow({ agent, totalLeads, rank }) {
  const pct = totalLeads > 0 ? (agent.total / totalLeads) * 100 : 0;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 0",
      borderBottom: "1px solid #2e2e2e",
    }}>
      <div style={{
        width:32, height:32, borderRadius:8, flexShrink:0,
        background: agent.color || agent.avatarColor,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:".7rem", fontWeight:900, color:"#fff",
        border:"1px solid #383838",
      }}>
        {agent.name.charAt(0)}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <div style={{ fontSize:".72rem", fontWeight:800, color:"#ffffff" }}>{agent.name}</div>
          <div style={{ display:"flex", gap:4 }}>
            {[
              { key:"deal",     color:"#cc1515" },
              { key:"new",      color:"#cecece" },
              { key:"callback", color:"#595a5f" },
              { key:"meeting",  color:"#253ff6" },
            ].map(m => agent[m.key] > 0 ? (
              <span key={m.key} style={{ fontSize:".52rem", fontWeight:800, color:m.color, background:m.color+"22", padding:"1px 5px", borderRadius:4, border:`1px solid ${m.color}44` }}>{agent[m.key]}</span>
            ) : null)}
          </div>
        </div>
        <div style={{ height:4, background:"#333333", borderRadius:99, overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${pct}%`,
            background:`linear-gradient(90deg, #cc1515, #cc151580)`,
            borderRadius:99, transition:"width .5s ease",
          }} />
        </div>
      </div>

      <div style={{
        fontSize:".78rem", fontWeight:900, color:"#cc1515",
        flexShrink:0, minWidth:24, textAlign:"right",
      }}>
        {agent.total}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AdminHomePage({ onTabChange }) {
  // ── Load cached data from localStorage instantly ──
  const cachedLeads = JSON.parse(localStorage.getItem("cache_leads") || "[]");
  const cachedTeam  = JSON.parse(localStorage.getItem("cache_team")  || "[]");

  const [leads,        setLeads]        = useState(cachedLeads);
  const [team,         setTeam]         = useState(cachedTeam);
  const [loading,      setLoading]      = useState(cachedLeads.length === 0);
  const [activeMetric, setActiveMetric] = useState(METRICS[0]);

  // ── Load from Supabase ──
  useEffect(() => {
    const load = async () => {
      // Only show loading spinner if no cached data
      if (cachedLeads.length === 0) setLoading(true);
      const [{ data: leadsData }, { data: teamData }] = await Promise.all([
        supabase.from("leads").select("status, assigned_to"),
        supabase.from("users").select("id, name, color").neq("role", "admin").neq("role", "owner"),
      ]);
      const newLeads = leadsData || [];
      const newTeam  = teamData  || [];
      // Save to cache
      localStorage.setItem("cache_leads", JSON.stringify(newLeads));
      localStorage.setItem("cache_team",  JSON.stringify(newTeam));
      setLeads(newLeads);
      setTeam(newTeam);
      setLoading(false);
    };
    load();

    // Real-time updates
    const channel = supabase
      .channel("home-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Derived stats ──
  const stats = STAT_META.map(s => ({
    ...s,
    value: s.key === "total"
      ? leads.length
      : leads.filter(l => l.status === s.key).length,
  }));

  // ── Team distribution data ──
  const teamData = team.map((agent, i) => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id);
    const byStatus = {};
    METRICS.forEach(m => { byStatus[m.key] = agentLeads.filter(l => l.status === m.key).length; });
    return { ...agent, total: agentLeads.length, ...byStatus, avatarColor: AVATARS[i % AVATARS.length] };
  });

  // ── Chart data (team per selected metric) ──
  const chartData = teamData
    .map(a => ({ name: a.name.split(" ")[0], full: a.name, [activeMetric.key]: a[activeMetric.key] }))
    .sort((a, b) => b[activeMetric.key] - a[activeMetric.key]);

  const maxVal = Math.max(...chartData.map(d => d[activeMetric.key]), 1);

  // ── Summary totals ──
  const totals = METRICS.map(m => ({
    ...m,
    total: leads.filter(l => l.status === m.key).length,
  }));



  return (
    <div style={{ padding: "16px 18px 0" }}>
      <NoSelect />

      {/* ── Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Chart Card ── */}
      <div style={{
        background: "#222222", borderRadius: 20,
        padding: "18px 16px 12px",
        boxShadow: "0 4px 32px rgba(0,0,0,.6)",
        marginBottom: 14,
        border: "1px solid #2e2e2e",
        position: "relative", overflow: "hidden",
      }}>
        {/* Red accent top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, #cc1515, transparent)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 900, color: "#ffffff", letterSpacing:"-0.01em" }}>أداء الفريق</div>
            <div style={{ fontSize: ".58rem", color: "#595a5f", fontWeight: 600, marginTop: 2, textTransform:"uppercase", letterSpacing:"1px" }}>موزع على الـ Team</div>
          </div>
        </div>

        <BarChart data={chartData} metric={activeMetric} />

        <div style={{ marginTop: 14 }}>
          <MiniStatRow totals={totals} activeKey={activeMetric.key} onSelect={setActiveMetric} />
        </div>
      </div>

      {/* ── Team Distribution Card ── */}
      <div style={{
        background: "#222222", borderRadius: 20,
        padding: "16px",
        boxShadow: "0 4px 32px rgba(0,0,0,.6)",
        marginBottom: 24,
        border: "1px solid #2e2e2e",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, #cc1515, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".82rem", fontWeight: 900, color: "#ffffff", letterSpacing:"-0.01em" }}>توزيع الليدز</div>
          <div style={{ fontSize: ".58rem", color: "#595a5f", fontWeight: 700, textTransform:"uppercase", letterSpacing:"1px" }}>{leads.length} lead total</div>
        </div>

        {teamData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#595a5f", fontSize: ".78rem", fontWeight: 700, textTransform:"uppercase", letterSpacing:"1px" }}>لا يوجد فريق بعد</div>
        ) : teamData.map((agent, i) => (
          <TeamDistRow key={agent.id} agent={agent} totalLeads={leads.length} rank={i} />
        ))}

        {/* Unassigned row */}
        {(() => {
          const unassigned = leads.filter(l => !l.assigned_to).length;
          if (!unassigned) return null;
          const pct = leads.length > 0 ? (unassigned / leads.length) * 100 : 0;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #2e2e2e", marginTop: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#333333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 900, color: "#595a5f", flexShrink: 0, border:"1px solid #383838" }}>?</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".72rem", fontWeight: 800, color: "#595a5f", marginBottom: 4, textTransform:"uppercase", letterSpacing:".5px" }}>غير موزع</div>
                <div style={{ height: 4, background: "#333333", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#404040", borderRadius: 99, transition: "width .5s ease" }} />
                </div>
              </div>
              <div style={{ fontSize: ".72rem", fontWeight: 900, color: "#595a5f", flexShrink: 0 }}>{unassigned}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
