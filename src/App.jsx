// ── App.jsx
import { useState, useEffect, useCallback } from "react";
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
    ::-webkit-scrollbar { width: 0px; height: 0px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: transparent; }
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

// Always start from HOME — no tab persistence across app opens

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
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email, role }
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(null);

  // Refresh avatar from DB (called after ProfileModal closes)
  const refreshAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("users").select("avatar_url").eq("id", user.id).single();
    if (data?.avatar_url) setHeaderAvatarUrl(data.avatar_url);
  };



  // ── Shared state ──
  const [projects,      setProjects]      = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [editProject,    setEditProject]    = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);

  // ── Sales leads state ──
  const [leadsFilter,  setLeadsFilter]  = useState(null); // null = "all"

  // ── Admin leads filter state ──
  const [adminLeadsFilter, setAdminLeadsFilter] = useState(null); // { status, agent_id }

  // ── Admin UI state ──
  // sessionStorage = same browser session (tab open) → survives refresh but clears on app close
  const [activeAdminTab, setActiveAdminTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("adminTab") ?? "-1");
    if (saved === TAB_ADDPROJECT) return TAB_HOME;
    return [TAB_HOME, TAB_LEADS, TAB_SETTINGS].includes(saved) ? saved : TAB_HOME;
  });
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [notifs,         setNotifs]         = useState(INIT_NOTIFS);

  // ── Sales tab ──
  const [activeSalesTab, setActiveSalesTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("salesTab") ?? "-1");
    return [TAB_HOME, TAB_LEADS, TAB_SCHEDULE, TAB_PROJECTS].includes(saved) ? saved : TAB_HOME;
  });

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
      .select("id, name, email, role")
      .eq("id", userId)
      .single();

    const role = data?.role || localStorage.getItem("userRole") || "sales";
    setUserRole(role);
    setCurrentUser({
      id:    userId,
      name:  data?.name  || data?.email || "Sales",
      email: data?.email || "",
      role,
    });
    setLoggedIn(true);
    setTopLoading(false);
    setAuthLoading(false);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
    // Load avatar for header
    const { data: av } = await supabase.from("users").select("avatar_url").eq("id", userId).single();
    if (av?.avatar_url) setHeaderAvatarUrl(av.avatar_url);
  };

  // ── Leads state خفيف للـ HomePage stats بس ──────────────────
  // الـ fetch والـ realtime الحقيقي جوا LeadsPage
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    // جيب الليدز المخصصة للسيلز عشان يظهر الـ stats في HomePage
    supabase
      .from("leads")
      .select("id, status, assigned_to")
      .eq("assigned_to", currentUser.id)
      .then(({ data }) => { if (data) setLeads(data.map(r => ({ id: r.id, status: r.status }))); });
    // Realtime خفيف — بس يحدّث الـ counts
    const ch = supabase
      .channel("app-leads-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        supabase
          .from("leads")
          .select("id, status, assigned_to")
          .eq("assigned_to", currentUser.id)
          .then(({ data }) => { if (data) setLeads(data.map(r => ({ id: r.id, status: r.status }))); });
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUser?.id]);
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Map snake_case DB columns → camelCase for the UI
      const mapped = data.map(r => ({
        id:           r.id,
        name:         r.name,
        developer:    r.developer,
        location:     r.location,
        category:     r.category,
        status:       r.status,
        statusColor:  r.status_color,
        isLaunch:     r.is_launch,
        price:        r.price,
        area:         r.area,
        delivery:     r.delivery,
        projectArea:  r.project_area,
        prevWork:     r.prev_work,
        maintenance:  r.maintenance,
        parking:      r.parking,
        description:  r.description,
        coverVideo:   r.cover_video,
        coverThumb:   r.cover_thumb,
        profilePic:   r.profile_pic,
        amenities:    r.amenities    || [],
        units:        r.units        || [],
        stories:      r.stories      || [],
        paymentPlans: r.payment_plans|| [],
        stats:        r.stats        || { leads: 0, deals: 0 },
        agent:        r.agent        || {},
      }));
      setProjects(mapped);
    }
    setProjectsLoading(false);
  }, []);

  // Fetch on login
  useEffect(() => {
    if (loggedIn) fetchProjects();
  }, [loggedIn, fetchProjects]);

  // Realtime subscription — auto-update when admin adds/edits
  useEffect(() => {
    if (!loggedIn) return;
    const channel = supabase
      .channel("projects-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        fetchProjects();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loggedIn, fetchProjects]);

  // Persist current tab to sessionStorage (survives refresh, clears on app close)
  useEffect(() => { sessionStorage.setItem("salesTab",  String(activeSalesTab));  }, [activeSalesTab]);
  useEffect(() => { sessionStorage.setItem("adminTab",  String(activeAdminTab));  }, [activeAdminTab]);

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSalesTab, activeAdminTab]);

  const handleAdminTabChange = (tab, filter = null) => {
    if (tab === "leads") {
      setAdminLeadsFilter(filter);
      setActiveAdminTab(TAB_LEADS);
      sessionStorage.setItem("adminTab", String(TAB_LEADS));
      return;
    }
    setAdminLeadsFilter(null);
    setActiveAdminTab(tab);
    sessionStorage.setItem("adminTab", String(tab));
  };

  // ── Login / SignOut handlers ──
  const handleLogin = (role) => {
    setUserRole(role);
    setLoggedIn(true);
    setActiveSalesTab(TAB_HOME);
    setActiveAdminTab(TAB_HOME);
    sessionStorage.removeItem("adminTab");
    sessionStorage.removeItem("salesTab");
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.setItem("loggedIn", "false");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("adminTab");
    sessionStorage.removeItem("salesTab");
    setLoggedIn(false);
    setCurrentUser(null);
    setActiveSalesTab(TAB_HOME);
    setActiveAdminTab(TAB_HOME);
    setProjects([]);
    setEditProject(null);
    setShowAddProject(false);
  };

  // ── Project helpers ──
  const handleProjectSaved = async (project) => {
    // Map camelCase → snake_case for DB
    const row = {
      name:          project.name,
      developer:     project.developer,
      location:      project.location,
      category:      project.category,
      status:        project.status,
      status_color:  project.statusColor,
      is_launch:     project.isLaunch || false,
      price:         project.price,
      area:          project.area,
      delivery:      project.delivery,
      project_area:  project.projectArea,
      prev_work:     project.prevWork,
      maintenance:   project.maintenance,
      parking:       project.parking,
      description:   project.description,
      cover_video:   project.coverVideo,
      cover_thumb:   project.coverThumb,
      profile_pic:   project.profilePic,
      amenities:     project.amenities    || [],
      units:         project.units        || [],
      stories:       project.stories      || [],
      payment_plans: project.paymentPlans || [],
      stats:         project.stats        || { leads: 0, deals: 0 },
      agent:         project.agent        || {},
    };

    // editProject له id من Supabase (uuid string بطول 36)
    // project جديد له id من Date.now() (رقم أو string قصير)
    const showDebugToast = (msg, color) => {
      const el = document.createElement("div");
      el.innerText = msg;
      Object.assign(el.style, {
        position:"fixed", bottom:"90px", left:"16px", right:"16px",
        background: color || "#253ff6", color:"#fff", padding:"12px 16px",
        borderRadius:"12px", fontSize:"12px", fontWeight:"700",
        zIndex:"99999", whiteSpace:"pre-wrap", wordBreak:"break-all",
        boxShadow:"0 4px 20px rgba(0,0,0,0.5)", fontFamily:"monospace",
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 12000);
    };

    const isExisting = editProject && typeof editProject.id === "string" && editProject.id.length === 36;

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    showDebugToast("User: " + (uid ? uid.slice(0,8)+"..." : "NO SESSION") + "\nMode: " + (isExisting ? "UPDATE" : "INSERT"));

    if (isExisting) {
      const { data, error } = await supabase.from("projects").update(row).eq("id", editProject.id).select();
      if (error) {
        showDebugToast("INSERT ERROR:\n" + error.message + "\n" + (error.details||"") + "\n" + (error.hint||""), "#cc1515");
      } else {
        showDebugToast("UPDATE OK - ID: " + (data?.[0]?.id?.slice(0,8)||"?"), "#10b981");
      }
    } else {
      const { data, error } = await supabase.from("projects").insert(row).select();
      if (error) {
        showDebugToast("INSERT ERROR:\n" + error.message + "\n" + (error.details||"") + "\n" + (error.hint||""), "#cc1515");
      } else {
        showDebugToast("INSERT OK - ID: " + (data?.[0]?.id?.slice(0,8)||"?"), "#10b981");
      }
    }

    // fetchProjects manually (+ realtime as backup)
    await fetchProjects();
    setEditProject(null);
    setShowAddProject(false);
    handleAdminTabChange(TAB_HOME);
  };

  const openAddProject = (project = null) => {
    setEditProject(project);
    setShowAddProject(true);
  };

  const cancelAddProject = () => {
    setEditProject(null);
    setShowAddProject(false);
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

    const renderAdminPage = () => {
      // Add Project rendered inside layout (keeps fixed header)
      if (showAddProject) {
        return (
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
        );
      }
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
          return <AdminLeadsPage onTabChange={handleAdminTabChange} externalModalOpen={notifOpen || profileOpen} initialFilter={adminLeadsFilter} />;
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
        height: "100dvh",
        background: "#0a0a0a",
        fontFamily: "'Archivo', sans-serif",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 50% -10%, rgba(204,21,21,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37,63,246,0.05) 0%, transparent 50%)
        `,
      }}>
        <OnyxGlobalStyles />
        <TopLoadingBar />

        {/* ── FIXED HEADER AREA ── */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 50 }}>
          {/* Red top accent */}
          <div style={{
            height: 2,
            background: "linear-gradient(90deg, #cc1515 0%, #ff2020 40%, transparent 100%)",
          }} />

          <AppHeader
            unreadCount={unread}
            onBellClick={()    => setNotifOpen(true)}
            onProfileClick={() => setProfileOpen(true)}
            logo={<OnyxLogo size={28} />}
            avatarUrl={headerAvatarUrl}
          />
        </div>

        {/* ── SCROLLABLE PAGE CONTENT ── */}
        <div
          key={activeAdminTab}
          className="onyx-animate"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}
        >
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
          onClose={() => { setProfileOpen(false); refreshAvatar(); }}
          onSignOut={handleSignOut}
        />

        {/* ── FIXED BOTTOM NAV ── */}
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
        return (
          <HomePage
            activeTab={activeSalesTab}
            onTabChange={setActiveSalesTab}
            onSignOut={handleSignOut}
            leads={leads}
            onLeadsFilter={(filterKey) => {
              setLeadsFilter(filterKey);
              setActiveSalesTab(TAB_LEADS);
            }}
          />
        );
      case TAB_LEADS:
        return (
          <LeadsPage
            activeTab={activeSalesTab}
            onTabChange={setActiveSalesTab}
            onSignOut={handleSignOut}
            currentUser={currentUser}
            initialFilter={leadsFilter}
          />
        );
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
            loading={projectsLoading}
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
