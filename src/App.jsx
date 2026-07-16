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
import SetPassword          from "./SetPassword";   // ✅ P0-4: Set Password flow (مطابق Flutter)
import AppHeader            from "./AppHeader";
import BottomNav            from "./BottomNav";
import NotificationPanel    from "./NotificationPanel";
import ProfileModal         from "./ProfileModal";
import { NotificationProvider, useNotifications } from "./NotificationContext";
import { isSetPasswordUrl, isResetPasswordUrl } from "./DeepLinkService";  // ✅ P0-4
import { notifyAdminsOnSalesPresence } from "./AdminPushHelpers";  // ✅ P0-5
import AdminCommissionsPage     from "./AdminCommissionsPage";   // ✅ P0-6
import SalesCommissionsPage     from "./SalesCommissionsPage";   // ✅ P0-6
import DeveloperUnitsPage       from "./DeveloperUnitsPage";     // ✅ P0-7
import DeveloperAdminPage       from "./DeveloperAdminPage";     // ✅ P0-7
import Sidebar, { SIDEBAR_WIDTH, MOBILE_BREAKPOINT } from "./components/Sidebar";  // ✅ Sidebar navigation
import { Home, Users, FileText, Settings, Building2, DollarSign } from "lucide-react";  // ✅ Sidebar icons

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

function NotifConnectedHeader({ onBellClick, onProfileClick, logo, avatarUrl }) {
  const { unreadCount } = useNotifications();
  return (
    <AppHeader
      unreadCount={unreadCount}
      onBellClick={onBellClick}
      onProfileClick={onProfileClick}
      logo={logo}
      avatarUrl={avatarUrl}
    />
  );
}

// ✅ Sidebar wrapper يأخذ unreadCount من NotificationContext
function SidebarConnected(props) {
  const { unreadCount } = useNotifications();
  return <Sidebar {...props} unreadCount={unreadCount} />;
}

// ─── Inner shell — uses NotificationContext ───────────────────────
function NotifConnectedPanels({ open, onClose, onProfileClick, profileOpen, onProfileClose, onSignOut, refreshAvatar }) {
  const { notifs, markAllRead, markRead } = useNotifications();
  return (
    <>
      <NotificationPanel
        open={open}
        onClose={onClose}
        notifs={notifs}
        onMarkAll={markAllRead}
        onMarkRead={markRead}
      />
      <ProfileModal
        open={profileOpen}
        onClose={() => { onProfileClose(); refreshAvatar(); }}
        onSignOut={onSignOut}
      />
    </>
  );
}

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

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  // ✅ P0-4: Use DeepLinkService for set-password (invite) vs reset-password (recovery)
  //   - invite type → SetPassword screen (full set-password flow مطابق Flutter)
  //   - recovery type → ResetPassword screen (legacy simple reset)
  const isSetPassword = isSetPasswordUrl();
  const isResetPage   = !isSetPassword && isResetPasswordUrl();

  const [authLoading, setAuthLoading] = useState(true);
  const [topLoading,  setTopLoading]  = useState(true);
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [userRole,    setUserRole]    = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(null);

  const refreshAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("users").select("avatar_url").eq("id", user.id).single();
    if (data?.avatar_url) setHeaderAvatarUrl(data.avatar_url);
  };

  const [projects,        setProjects]        = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [editProject,     setEditProject]     = useState(null);
  const [showAddProject,  setShowAddProject]  = useState(false);
  const [leadsFilter,     setLeadsFilter]     = useState(null);
  const [adminLeadsFilter,setAdminLeadsFilter] = useState(null);

  const [activeAdminTab, setActiveAdminTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("adminTab") ?? "-1");
    if (saved === TAB_ADDPROJECT) return TAB_HOME;
    return [TAB_HOME, TAB_LEADS, TAB_SETTINGS].includes(saved) ? saved : TAB_HOME;
  });
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // ✅ P0-6: Commissions modal state
  const [showCommissions, setShowCommissions] = useState(false);
  // ✅ P0-7: Developer module modal state
  const [showDeveloper, setShowDeveloper] = useState(null); // null | "units" | "admin"

  const [activeSalesTab, setActiveSalesTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("salesTab") ?? "-1");
    return [TAB_HOME, TAB_LEADS, TAB_SCHEDULE, TAB_PROJECTS].includes(saved) ? saved : TAB_HOME;
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthLoading(false);
      setTopLoading(false);
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        await resolveRole(session.user.id);
      } else {
        setTopLoading(false);
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userRole");
        setAuthLoading(false);
      }
    });

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
      .select("id, full_name, email, role, active, account_type")  // ✅ full_name + active + account_type
      .eq("id", userId)
      .single();

    const role = data?.role || localStorage.getItem("userRole") || "sales";
    setUserRole(role);
    const salesName = data?.full_name || data?.email || "Sales";
    setCurrentUser({
      id:    userId,
      name:  salesName,
      email: data?.email || "",
      role,
      accountType: data?.account_type || "broker",  // ✅ P0-7 preparation
    });
    setLoggedIn(true);
    setTopLoading(false);
    setAuthLoading(false);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
    const { data: av } = await supabase.from("users").select("avatar_url").eq("id", userId).single();
    if (av?.avatar_url) setHeaderAvatarUrl(av.avatar_url);

    // ✅ P1-4: تحديث last_seen عند كل login (مطابقة Flutter)
    try {
      await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userId);
    } catch (e) {
      console.warn("Failed to update last_seen:", e);
    }

    // ✅ P0-5: Notify admins on sales presence (مطابق Flutter MainShell.didChangeAppLifecycleState)
    // فقط للـ sales/agent (ليس admin/owner) — الأدمن لا يستلم إشعارات لنفسه
    if (role !== "admin" && role !== "owner") {
      try {
        await notifyAdminsOnSalesPresence({ salesName, kind: "logged in" });
      } catch (e) {
        console.warn("notifyAdminsOnSalesPresence failed:", e);
      }
    }
  };

  const [leads, setLeads] = useState([]);

  // ✅ P0-5: App lifecycle observer — notify admins on sales resume (مطابق Flutter)
  useEffect(() => {
    if (!currentUser?.id) return;
    if (userRole === "admin" || userRole === "owner") return; // only sales

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        notifyAdminsOnSalesPresence({
          salesName: currentUser.name,
          kind: "opened the app",
        }).catch(e => console.warn("presence push failed:", e));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentUser?.id, userRole]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchLeadsStats = () => supabase
      .from("leads")
      .select("id, name, status, assigned_to, callback_date, callback_time")
      .eq("assigned_to", currentUser.id)
      .then(({ data }) => {
        if (data) setLeads(data.map(r => ({
          id:           r.id,
          name:         r.name,
          status:       r.status,
          assignedTo:   r.assigned_to,
          callbackDate: r.callback_date || "",
          callbackTime: r.callback_time || "",
          meetingDate:  r.callback_date || "",
          meetingTime:  r.callback_time || "",
        })));
      });
    fetchLeadsStats();
    const ch = supabase
      .channel("app-leads-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeadsStats)
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
      const mapped = data.map(r => ({
        id:           r.id,
        name:         r.name,
        developer:    r.developer,
        location:     r.location,
        locationLink: r.location_link || "",
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

  useEffect(() => {
    if (loggedIn) fetchProjects();
  }, [loggedIn, fetchProjects]);

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

  useEffect(() => { sessionStorage.setItem("salesTab", String(activeSalesTab)); }, [activeSalesTab]);
  useEffect(() => { sessionStorage.setItem("adminTab", String(activeAdminTab)); }, [activeAdminTab]);

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

  const handleLogin = (role) => {
    setUserRole(role);
    setLoggedIn(true);
    setActiveSalesTab(TAB_HOME);
    setActiveAdminTab(TAB_HOME);
    setShowAddProject(false);
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

  const handleProjectSaved = async (project) => {
    const row = {
      name:          project.name,
      developer:     project.developer,
      location:      project.location,
      location_link: project.locationLink || "",
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

    const isExisting = editProject && typeof editProject.id === "string" && editProject.id.length === 36;
    if (isExisting) {
      await supabase.from("projects").update(row).eq("id", editProject.id);
    } else {
      await supabase.from("projects").insert(row);
    }

    await fetchProjects();
    setEditProject(null);
  };

  const openAddProject = (project = null) => {
    setEditProject(project);
    setShowAddProject(true);
  };

  const handleDeleteProject = async (projectId) => {
    await supabase.from("projects").delete().eq("id", projectId);
    await fetchProjects();
    setEditProject(null);
    setShowAddProject(false);
  };

  const cancelAddProject = () => {
    setEditProject(null);
    setShowAddProject(false);
    handleAdminTabChange(TAB_HOME);
  };

  // ✅ P0-4: Set Password screen (invite flow) — مطابق SetPasswordScreen في Flutter
  if (isSetPassword) {
    return (
      <SetPassword
        onSuccess={async ({ email, session }) => {
          // بعد نجاح set-password، عالج مثل الـ login العادي
          if (session?.user) {
            await resolveRole(session.user.id);
            setLoggedIn(true);
          } else {
            // fallback: redirect to login
            window.location.href = "/";
          }
        }}
        onBackToLogin={() => {
          // امسح الـ URL وارجع للـ login
          window.history.replaceState({}, document.title, "/");
          window.location.reload();
        }}
      />
    );
  }

  if (isResetPage) return <ResetPassword />;

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
              isAdmin={true}
              projects={projects}
              onDeleteProject={handleDeleteProject}
            />
          );
        case TAB_SETTINGS:
          return <AdminSettings onTabChange={handleAdminTabChange} onSignOut={handleSignOut} />;
        default:
          return null;
      }
    };

    return (
      <NotificationProvider currentUser={currentUser}>
      <div style={{
        height: "100dvh",
        background: "#0a0a0a",
        fontFamily: "'Archivo', sans-serif",
        color: "#ffffff",
        display: "flex",
        flexDirection: "row", // ✅ Sidebar على اليسار، content على اليمين
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 50% -10%, rgba(204,21,21,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37,63,246,0.05) 0%, transparent 50%)
        `,
      }}>
        <OnyxGlobalStyles />
        <TopLoadingBar />

        {/* ✅ Sidebar navigation (يحل محل الـ header العائم + BottomNav + الأزرار العائمة) */}
        <SidebarConnected
          items={[
            { key: "home",         label: "Home",         icon: <Home size={18} />,     onClick: () => handleAdminTabChange(TAB_HOME) },
            { key: "leads",        label: "Leads",        icon: <Users size={18} />,    onClick: () => handleAdminTabChange(TAB_LEADS) },
            { key: "add-project",  label: "Add Project",  icon: <FileText size={18} />, onClick: () => handleAdminTabChange(TAB_ADDPROJECT) },
            { key: "settings",     label: "Settings",     icon: <Settings size={18} />, onClick: () => handleAdminTabChange(TAB_SETTINGS) },
            // ✅ Role-based: Commissions متاح للجميع (لكل role شاشته)
            { key: "commissions",  label: "Commission",   icon: <DollarSign size={18} />, onClick: () => setShowCommissions(true) },
            // ✅ Role-based: Inventory (Developer Admin) فقط لـ accountType=developer
            ...(currentUser?.accountType === "developer" ? [{
              key: "inventory", label: "Inventory", icon: <Building2 size={18} />, onClick: () => setShowDeveloper("admin"),
            }] : []),
          ]}
          activeKey={
            showCommissions ? "commissions"
            : showDeveloper === "admin" ? "inventory"
            : activeAdminTab === TAB_HOME ? "home"
            : activeAdminTab === TAB_LEADS ? "leads"
            : activeAdminTab === TAB_ADDPROJECT ? "add-project"
            : activeAdminTab === TAB_SETTINGS ? "settings"
            : "home"
          }
          onItemClick={(item) => item.onClick && item.onClick()}
          currentUser={currentUser}
          onBellClick={() => setNotifOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
          avatarUrl={headerAvatarUrl}
          logo={<OnyxLogo size={28} />}
        />

        {/* Main content area */}
        <div style={{
          flex: 1,
          marginLeft: typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT ? SIDEBAR_WIDTH : 0,
          display: "flex",
          flexDirection: "column",
          // مساحة علوية في الموبايل للـ top bar
          marginTop: typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? 62 : 0,
          minHeight: "100dvh",
          transition: "margin-left 0.2s ease",
        }}>
          <div
            key={activeAdminTab}
            className="onyx-animate"
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}
          >
            {renderAdminPage()}
          </div>
        </div>

        <NotifConnectedPanels
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          profileOpen={profileOpen}
          onProfileClose={() => setProfileOpen(false)}
          onSignOut={handleSignOut}
          refreshAvatar={refreshAvatar}
        />

        {/* ✅ P0-6: Commissions Modal (admin) */}
        {showCommissions && (
          <CommissionsModal
            role="admin"
            currentUser={currentUser}
            onClose={() => setShowCommissions(false)}
          />
        )}

        {/* ✅ P0-7: Developer Admin Modal (admin only — developer account type) */}
        {showDeveloper === "admin" && (
          <DeveloperModal
            mode="admin"
            onClose={() => setShowDeveloper(null)}
          />
        )}
      </div>
      </NotificationProvider>
    );
  }

  // ── SALES ──────────────────────────────────────────────────────
  const renderSalesPage = () => {
    if (showAddProject) {
      return (
        <AddProjectPage
          onProjectSaved={handleProjectSaved}
          onTabChange={(tab) => { setShowAddProject(false); setActiveSalesTab(tab); }}
          onSignOut={handleSignOut}
          editProject={editProject}
          projects={projects}
          onDeleteProject={handleDeleteProject}
        />
      );
    }

    switch (activeSalesTab) {
      case TAB_HOME:
        return (
          <HomePage
            activeTab={activeSalesTab}
            onTabChange={setActiveSalesTab}
            onSignOut={handleSignOut}
            leads={leads}
            currentUser={currentUser}
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
        return (
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
    <NotificationProvider currentUser={currentUser}>
    <div style={{
      height: "100dvh",
      background: "#0a0a0a",
      fontFamily: "'Archivo', sans-serif",
      color: "#ffffff",
      display: "flex",
      flexDirection: "row", // ✅ Sidebar على اليسار، content على اليمين
      backgroundImage: `
        radial-gradient(ellipse 80% 40% at 50% -10%, rgba(204,21,21,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37,63,246,0.05) 0%, transparent 50%)
      `,
    }}>
      <OnyxGlobalStyles />
      <TopLoadingBar />

      {/* ✅ Sidebar navigation للمندوب (يحل محل الـ header + BottomNav + الأزرار العائمة) */}
      <SidebarConnected
        items={[
          { key: "home",         label: "Home",         icon: <Home size={18} />,     onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_HOME); } },
          { key: "leads",        label: "Leads",        icon: <Users size={18} />,    onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_LEADS); } },
          { key: "schedule",     label: "Schedule",     icon: <FileText size={18} />, onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_SCHEDULE); } },
          { key: "projects",     label: "Projects",     icon: <Building2 size={18} />, onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_PROJECTS); } },
          // ✅ Role-based: Commissions متاح للجميع
          { key: "commissions",  label: "Commission",   icon: <DollarSign size={18} />, onClick: () => setShowCommissions(true) },
          // ✅ Role-based: Inventory (Developer Units) فقط لـ accountType=developer
          ...(currentUser?.accountType === "developer" ? [{
            key: "inventory", label: "Inventory", icon: <Building2 size={18} />, onClick: () => setShowDeveloper("units"),
          }] : []),
        ]}
        activeKey={
          showCommissions ? "commissions"
          : showDeveloper === "units" ? "inventory"
          : showAddProject ? "projects"
          : activeSalesTab === TAB_HOME ? "home"
          : activeSalesTab === TAB_LEADS ? "leads"
          : activeSalesTab === TAB_SCHEDULE ? "schedule"
          : activeSalesTab === TAB_PROJECTS ? "projects"
          : "home"
        }
        onItemClick={(item) => item.onClick && item.onClick()}
        currentUser={currentUser}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
        avatarUrl={headerAvatarUrl}
        logo={<OnyxLogo size={28} />}
      />

      {/* Main content area */}
      <div style={{
        flex: 1,
        marginLeft: typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT ? SIDEBAR_WIDTH : 0,
        display: "flex",
        flexDirection: "column",
        marginTop: typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? 62 : 0,
        minHeight: "100dvh",
        transition: "margin-left 0.2s ease",
      }}>
        <div
          key={activeSalesTab}
          className="onyx-animate"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}
        >
          {renderSalesPage()}
        </div>
      </div>

      <NotifConnectedPanels
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        profileOpen={profileOpen}
        onProfileClose={() => setProfileOpen(false)}
        onSignOut={handleSignOut}
        refreshAvatar={refreshAvatar}
      />

      {/* ✅ P0-6: Commissions Modal (sales) */}
      {showCommissions && (
        <CommissionsModal
          role="sales"
          currentUser={currentUser}
          onClose={() => setShowCommissions(false)}
        />
      )}

      {/* ✅ P0-7: Developer Units Modal (sales with developer account type) */}
      {showDeveloper === "units" && (
        <DeveloperModal
          mode="units"
          currentUser={currentUser}
          onClose={() => setShowDeveloper(null)}
        />
      )}
    </div>
    </NotificationProvider>
  );
}

// ─── CommissionsModal (مكون مساعد لعرض شاشة العمولات في overlay) ───
function CommissionsModal({ role, currentUser, onClose }) {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
        zIndex: 500, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid #2a2a2e",
        background: "#0a0a0a",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          {role === "admin" ? "💰 Commissions Management" : "💰 My Commissions"}
        </div>
        <div
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#1a1a1a", border: "1px solid #2a2a2e",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#cecece", fontSize: 14,
          }}
        >
          ✕
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {role === "admin"
          ? <AdminCommissionsPage />
          : <SalesCommissionsPage currentUser={currentUser} />
        }
      </div>
    </div>
  );
}

// ─── DeveloperModal (مكون مساعد لعرض وحدة المطورين في overlay) ────
function DeveloperModal({ mode, currentUser, onClose }) {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
        zIndex: 500, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid #2a2a2e",
        background: "#0a0a0a",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          {mode === "admin" ? "🏢 Developer Admin" : "🏢 Available Units"}
        </div>
        <div
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#1a1a1a", border: "1px solid #2a2a2e",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#cecece", fontSize: 14,
          }}
        >
          ✕
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {mode === "admin"
          ? <DeveloperAdminPage />
          : <DeveloperUnitsPage currentUser={currentUser} />
        }
      </div>
    </div>
  );
}
