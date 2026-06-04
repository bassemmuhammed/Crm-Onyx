// ── SplashScreen.jsx
// Standalone splash screen component for ONYX CRM

export default function SplashScreen({ done }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"linear-gradient(145deg,#0f0c29 0%,#302b63 60%,#24243e 100%)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:12,
      opacity: done ? 0 : 1, pointerEvents: done ? "none" : "all",
      transition:"opacity .5s ease",
      userSelect:"none", WebkitUserSelect:"none",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:"2.4rem", fontWeight:900, color:"#fff", letterSpacing:-1 }}>
        ONYX <span style={{ color:"#a78bfa" }}>CRM</span>
      </div>
      <div style={{ color:"rgba(255,255,255,.55)", fontSize:".82rem", letterSpacing:1 }}>
        BROKER DASHBOARD
      </div>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        border:"3px solid rgba(255,255,255,.2)", borderTopColor:"#a78bfa",
        marginTop:8, animation:"spin .9s linear infinite",
      }} />
    </div>
  );
}
