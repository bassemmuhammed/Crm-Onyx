// ── USAGE EXAMPLE ─────────────────────────────────────────
// مثال عملي لاستخدام الكومبوننتات المشتركة في أي صفحة
//
// الملفات اللي هتحتاجها في كل صفحة:
//   Icons.jsx             ← الأيكونات المشتركة
//   AppHeader.jsx         ← الهيدر العلوي
//   BottomNav.jsx         ← الناف السفلي (bubble style)
//   NotificationPanel.jsx ← لوحة الإشعارات
//   ProfileModal.jsx      ← الملف الشخصي

import { useState } from "react";
import AppHeader         from "./AppHeader";
import BottomNav         from "./BottomNav";
import NotificationPanel from "./NotificationPanel";
import ProfileModal      from "./ProfileModal";

// ── بيانات الإشعارات (اعملها في ملف منفصل أو fetch من API)
const INITIAL_NOTIFS = [
  { id:1, text:"New lead assigned: Mohamed Abdullah",   time:"2 min ago",  color:"#4f46e5", unread:true  },
  { id:2, text:"Sara Hassan replied to your proposal",  time:"18 min ago", color:"#10b981", unread:true  },
  { id:3, text:"Meeting reminder: Site visit at 10 AM", time:"1 hr ago",   color:"#f59e0b", unread:true  },
  { id:4, text:"Deal closed with Khaled Ibrahim 🎉",    time:"Yesterday",  color:"#ef4444", unread:false },
];

export default function AnyPage({ activeTab = 0, onTabChange }) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(INITIAL_NOTIFS);

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread:false })));

  return (
    <div style={{ fontFamily:"Inter,sans-serif", background:"#f5f7ff", minHeight:"100vh" }}>

      {/* ① الهيدر ─────────────────────────────────── */}
      <AppHeader
        unreadCount={unreadCount}
        onBellClick={()    => setNotifOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* ② لوحة الإشعارات ──────────────────────────── */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onMarkAll={markAllRead}
      />

      {/* ③ الملف الشخصي ────────────────────────────── */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* ④ محتوى الصفحة ────────────────────────────── */}
      <div style={{ padding:"20px 16px 110px" }}>
        {/* ... محتوى الصفحة هنا ... */}
      </div>

      {/* ⑤ الناف السفلي ────────────────────────────── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        // items={[...]} // اختياري لو حابب تغير عناصر الناف
      />

    </div>
  );
}
