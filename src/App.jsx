// ── App.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase }         from "./lib/supabase";
import Login                from "./Login";
import HomePage             from "./HomePage";
import LeadsPage            from "./LeadsPage";
// import TimelinePage         from "./TimelinePage";  // ✅ Removed: Schedule screen deleted
import ProjectsPage         from "./ProjectsPage";
import AdminHomePage        from "./AdminHomePage";
import AdminLeadsPage       from "./AdminLeadsPage";
import AdminSettings        from "./AdminSettings";
import AddProjectPage       from "./AddProjectPage";
import ResetPassword        from "./ResetPassword";
import SetPassword          from "./SetPassword";   // P0-4: Set Password flow (مطابق Flutter)
import AppHeader            from "./AppHeader";
import BottomNav            from "./BottomNav";
import NotificationPanel    from "./NotificationPanel";
import ProfileModal         from "./ProfileModal";
import { NotificationProvider, useNotifications } from "./NotificationContext";
import { isSetPasswordUrl, isResetPasswordUrl } from "./DeepLinkService";  // P0-4
import { notifyAdminsOnSalesPresence } from "./AdminPushHelpers";  // P0-5
import AdminCommissionsPage     from "./AdminCommissionsPage";   // P0-6
import SalesCommissionsPage     from "./SalesCommissionsPage";   // P0-6
import DeveloperUnitsPage       from "./DeveloperUnitsPage";     // P0-7
import DeveloperAdminPage       from "./DeveloperAdminPage";     // P0-7
import Sidebar, { SIDEBAR_WIDTH, MOBILE_BREAKPOINT } from "./components/Sidebar";  // Sidebar navigation
import { Home, Users, FileText, Settings, Building2, DollarSign } from "lucide-react";  // Sidebar icons
import { bg, text, border, primary, shadow, radius, CSS_VARS } from "./theme";  // Centralized theme

// ─── ONYX Design (Dark Theme — مطابقة الموك أب) ───────────────────
const OnyxGlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    :root {
      ${CSS_VARS}
    }
    body, html {
      background: var(--bg-base) !important;
      color: var(--text-primary) !important;
      font-family: var(--font-body) !important;
      color-scheme: dark !important;
      -webkit-font-smoothing: antialiased;
    }
    * { -webkit-user-select: none; user-select: none; }
    input, textarea, select { -webkit-user-select: text !important; user-select: text !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
    ::selection { background: var(--accent); color: #fff; }
    @keyframes onyx-fade-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .onyx-animate { animation: onyx-fade-up 0.35s ease both; }
  `}</style>
);

const OnyxLogo = ({ size = 32 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 9,
      background: "linear-gradient(135deg, #E23A4E, #8E1B2C)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16,
      color: "#fff", boxShadow: "0 4px 14px rgba(226,58,78,0.35)",
    }}>O</div>
    <span style={{
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18,
      color: "#F2F3F7", letterSpacing: 0.2,
    }}>ONY<span style={{ color: "#E23A4E" }}>X</span></span>
  </div>
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

// Sidebar wrapper يأخذ unreadCount من NotificationContext
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
const TAB_PROJECTS = 3;

const TAB_ADDPROJECT   = 2;
const TAB_SETTINGS     = 3;
// صفحات إضافية ضمن الـ layout (وليست modals منفصلة)
const TAB_COMMISSIONS  = 10;
const TAB_INVENTORY    = 11;

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
  // P0-4: Use DeepLinkService for set-password (invite) vs reset-password (recovery)
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
  // P0-6: Commissions modal state
  const [showCommissions, setShowCommissions] = useState(false);
  // P0-7: Developer module modal state
  const [showDeveloper, setShowDeveloper] = useState(null); // null | "units" | "admin"

  const [activeSalesTab, setActiveSalesTab] = useState(() => {
    const saved = parseInt(sessionStorage.getItem("salesTab") ?? "-1");
    return [TAB_HOME, TAB_LEADS, TAB_PROJECTS].includes(saved) ? saved : TAB_HOME;
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
      .select("id, full_name, email, role, active, account_type")  // full_name + active + account_type
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
      accountType: data?.account_type || "broker",  // P0-7 preparation
    });
    setLoggedIn(true);
    setTopLoading(false);
    setAuthLoading(false);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
    const { data: av } = await supabase.from("users").select("avatar_url").eq("id", userId).single();
    if (av?.avatar_url) setHeaderAvatarUrl(av.avatar_url);

    // P1-4: تحديث last_seen عند كل login (مطابقة Flutter)
    try {
      await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", userId);
    } catch (e) {
      console.warn("Failed to update last_seen:", e);
    }

    // P0-5: Notify admins on sales presence (مطابق Flutter MainShell.didChangeAppLifecycleState)
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

  // P0-5: App lifecycle observer — notify admins on sales resume (مطابق Flutter)
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
        locationLink: r.location_link || r.location_url || "",  // P2-3: دعم location_url (Flutter)
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
        // P2-3: حقول إضافية (مطابقة Flutter)
        consultant:         r.consultant || "",
        loadingPercentage:  r.loading_percentage || null,
        pricePerMeterFrom:  r.price_per_meter_from || null,
        pricePerMeterTo:    r.price_per_meter_to || null,
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
      // P2-3: حقول إضافية (مطابقة Flutter)
      consultant:           project.consultant || null,
      loading_percentage:   project.loadingPercentage || null,
      price_per_meter_from: project.pricePerMeterFrom || null,
      price_per_meter_to:   project.pricePerMeterTo || null,
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

  // P0-4: Set Password screen (invite flow) — مطابق SetPasswordScreen في Flutter
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
      zIndex: 9999, background: "#242938", overflow: "hidden",
    }}>
      <div style={{
        height: "100%", background: "#E23A4E",
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
      <div style={{ minHeight: "100vh", background: "#0B0D12" }} />
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
        // Commission و Inventory كصفحات عادية ضمن الـ layout (وليست modals)
        case TAB_COMMISSIONS:
          return <AdminCommissionsPage />;
        case TAB_INVENTORY:
          return <DeveloperAdminPage />;
        default:
          return null;
      }
    };

    return (
      <NotificationProvider currentUser={currentUser}>
      <div style={{
        height: "100dvh",
        background: "#0B0D12",
        fontFamily: "'Inter', sans-serif",
        color: "#F2F3F7",
        display: "flex",
        flexDirection: "row",
        backgroundImage: `
          radial-gradient(ellipse 80% 40% at 50% -10%, rgba(220, 38, 38, 0.04) 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37, 99, 235, 0.03) 0%, transparent 50%)
        `,
      }}>
        <OnyxGlobalStyles />
        <TopLoadingBar />

        {/* Sidebar navigation — كل الروابط (بما فيها Commission/Inventory) ضمن نفس الـ layout */}
        <SidebarConnected
          items={[
            { key: "home",         label: "Home",         icon: <Home size={18} />,        onClick: () => handleAdminTabChange(TAB_HOME) },
            { key: "leads",        label: "Leads",        icon: <Users size={18} />,       onClick: () => handleAdminTabChange(TAB_LEADS) },
            { key: "add-project",  label: "Add Project",  icon: <FileText size={18} />,    onClick: () => handleAdminTabChange(TAB_ADDPROJECT) },
            { key: "settings",     label: "Settings",     icon: <Settings size={18} />,    onClick: () => handleAdminTabChange(TAB_SETTINGS) },
            // Commission — صفحة عادية ضمن الـ layout
            { key: "commissions",  label: "Commission",   icon: <DollarSign size={18} />,  onClick: () => handleAdminTabChange(TAB_COMMISSIONS) },
            // Inventory — صفحة عادية ضمن الـ layout (فقط لـ accountType=developer)
            ...(currentUser?.accountType === "developer" ? [{
              key: "inventory", label: "Inventory", icon: <Building2 size={18} />, onClick: () => handleAdminTabChange(TAB_INVENTORY),
            }] : []),
          ]}
          activeKey={
            activeAdminTab === TAB_HOME ? "home"
            : activeAdminTab === TAB_LEADS ? "leads"
            : activeAdminTab === TAB_ADDPROJECT ? "add-project"
            : activeAdminTab === TAB_SETTINGS ? "settings"
            : activeAdminTab === TAB_COMMISSIONS ? "commissions"
            : activeAdminTab === TAB_INVENTORY ? "inventory"
            : "home"
          }
          onItemClick={(item) => item.onClick && item.onClick()}
          currentUser={currentUser}
          onBellClick={() => setNotifOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
          avatarUrl={headerAvatarUrl}
          logo={<OnyxLogo size={28} />}
        />

        {/* Main content area — Light theme: padding 24px + max-width 1200px + centered */}
        <div style={{
          flex: 1,
          marginLeft: typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT ? SIDEBAR_WIDTH : 0,
          display: "flex",
          flexDirection: "column",
          marginTop: typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? 62 : 0,
          minHeight: "100dvh",
          transition: "margin-left 0.2s ease",
          // Container padding
          padding: "32px 40px 60px",
          // max-width + centered على الشاشات العريضة
          overflowY: "auto",
        }}>
          <div
            key={activeAdminTab}
            className="onyx-animate"
            style={{
              width: "100%",
              maxWidth: 1180,
              margin: "0 auto",
              minHeight: "100%",
            }}
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
      // Commission و Inventory كصفحات عادية ضمن الـ layout
      case TAB_COMMISSIONS:
        return <SalesCommissionsPage currentUser={currentUser} />;
      case TAB_INVENTORY:
        return <DeveloperUnitsPage currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <NotificationProvider currentUser={currentUser}>
    <div style={{
      height: "100dvh",
      background: "#0B0D12",
      fontFamily: "'Inter', sans-serif",
      color: "#F2F3F7",
      display: "flex",
      flexDirection: "row",
      backgroundImage: `
        radial-gradient(ellipse 80% 40% at 50% -10%, rgba(220, 38, 38, 0.04) 0%, transparent 60%),
        radial-gradient(ellipse 60% 30% at 100% 80%, rgba(37, 99, 235, 0.03) 0%, transparent 50%)
      `,
    }}>
      <OnyxGlobalStyles />
      <TopLoadingBar />

      {/* Sidebar navigation للمندوب — كل الروابط ضمن نفس الـ layout */}
      <SidebarConnected
        items={[
          { key: "home",         label: "Home",         icon: <Home size={18} />,        onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_HOME); } },
          { key: "leads",        label: "Leads",        icon: <Users size={18} />,       onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_LEADS); } },
          { key: "projects",     label: "Projects",     icon: <Building2 size={18} />,   onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_PROJECTS); } },
          // Commission — صفحة عادية
          { key: "commissions",  label: "Commission",   icon: <DollarSign size={18} />,  onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_COMMISSIONS); } },
          // Inventory (Developer Units) — صفحة عادية (فقط لـ accountType=developer)
          ...(currentUser?.accountType === "developer" ? [{
            key: "inventory", label: "Inventory", icon: <Building2 size={18} />, onClick: () => { setShowAddProject(false); setActiveSalesTab(TAB_INVENTORY); },
          }] : []),
        ]}
        activeKey={
          showAddProject ? "projects"
          : activeSalesTab === TAB_HOME ? "home"
          : activeSalesTab === TAB_LEADS ? "leads"
          : activeSalesTab === TAB_PROJECTS ? "projects"
          : activeSalesTab === TAB_COMMISSIONS ? "commissions"
          : activeSalesTab === TAB_INVENTORY ? "inventory"
          : "home"
        }
        onItemClick={(item) => item.onClick && item.onClick()}
        currentUser={currentUser}
        onBellClick={() => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
        avatarUrl={headerAvatarUrl}
        logo={<OnyxLogo size={28} />}
      />

      {/* Main content area — Light theme: padding 24px + max-width 1200px + centered */}
      <div style={{
        flex: 1,
        marginLeft: typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT ? SIDEBAR_WIDTH : 0,
        display: "flex",
        flexDirection: "column",
        marginTop: typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? 62 : 0,
        minHeight: "100dvh",
        transition: "margin-left 0.2s ease",
        padding: "32px 40px 60px",
        overflowY: "auto",
      }}>
        <div
          key={activeSalesTab}
          className="onyx-animate"
          style={{
            width: "100%",
            maxWidth: 1180,
            margin: "0 auto",
            minHeight: "100%",
          }}
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
    </div>
    </NotificationProvider>
  );
}

// (CommissionsModal و DeveloperModal تم حذفهما — Commission و Inventory أصبحتا صفحات عادية ضمن الـ layout)
