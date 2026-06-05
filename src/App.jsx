// ── App.jsx
import { useState, useEffect } from "react";
import { supabase }         from "./lib/supabase";
import Login                from "./Login";
import HomePage             from "./HomePage";
import LeadsPage            from "./LeadsPage";
import TimelinePage         from "./TimelinePage";
import ProjectsPage         from "./ProjectsPage";
import AdminHomePage        from "./AdminHomePage";
import AdminLeadsPage       from "./AdminLeadsPage";
import AdminSettings        from "./AdminSettings";
import AddProjectPage       from "./AddProjectPage";
import ResetPassword        from "./ResetPassword";
import AppHeader            from "./AppHeader";
import BottomNav            from "./BottomNav";
import NotificationPanel    from "./NotificationPanel";
import ProfileModal         from "./ProfileModal";

// ─── ONYX Design ─────────────────────────────────────────────────
const OnyxGlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800;900&display=swap');
    * { -webkit-user-select: none !important; user-select: none !important; box-sizing: border-box; }
    :root {
      --onyx-black: #000000; --onyx-red: #cc1515; --onyx-white: #ffffff;
      --onyx-silver: #cecece; --onyx-gray: #595a5f; --onyx-blue: #253ff6;
      --onyx-surface: #0a0a0a; --onyx-card: #111111; --onyx-border: #1e1e1e;
    }
    body, html { background: var(--onyx-surface) !important; color: var(--onyx-white) !important; font-family: 'Archivo', sans-serif !important; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--onyx-black); }
    ::-webkit-scrollbar-thumb { background: var(--onyx-red); border-radius: 2px; }
    @keyframes onyx-fade-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .onyx-animate { animation: onyx-fade-up 0.35s ease both; }
  `}</style>
);

const OnyxLogo = ({ size = 32 }) => (
  <svg width={size * 3.2} height={size} viewBox="0 0 128 40" fill="none">
    <text x="0" y="30" fontFamily="'Archivo','Arial Black',sans-serif" fontWeight="700" fontSize="28" fill="#ffffff" letterSpacing="-0.5">ONY</text>
    <g transform="translate(88, 4)">
      <line x1="0"  y1="0"  x2="18" y2="32" stroke="#cc1515" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="18" y1="0"  x2="0"  y2="32" stroke="#cc1515" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="4"  y1="16" x2="14" y2="16" stroke="#cc1515" strokeWidth="3"   strokeLinecap="round"/>
    </g>
  </svg>
);

// ─── Tab constants ────────────────────────────────────────────────
const TAB_HOME     = 0;
const TAB_LEADS    = 1;
const TAB_SCHEDULE = 2;
const TAB_PROJECTS = 3;

const TAB_ADDPROJECT = 2;
const TAB_SETTINGS   = 3;

const ADMIN_NAV = [
  { icon: "house", label: "Home"        },
  { icon: "chart", label: "Leads"       },
  { icon: "task",  label: "Add Project" },
  { icon: "gear",  label: "Settings"    },
];

const INIT_NOTIFS = [
  { id: 1, text: "تم تسجيل بروكر جديد في النظام",   time: "منذ 5 دقائق", color: "#cc1515", unread: true  },
  { id: 2, text: "تقرير المبيعات الشهري جاهز",       time: "منذ ساعة",    color: "#253ff6", unread: true  },
  { id: 3, text: "طلب تعديل على مشروع Nile Heights", time: "منذ 3 ساعات", color: "#595a5f", unread: false },
];

const hashToTab = () => {
  const saved = parseInt(sessionStorage.getItem("adminTab") || "0");
  // TAB_ADDPROJECT (2) is a modal state, not a real tab — on refresh go to HOME
  if (saved === TAB_ADDPROJECT) return TAB_HOME;
  return [TAB_HOME, TAB_LEADS, TAB_SETTINGS].includes(saved) ? saved : TAB_HOME;
};

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  // Reset password route — check before any hooks
  const isResetPage =
    window.location.pathname === "/reset-password" ||
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("type=recovery");

  // ── Auth state ──

  const [authLoading, setAuthLoading] = useState(true);
  const [topLoading,  setTopLoading]  = useState(true);
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [userRole,    setUserRole]    = useState(null);



  // ── Shared state ──
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("onyx_projects");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [editProject,    setEditProject]    = useState(null);
  const [showAddProject, setShowAddProject] = useState(
    () => sessionStorage.getItem("showAddProject") === "true"
  );

  // ── Admin UI state ──
  const [activeAdminTab, setActiveAdminTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("adminTab") || "0");
    if (saved === TAB_ADDPROJECT) return TAB_HOME;
    return [TAB_HOME, TAB_LEADS, TAB_SETTINGS].includes(saved) ? saved : TAB_HOME;
  });
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [notifs,         setNotifs]         = useState(INIT_NOTIFS);

  // ── Sales tab ──
  const [activeSalesTab, setActiveSalesTab] = useState(
    () => parseInt(sessionStorage.getItem("activeTab") || "0")
  );

  // ── Supabase auth listener ────────────────────────────────────
  useEffect(() => {
    // Fallback timeout — if Supabase is slow on mobile, force unlock after 5s
    const timeout = setTimeout(() => {
      setAuthLoading(false);
      setTopLoading(false);
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        await resolveRole(session.user.id);
      } else {
        // No session → clear storage, go to login
        setTopLoading(false);
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userRole");
        setAuthLoading(false);
      }
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await resolveRole(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setLoggedIn(false);
          setUserRole(null);
          setTopLoading(false);
          setAuthLoading(false);
        }
      }
    );

    // Keep Alive — prevent Supabase cold start every 10 mins
    const keepAlive = setInterval(() => {
      supabase.from("users").select("id").limit(1);
    }, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(keepAlive);
    };
  }, []);

  const resolveRole = async (userId) => {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const role = data?.role || localStorage.getItem("userRole") || "sales";
    setUserRole(role);
    setLoggedIn(true);
    setTopLoading(false);
    setAuthLoading(false);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
  };

  // ── Tab persistence (sales) ──
  useEffect(() => {
    sessionStorage.setItem("activeTab", activeSalesTab);
  }, [activeSalesTab]);

  const handleAdminTabChange = (tab) => {
    sessionStorage.setItem("adminTab", tab);
    setActiveAdminTab(tab);
  };

  // ── Login / SignOut handlers ──
  const handleLogin = (role) => {
    setUserRole(role);
    setLoggedIn(true);
    setActiveSalesTab(TAB_HOME);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.setItem("loggedIn", "false");
    localStorage.removeItem("userRole");
    setLoggedIn(false);
    setActiveSalesTab(TAB_HOME);
    setProjects([]);
    localStorage.removeItem("onyx_projects");
    setEditProject(null);
    setShowAddProject(false);
  };

  // ── Project helpers ──
  const handleProjectSaved = (project) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      const updated = exists
        ? prev.map(p => p.id === project.id ? project : p)
        : [...prev, project];
      try { localStorage.setItem("onyx_projects", JSON.stringify(updated)); } catch {}
      return updated;
    });
    setEditProject(null);
    setShowAddProject(false);
    sessionStorage.setItem("showAddProject", "false");
    handleAdminTabChange(TAB_HOME);
  };

  const openAddProject = (project = null) => {
    setEditProject(project);
    setShowAddProject(true);
    sessionStorage.setItem("adminTab", TAB_ADDPROJECT);
    sessionStorage.setItem("showAddProject", "true");
  };

  const cancelAddProject = () => {
    setEditProject(null);
    setShowAddProject(false);
    sessionStorage.setItem("showAddProject", "false");
    handleAdminTabChange(TAB_HOME);
  };

  const unread = notifs.filter(n => n.unread).length;

  // ────────────────────────────────────────────────────────────────
  // RENDER GATES
  // ────────────────────────────────────────────────────────────────

  if (isResetPage) return <ResetPassword />;

// Refresh while logged in: show thin top progress bar over the app
  // (don't block the whole screen)
  const TopLoadingBar = () => topLoading ? (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 3,
      zIndex: 9999, background: "#1e1e1e", overflow: "hidden",
    }}>
      <div style={{
        height: "100%", background: "#cc1515",
        animation: "topbar-slide 1.2s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes topbar-slide {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  ) : null;

  if (authLoading) return (
    <>
      <OnyxGlobalStyles />
      <TopLoadingBar />
      <div style={{ minHeight: "100vh", background: "#0a0a0a" }} />
    </>
  );

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  // ── ADMIN / OWNER ──────────────────────────────────────────────
  if (userRole === "admin" || userRole === "owner") {

    // Add Project screen (full-page takeover)
    if (showAddProject) {
      return (
        <>
          <OnyxGlobalStyles />
          <AddProjectPage
            onProjectSaved={handleProjectSaved}
            onTabChange={(tab) => {
              cancelAddProject();
              handleAdminTabChange(tab === TAB_ADDPROJECT ? TAB_HOME : tab);
            }}
            onSignOut={handleSignOut}
            editProject={editProject}
            navItems={ADMIN_NAV}
            activeTab={TAB_ADDPROJECT}
          />
        </>
      );
    }

    const renderAdminPage = () => {
      switch (activeAdminTab) {
        case TAB_HOME:
          return (
            <AdminHomePage
              onTabChange={handleAdminTabChange}
              projects={projects}
              onAddProject={() => openAddProject()}
              onEditProject={(p) => openAddProject(p)}
            />
          );
        case TAB_LEADS:
          return <AdminLeadsPage onTabChange={handleAdminTabChange} externalModalOpen={notifOpen || profileOpen} />;
        case TAB_ADDPROJECT:
          return null;
        case TAB_SETTINGS:
          return <AdminSettings onTabChange={handleAdminTabChange} onSignOut={handleSignOut} />;
        default:
          return null;
      }
    };

    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        fontFamily: "'Archivo', sans-serif",
        paddingBottom: 62,
        color: "#ffffff",
        position: "relative",
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 50% -10%, rgba(204,21,21,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37,63,246,0.05) 0%, transparent 50%)
        `,
      }}>
        <OnyxGlobalStyles />
        <TopLoadingBar />

        {/* Red top accent */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, #cc1515 0%, #ff2020 40%, transparent 100%)",
          position: "sticky", top: 0, zIndex: 100,
        }} />

        <AppHeader
          unreadCount={unread}
          onBellClick={()    => setNotifOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
          logo={<OnyxLogo size={28} />}
        />

        <div className="onyx-animate" key={activeAdminTab}>
          {renderAdminPage()}
        </div>

        <NotificationPanel
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifs={notifs}
          onMarkAll={() => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))}
        />
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSignOut={handleSignOut}
        />

        <BottomNav
          activeTab={activeAdminTab}
          onTabChange={(tab) => {
            if (tab === TAB_ADDPROJECT) { openAddProject(); return; }
            handleAdminTabChange(tab);
          }}
          items={ADMIN_NAV}
        />
      </div>
    );
  }

  // ── SALES ──────────────────────────────────────────────────────
  const renderSalesPage = () => {
    switch (activeSalesTab) {
      case TAB_HOME:
        return <HomePage activeTab={activeSalesTab} onTabChange={setActiveSalesTab} onSignOut={handleSignOut} />;
      case TAB_LEADS:
        return <LeadsPage activeTab={activeSalesTab} onTabChange={setActiveSalesTab} onSignOut={handleSignOut} />;
      case TAB_SCHEDULE:
        return <TimelinePage activeTab={activeSalesTab} onTabChange={setActiveSalesTab} onSignOut={handleSignOut} />;
      case TAB_PROJECTS:
        return showAddProject ? (
          <AddProjectPage
            onProjectSaved={handleProjectSaved}
            onTabChange={(tab) => { setShowAddProject(false); setActiveSalesTab(tab); }}
            onSignOut={handleSignOut}
            editProject={editProject}
          />
        ) : (
          <ProjectsPage
            projects={projects}
            onTabChange={setActiveSalesTab}
            onSignOut={handleSignOut}
            onEditProject={(p) => { setEditProject(p); setShowAddProject(true); }}
            onAddProject={() => { setEditProject(null); setShowAddProject(true); }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      fontFamily: "'Archivo', sans-serif",
      background: "#0a0a0a",
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      color: "#ffffff",
    }}>
      <OnyxGlobalStyles />
      <TopLoadingBar />
      {renderSalesPage()}
    </div>
  );
}
