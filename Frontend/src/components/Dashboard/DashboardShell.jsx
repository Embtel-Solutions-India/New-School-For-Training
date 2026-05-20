import { useState } from "react";
import {
  Avatar,
  Badge,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Command,
  LogOut,
  Menu as MenuIcon,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quickActions, roleMenus, roles } from "../../data/dashboardConfig";
import useAuthStore from "../../store/authStore";
import { formatRole, normalizeRole } from "../../utils/roles";

// Admin section components
import AdminOverview from "./AdminOverview";
import TeacherManagement from "./TeacherManagement";
import UserManagement from "./UserManagement";
import CourseApproval from "./CourseApproval";
import RevenueAnalytics from "./RevenueAnalytics";
import PlatformAnalytics from "./PlatformAnalytics";
import CouponManagement from "./CouponManagement";
import BroadcastNotifications from "./BroadcastNotifications";
import CMSManagement from "./CMSManagement";
import AuditLogs from "./AuditLogs";
import SiteSettings from "./SiteSettings";
import AdminBlogs from "./AdminBlogs";

// Teacher section components
import TeacherOverview from "./TeacherOverview";
import TeacherCourses from "./TeacherCourses";
import LessonsModules from "./LessonsModules";
import LiveClasses from "./LiveClasses";
import TeacherNotifications from "./TeacherNotifications";
import StudentProgressAnalytics from "./StudentProgressAnalytics";
import QuizzesExams from "./QuizzesExams";
import AttendanceTracking from "./AttendanceTracking";
import Assignments from "./Assignments";
import QuestionBank from "./QuestionBank";
import CourseReviews from "./CourseReviews";
import ContentAnalytics from "./ContentAnalytics";
import DiscussionModeration from "./DiscussionModeration";
import TeacherBlogs from "./TeacherBlogs";

// Student section components
import StudentOverview from "./StudentOverview";
import AllCourses from "./AllCourses";
import EnrolledCourses from "./EnrolledCourses";
import StudentLessons from "./StudentLessons";
import StudentCertificates from "./StudentCertificates";
import LearningProgress from "./LearningProgress";
import UpcomingLiveClasses from "./UpcomingLiveClasses";
import AssignmentSubmission from "./AssignmentSubmission";
import QuizHistory from "./QuizHistory";
import Leaderboard from "./Leaderboard";
import StudentNotifications from "./StudentNotifications";
import Bookmarks from "./Bookmarks";
import DownloadCenter from "./DownloadCenter";
import ProfileSettings from "./ProfileSettings";

const sectionTitles = {
  "s-overview": "Dashboard Overview",
  "s-all-courses": "All Courses",
  "s-enrolled": "Enrolled Courses",
  "s-lessons": "Lessons & Modules",
  "s-certificates": "Certificates",
  "s-progress": "Learning Progress",
  "s-live": "Live Classes",
  "s-assignments": "Assignments",
  "s-quizzes": "Quiz History",
  "s-leaderboard": "Leaderboard",
  "s-notifications": "Notifications",
  "s-bookmarks": "Bookmarks",
  "s-downloads": "Download Center",
  "s-profile": "Profile Settings",
  "t-overview": "Dashboard Overview",
  "t-courses": "Add Courses",
  "t-lessons": "Lessons & Modules",
  "t-live": "Live Classes",
  "t-notifications": "Notifications",
  "t-progress": "Student Progress",
  "t-quizzes": "Quizzes & Exams",
  "t-attendance": "Attendance Tracking",
  "t-assignments": "Assignments",
  "t-question-bank": "Question Bank",
  "t-reviews": "Course Reviews",
  "t-analytics": "Content Analytics",
  "t-discussions": "Discussion Moderation",
  "t-blogs": "Blog Management",
  overview: "Dashboard Overview",
  teachers: "Teacher Credentials",
  users: "User Management",
  "course-approval": "Course Approval",
  revenue: "Revenue Analytics",
  "platform-analytics": "Platform Analytics",
  coupons: "Coupon Management",
  notifications: "Broadcast Notifications",
  cms: "CMS Management",
  "audit-logs": "Audit Logs",
  settings: "Site Settings",
  blogs: "Blog Moderation",
};

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const AdminSectionRouter = ({ section }) => {
  const map = {
    overview: <AdminOverview />,
    teachers: <TeacherManagement />,
    users: <UserManagement />,
    "course-approval": <CourseApproval />,
    revenue: <RevenueAnalytics />,
    "platform-analytics": <PlatformAnalytics />,
    coupons: <CouponManagement />,
    notifications: <BroadcastNotifications />,
    cms: <CMSManagement />,
    "audit-logs": <AuditLogs />,
    settings: <SiteSettings />,
    blogs: <AdminBlogs />,
  };
  return map[section] || <AdminOverview />;
};

const StudentSectionRouter = ({ section }) => {
  const map = {
    "s-overview": <StudentOverview />,
    "s-all-courses": <AllCourses />,
    "s-enrolled": <EnrolledCourses />,
    "s-lessons": <StudentLessons />,
    "s-certificates": <StudentCertificates />,
    "s-progress": <LearningProgress />,
    "s-live": <UpcomingLiveClasses />,
    "s-assignments": <AssignmentSubmission />,
    "s-quizzes": <QuizHistory />,
    "s-leaderboard": <Leaderboard />,
    "s-notifications": <StudentNotifications />,
    "s-bookmarks": <Bookmarks />,
    "s-downloads": <DownloadCenter />,
    "s-profile": <ProfileSettings />,
  };
  return map[section] || <StudentOverview />;
};

const TeacherSectionRouter = ({ section }) => {
  const map = {
    "t-overview": <TeacherOverview />,
    "t-courses": <TeacherCourses />,
    "t-lessons": <LessonsModules />,
    "t-live": <LiveClasses />,
    "t-notifications": <TeacherNotifications />,
    "t-progress": <StudentProgressAnalytics />,
    "t-quizzes": <QuizzesExams />,
    "t-attendance": <AttendanceTracking />,
    "t-assignments": <Assignments />,
    "t-question-bank": <QuestionBank />,
    "t-reviews": <CourseReviews />,
    "t-analytics": <ContentAnalytics />,
    "t-discussions": <DiscussionModeration />,
    "t-blogs": <TeacherBlogs />,
  };
  return map[section] || <TeacherOverview />;
};

const DashboardShell = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = normalizeRole(user?.role);
  const config = roles[role] || roles.student;

  const [activeSection, setActiveSection] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [dark, setDark] = useState(true);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className="min-h-screen overflow-hidden bg-[#070b14] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,197,94,0.22),transparent_34%),radial-gradient(circle_at_86%_14%,rgba(249,115,22,0.2),transparent_30%),linear-gradient(145deg,#070b14_0%,#0e1728_46%,#101827_100%)]" />
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

        <DesktopSidebar
          role={role}
          collapsed={collapsed}
          activeSection={activeSection}
          expanded={expanded}
          onToggle={() => setCollapsed((v) => !v)}
          onExpand={setExpanded}
          onSelect={setActiveSection}
        />

        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { className: "!bg-[#080d18] !text-white !w-[300px]" } }}>
          <SidebarContent role={role} activeSection={activeSection} expanded={expanded} collapsed={false} mobile
            onExpand={setExpanded}
            onSelect={(s) => { setActiveSection(s); setMobileOpen(false); }} />
        </Drawer>

        <main className={`relative z-10 min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-[104px]" : "lg:pl-[292px]"}`}>
          <Topbar
            user={user} role={role} config={config} section={activeSection} dark={dark}
            onMobileOpen={() => setMobileOpen(true)} onThemeToggle={() => setDark((v) => !v)}
            onCommand={() => setCommandOpen(true)}
            profileAnchor={profileAnchor} notificationsAnchor={notificationsAnchor}
            setProfileAnchor={setProfileAnchor} setNotificationsAnchor={setNotificationsAnchor}
            onLogout={onLogout}
          />

          <AnimatePresence mode="wait">
            <motion.section
              key={`${role}-${activeSection}`}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[1800px] px-4 pb-28 pt-24 sm:px-6 lg:px-8"
            >
              {role === "admin" ? (
                <AdminSectionRouter section={activeSection} />
              ) : role === "teacher" ? (
                <TeacherSectionRouter section={activeSection} />
              ) : (
                <StudentSectionRouter section={activeSection} />
              )}
            </motion.section>
          </AnimatePresence>
        </main>

        <QuickActions />
        <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} role={role} onSelect={setActiveSection} />
      </div>
    </div>
  );
};

const DesktopSidebar = (props) => (
  <aside className={`fixed inset-y-0 left-0 z-30 hidden p-4 transition-all duration-300 lg:block ${props.collapsed ? "w-[104px]" : "w-[292px]"}`}>
    <div className={`h-full rounded-[28px] ${glass}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/images/sft_logo.png" alt="School For Training" className="h-12 w-47 rounded-2xl bg-white object-contain p-1" />
        </div>
        <Tooltip title={props.collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <IconButton onClick={props.onToggle} className="!text-white/70">
            {props.collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </IconButton>
        </Tooltip>
      </div>
      <SidebarContent {...props} />
    </div>
  </aside>
);

const SidebarContent = ({ role, activeSection, expanded, collapsed, mobile, onSelect, onExpand }) => {
  const config = roles[role] || roles.student;
  return (
    <div className="flex h-[calc(100%-80px)] flex-col px-3 pb-4">
      <div className={`mx-1 mb-4 rounded-2xl bg-gradient-to-br ${config.accent} p-[1px]`}>
        <div className="rounded-2xl bg-black/60 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-white/50">Workspace</p>
          {!collapsed && <p className="mt-1 font-semibold">{config.title}</p>}
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar">
        {(roleMenus[role] || roleMenus.student).map((item) => (
          <SidebarItem key={item.label} item={item} activeSection={activeSection} expanded={expanded}
            collapsed={collapsed && !mobile} onSelect={onSelect} onExpand={onExpand} />
        ))}
      </nav>
      {/* <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-200">
            <Command size={17} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">Command ready</p>
              <p className="text-xs text-white/45">Press Ctrl K to search</p>
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

const SidebarItem = ({ item, activeSection, expanded, collapsed, onSelect, onExpand }) => {
  const Icon = item.icon;
  const isActive = activeSection === item.section;
  const isOpen = expanded[item.label] || expanded[item.section];
  const hasChildren = item.children?.length;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) onExpand((s) => ({ ...s, [item.label]: !isOpen, [item.section]: !isOpen }));
          onSelect(item.section);
        }}
        className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
          isActive ? "bg-white text-[#0c1220] shadow-lg shadow-emerald-500/10" : "text-white/68 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        {isActive && <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-orange-400" />}
        <Icon size={19} className={isActive ? "text-emerald-700" : "text-white/60 group-hover:text-white"} />
        {!collapsed && <span className="flex-1 truncate font-medium">{item.label}</span>}
        {!collapsed && hasChildren && <ChevronDown size={15} className={`transition ${isOpen ? "rotate-180" : ""}`} />}
      </button>
      <AnimatePresence>
        {!collapsed && hasChildren && isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-6">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <button key={child.label} onClick={() => onSelect(child.section)}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-white/50 hover:bg-white/[0.06] hover:text-white">
                  <ChildIcon size={14} />{child.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Topbar = ({ user, role, config, section, dark, onMobileOpen, onThemeToggle, onCommand, profileAnchor, notificationsAnchor, setProfileAnchor, setNotificationsAnchor, onLogout }) => (
  <header className="fixed left-0 right-0 top-0 z-20 border-b border-white/10 bg-[#070b14]/72 backdrop-blur-2xl lg:left-auto">
    <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <IconButton onClick={onMobileOpen} className="!text-white lg:!hidden"><MenuIcon /></IconButton>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <span>{config.label}</span><ChevronRight size={13} /><span>{sectionTitles[section] || "Workspace"}</span>
        </div>
        <p className="truncate text-base font-semibold sm:text-lg">{sectionTitles[section] || config.title}</p>
      </div>
      <button onClick={onCommand} className="hidden min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm text-white/45 transition hover:bg-white/[0.1] md:flex">
        <Search size={17} />Search courses, users, reports...
        <span className="ml-auto rounded-lg border border-white/10 px-2 py-0.5 text-xs">Ctrl K</span>
      </button>
      <Tooltip title={dark ? "Light theme" : "Dark theme"}>
        <IconButton onClick={onThemeToggle} className="!text-white/70">{dark ? <Sun size={19} /> : <Moon size={19} />}</IconButton>
      </Tooltip>
      <IconButton onClick={(e) => setNotificationsAnchor(e.currentTarget)} className="!text-white/70">
        <Badge color="warning" variant="dot"><Bell size={19} /></Badge>
      </IconButton>
      <button onClick={(e) => setProfileAnchor(e.currentTarget)} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 pr-2 text-white">
        <Avatar src={user?.avatar} alt={user?.name} sx={{ width: 34, height: 34 }}>{user?.name?.[0] || "S"}</Avatar>
        <ChevronDown size={15} />
      </button>
      <Menu anchorEl={notificationsAnchor} open={Boolean(notificationsAnchor)} onClose={() => setNotificationsAnchor(null)}
        slotProps={{ paper: { className: "!mt-3 !rounded-3xl !bg-[#0b1220] !text-white !border !border-white/10 !w-80" } }}>
        <MenuItem disabled className="!text-white/40 !text-sm !py-4 !text-center">
          No new notifications
        </MenuItem>
      </Menu>
      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}
        slotProps={{ paper: { className: "!mt-3 !rounded-3xl !bg-[#0b1220] !text-white !border !border-white/10 !w-72" } }}>
        <MenuItem>
          <div><p className="font-semibold">{user?.name}</p><p className="text-xs capitalize text-white/45">{formatRole(role)}</p></div>
        </MenuItem>
        <Divider className="!border-white/10" />
        <MenuItem onClick={onLogout}><LogOut size={16} className="mr-2" /> Logout</MenuItem>
      </Menu>
    </div>
  </header>
);

const QuickActions = () => (
  <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2">
    {quickActions.map((action, i) => {
      const Icon = action.icon;
      return (
        <Tooltip title={action.label} placement="left" key={action.label}>
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white text-[#0b1120] shadow-2xl shadow-black/30">
            <Icon size={18} />
          </motion.button>
        </Tooltip>
      );
    })}
  </div>
);

const CommandPalette = ({ open, onClose, role, onSelect }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-start bg-black/60 px-4 pt-24 backdrop-blur-sm sm:place-items-center sm:pt-0">
        <motion.div initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}
          className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b1220] p-4 text-white shadow-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <Search size={18} />
            <input autoFocus placeholder="Search everywhere..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35" />
            <button onClick={onClose}><X size={18} /></button>
          </div>
          <div className="mt-4 space-y-2">
            {(roleMenus[role] || roleMenus.student).map((item) => (
              <button key={item.label} onClick={() => { onSelect(item.section); onClose(); }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
                <item.icon size={17} />{item.label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default DashboardShell;
