// ── AdminHomePage.jsx — مطابقة الموك أب بالظبط ────────────────────
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { C } from "./theme";
import {
  Users, Zap, Phone, CalendarCheck, CheckSquare, Handshake,
  TrendingUp, DollarSign, Ban, X, Flag, Clock, CheckCheck,
} from "lucide-react";

const STATUS_META = {
  new:             { label: "New",              color: "#2BD97C", bg: "rgba(43,217,124,0.12)" },
  callback:        { label: "Call Back",        color: "#F2A93B", bg: "rgba(242,169,59,0.12)" },
  pendingMeeting:  { label: "Pending Meeting",  color: "#F2A93B", bg: "rgba(242,169,59,0.12)" },
  meetingDone:     { label: "Meeting Done",     color: "#9B7CFF", bg: "rgba(155,124,255,0.12)" },
  deal:            { label: "Deal",             color: "#E23A4E", bg: "rgba(226,58,78,0.12)" },
  onGoing:         { label: "On Going",         color: "#4C8DFF", bg: "rgba(76,141,255,0.12)" },
  lowBudget:       { label: "Low Budget",       color: "#F2A93B", bg: "rgba(242,169,59,0.12)" },
  noAnswer:        { label: "No Answer",        color: "#8B93A7", bg: "#1D2230" },
  notInterested:   { label: "Not Interested",   color: "#8B93A7", bg: "#1D2230" },
  chooseCompetitor:{ label: "Competitor",       color: "#E23A4E", bg: "rgba(226,58,78,0.12)" },
  longTerm:        { label: "Long Term",        color: "#9B7CFF", bg: "rgba(155,124,255,0.12)" },
  closed:          { label: "Closed",           color: "#8B93A7", bg: "#1D2230" },
};

const ICON_CLASS_STYLES = {
  accent:  { bg: "rgba(226,58,78,0.12)",   color: "#FF4C5E" },
  success: { bg: "rgba(43,217,124,0.12)",  color: "#2BD97C" },
  warning: { bg: "rgba(242,169,59,0.12)",  color: "#F2A93B" },
  info:    { bg: "rgba(76,141,255,0.12)",  color: "#4C8DFF" },
  violet:  { bg: "rgba(155,124,255,0.12)", color: "#9B7CFF" },
  neutral: { bg: "#1D2230",                color: "#8B93A7" },
};

const BAR_COLORS = {
  accent: "#E23A4E", success: "#2BD97C", warning: "#F2A93B",
  info: "#4C8DFF", violet: "#9B7CFF", neutral: "#8B93A7",
};

// ✅ كروت أصغر من السيلز (padding مختصر)
const LEAD_OVERVIEW_CARDS = [
  { key: "all",             label: "All Leads",        Icon: Users,       iconClass: "accent",  featured: true },
  { key: "new",             label: "New Leads",        Icon: Zap,         iconClass: "success" },
  { key: "callback",        label: "Call Back",        Icon: Phone,       iconClass: "warning" },
  { key: "pendingMeeting",  label: "Pending Meeting",  Icon: CalendarCheck, iconClass: "info" },
  { key: "meetingDone",     label: "Meeting Done",     Icon: CheckSquare, iconClass: "violet" },
  { key: "deal",            label: "Deal",             Icon: Handshake,   iconClass: "accent" },
  { key: "onGoing",         label: "On Going",         Icon: TrendingUp,  iconClass: "info" },
  { key: "lowBudget",       label: "Low Budget",       Icon: DollarSign,  iconClass: "warning" },
  { key: "noAnswer",        label: "No Answer",        Icon: Ban,         iconClass: "neutral" },
  { key: "notInterested",   label: "Not Interested",   Icon: X,           iconClass: "neutral" },
  { key: "chooseCompetitor",label: "Competitor",       Icon: Flag,        iconClass: "accent" },
  { key: "longTerm",        label: "Long Term",        Icon: Clock,       iconClass: "violet" },
  { key: "closed",          label: "Closed",           Icon: CheckCheck,  iconClass: "neutral" },
];

const F = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export default function AdminHomePage({ onTabChange, projects, onAddProject, onEditProject }) {
  const [leads, setLeads] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [leadsRes, teamRes] = await Promise.all([
          supabase.from("leads").select("status, assigned_to"),
          supabase.from("users")
            .select("id, name, full_name, color, avatar_url")
            .neq("role", "admin")
            .neq("role", "owner"),
        ]);
        setLeads(leadsRes.data || []);
        setTeam(teamRes.data || []);
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

  const teamData = team.map((agent) => {
    const agentLeads = leads.filter(l => l.assigned_to === agent.id);
    return { ...agent, name: agent.full_name || agent.name, total: agentLeads.length };
  }).sort((a, b) => b.total - a.total);

  const unassigned = leads.filter(l => !l.assigned_to).length;

  return (
    <div style={{ fontFamily: F.body, color: "#F2F3F7" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#8B93A7", fontSize: 14 }}>
          Loading...
        </div>
      ) : (
        <>
          {/* ── Stat Grid (مطابقة الموك أب — 3 columns) ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12, marginBottom: 28,
          }}>
            {LEAD_OVERVIEW_CARDS.map((card, i) => {
              const count = card.key === "all"
                ? leads.length
                : leads.filter(l => l.status === card.key).length;
              const total = leads.length;
              const pct = card.key === "all" ? 100 : (total > 0 ? Math.round((count / total) * 100) : 0);
              const iconStyle = ICON_CLASS_STYLES[card.iconClass];
              const barColor = BAR_COLORS[card.iconClass];
              const isFeatured = card.featured;
              const Icon = card.Icon;

              return (
                <div
                  key={card.key}
                  onClick={() => onTabChange && onTabChange("leads", { status: card.key === "all" ? null : card.key })}
                  style={{
                    background: isFeatured
                      ? "linear-gradient(160deg, rgba(226,58,78,0.10), #171B24 55%)"
                      : "#171B24",
                    border: `1px solid ${isFeatured ? "rgba(226,58,78,0.25)" : "#1B1F2A"}`,
                    borderRadius: 14, padding: "14px 14px 12px",
                    cursor: "pointer", position: "relative", overflow: "hidden",
                    transition: "border-color .15s ease, transform .15s ease, background .15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#242938"; e.currentTarget.style.background = isFeatured ? "linear-gradient(160deg, rgba(226,58,78,0.15), #1D2230 55%)" : "#1D2230"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = isFeatured ? "rgba(226,58,78,0.25)" : "#1B1F2A"; e.currentTarget.style.background = isFeatured ? "linear-gradient(160deg, rgba(226,58,78,0.10), #171B24 55%)" : "#171B24"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {/* Icon */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: iconStyle.bg, color: iconStyle.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} strokeWidth={2} />
                    </div>
                  </div>
                  {/* Value */}
                  <div style={{
                    fontFamily: F.mono, fontSize: 22, fontWeight: 700,
                    color: "#F2F3F7", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4,
                  }}>{count}</div>
                  {/* Label */}
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "#8B93A7",
                    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8,
                  }}>{card.label}</div>
                  {/* Progress bar */}
                  <div style={{ height: 3, borderRadius: 3, background: "#1B1F2A", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: barColor, width: `${pct}%`, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Team Leaderboard (مطابقة الموك أب) ── */}
          <div style={{
            background: "#171B24", border: "1px solid #1B1F2A",
            borderRadius: 14, padding: "22px 22px 8px",
          }}>
            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{
                fontFamily: F.display, fontSize: 16, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8, color: "#F2F3F7",
              }}>
                <span style={{ width: 3, height: 16, background: "#E23A4E", borderRadius: 2, display: "inline-block" }} />
                Team Leaderboard
              </div>
              <div style={{ fontSize: 12.5, color: "#5B6478" }}>{leads.length} leads total</div>
            </div>

            {/* Leaderboard rows */}
            {teamData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#5B6478", fontSize: 13 }}>
                No team yet
              </div>
            ) : (
              <>
                {teamData.map((agent, i) => (
                  <div key={agent.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 4px", borderBottom: "1px solid #1B1F2A",
                  }}>
                    <div style={{
                      fontFamily: F.mono, fontSize: 13, fontWeight: 700,
                      color: i < 3 ? (i === 0 ? "#F2A93B" : i === 1 ? "#8B93A7" : "#9B7CFF") : "#5B6478",
                      width: 20,
                    }}>{String(i + 1).padStart(2, "0")}</div>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: agent.color || "#1D2230",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: F.display, fontWeight: 600, fontSize: 13, color: "#fff",
                    }}>
                      {(agent.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, flex: 1, color: "#F2F3F7" }}>
                      {agent.name || "Unknown"}
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 600, color: "#8B93A7" }}>
                      {agent.total} leads
                    </div>
                  </div>
                ))}

                {/* Unassigned */}
                {unassigned > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 4px", borderBottom: "none",
                  }}>
                    <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: "#5B6478", width: 20 }}>—</div>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: "#1D2230", border: "1px dashed #242938",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 600, color: "#5B6478",
                    }}>?</div>
                    <div style={{ fontSize: 14, fontWeight: 600, flex: 1, color: "#8B93A7" }}>Unassigned</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 600, color: "#5B6478" }}>{unassigned} leads</div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
