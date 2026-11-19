import type { LucideIcon } from "lucide-react";
import {
  BookOpen, CalendarDays, Bell, CreditCard, ClipboardList, GraduationCap, Users, UserCog,
  UserRound, FileBarChart,Settings, Award, School, Baby, Star,
  KanbanSquare, Receipt, Tag, Megaphone, ShieldCheck, Crown, Users2,
} from "lucide-react";
import { PATHS } from "../routes/paths";
import type { Role } from "./roles";

export interface NavItem {
  title: string;
  icon: LucideIcon;
  path?: string;
  roles: Role[];
  /** Only the Super Admin sees this entry. */
  superOnly?: boolean;
  children?: NavItem[];
}

const ALL: Role[] = ["admin", "teacher", "student", "parent"];

/** The sidebar. Each entry lists who is allowed to see it. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Subjects",      icon: BookOpen,      path: PATHS.subjects,      roles: ALL },
  { title: "Classes",       icon: School,        path: PATHS.classes,       roles: ALL },
  { title: "Timetable",     icon: CalendarDays,  path: PATHS.timetable,     roles: ALL },
  { title: "Assignments",   icon: ClipboardList, path: PATHS.assignments,   roles: ALL },
  { title: "Grades",        icon: GraduationCap, path: PATHS.grades,        roles: ["admin", "student", "parent"] },
  { title: "Fees",          icon: CreditCard,    path: PATHS.fees,          roles: ["student", "parent"] },
  { title: "Awards",        icon: Award,         path: PATHS.awards,        roles: ["admin", "student", "parent"] },
  { title: "Notifications", icon: Bell,          path: PATHS.notifications, roles: ALL },
  { title: "My Profile",    icon: UserRound,     path: PATHS.profile,       roles: ["student", "parent"] },
  { title: "My Profile",    icon: UserRound,     path: PATHS.account,       roles: ["admin", "teacher"] },
  { title: "Alert settings",icon: Bell,          path: PATHS.notificationPrefs, roles: ["parent"] },
  {
    title: "People", icon: Users, roles: ["admin"],
    children: [
      { title: "Admins",   icon: UserCog,       path: "/app/users/admin/all",   roles: ["admin"] },
      { title: "Teachers", icon: Star,          path: "/app/users/teacher/all", roles: ["admin"] },
      { title: "Students", icon: GraduationCap, path: "/app/users/student/all", roles: ["admin"] },
      { title: "Parents",  icon: Baby,          path: "/app/users/parent/all",  roles: ["admin"] },
    ],
  },
 // { title: "Class overview", icon: LayoutGrid,   path: "/app/manage/classes/all", roles: ["admin"] },
  { title: "My tasks",      icon: KanbanSquare,  path: PATHS.tasks,         roles: ["teacher", "admin"] },
  { title: "My children",   icon: Users2,        path: PATHS.wards,         roles: ["parent"] },
  { title: "Payments",      icon: Receipt,       path: PATHS.transactions,  roles: ["parent", "admin"] },
  { title: "Reports",       icon: FileBarChart,  path: PATHS.reports,       roles: ["admin"] },
  {
    title: "Platform", icon: ShieldCheck, roles: ["admin"],
    children: [
      { title: "Task tracker",  icon: KanbanSquare, path: PATHS.taskTracker,         roles: ["admin"] },
      { title: "Pricing",       icon: Tag,          path: PATHS.pricingAdmin,        roles: ["admin"] },
      { title: "Access & trial",icon: ShieldCheck,  path: PATHS.accessAdmin,         roles: ["admin"] },
      { title: "Announcements", icon: Megaphone,    path: PATHS.announcementsAdmin,  roles: ["admin"] },
      { title: "Super Admin",   icon: Crown,        path: PATHS.superAdmin,          roles: ["admin"], superOnly: true },
    ],
  },
];

/** Footer links (shown under the main list). */
export const FOOTER_ITEMS: NavItem[] = [
 // { title: "Get help", icon: LifeBuoy, path: PATHS.guide,    roles: ["student", "parent"] },
  { title: "Settings", icon: Settings, path: PATHS.settings, roles: ALL },
];

export const navForRole = (
  role: string | null | undefined,
  items: NavItem[] = NAV_ITEMS,
  isSuperAdmin = false
): NavItem[] =>
  items
    .filter((i) => !!role && i.roles.includes(role as Role) && (!i.superOnly || isSuperAdmin))
    .map((i) => (i.children ? { ...i, children: navForRole(role, i.children, isSuperAdmin) } : i));
