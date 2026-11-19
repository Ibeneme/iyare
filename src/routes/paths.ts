/**
 * Single source of truth for every URL in the app.
 * Public pages live at the top level; everything behind login lives under /app.
 */
export const PATHS = {
  // ── Public ──
  home: "/",
  about: "/about",
  pricing: "/pricing",
  plans: "/plans",
  subjectsOverview: "/subjects",
  careers: "/careers",
  privacy: "/privacy",
  terms: "/terms",
  verifyPayment: "/verify-payment",

  // ── Auth ──
  signIn: "/sign-in",
  adminSignIn: "/admin-sign-in",
  register: "/register",
  forgotPassword: "/forgot-password",
  accountSetup: "/account-setup",

  // ── Signed-in app (/app/*) ──
  subjects: "/app/subjects",
  subjectDetails: "/app/subjects/:id",
  enrolledCourses: "/app/enrolled",
  classes: "/app/classes",
  classDetails: "/app/classes/:id",
  manageClasses: "/app/manage/classes/:filter?",
  liveClass: "/app/live/:classId/:classTitle/:subject",
  timetable: "/app/timetable",
  assignments: "/app/assignments",
  grades: "/app/grades",
  fees: "/app/fees",
  subscriptions: "/app/subscriptions/:studentId?",
  subscriptionHistory: "/app/subscriptions/history",
  paymentStatus: "/app/payment-status",
  notifications: "/app/notifications",
  awards: "/app/awards",
  reports: "/app/reports",
  users: "/app/users/:userType/:filter?",
  userDetails: "/app/user/:userType/:id",
  profile: "/app/profile",
  profileEdit: "/app/profile/edit",
  addStudent: "/app/students/new",
  guide: "/app/guide",
  settings: "/app/settings",
  // Server-backed pages
  tasks: "/app/tasks",
  taskTracker: "/app/tasks/tracker",
  wards: "/app/wards",
  personNew: "/app/people/:userType/new",
  personEdit: "/app/people/:userType/:id/edit",
  gradeNew: "/app/grades/new",
  gradeEdit: "/app/grades/:id/edit",
  classNew: "/app/manage/classes/new/class",
  classEdit: "/app/manage/classes/edit/:id",
  wardNew: "/app/wards/new",
  awardNew: "/app/awards/new",
  awardEdit: "/app/awards/:id/edit",
  notificationPrefs: "/app/notifications/preferences",
  account: "/app/account",
  transactions: "/app/transactions",
  pricingAdmin: "/app/admin/pricing",
  announcementsAdmin: "/app/admin/announcements",
  accessAdmin: "/app/admin/access",
  superAdmin: "/app/admin/super",
} as const;

/** Old URLs that still work (bookmarks, emails) and where they now go. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/auth-sign-in": PATHS.signIn,
  "/policy": PATHS.privacy,
  "/about-us": PATHS.about,
  "/pricing-page": PATHS.plans,
  "/verify-payments": PATHS.verifyPayment,
  "/user-setup": PATHS.accountSetup,
  "/subject-manager": PATHS.subjects,
  "/classes-manager": PATHS.classes,
  "/lesson-manager": "/app/fees",
  "/grade-manager": PATHS.grades,
  "/settings": PATHS.settings,
  "/enrolled-courses": PATHS.enrolledCourses,
  "/awards": PATHS.awards,
  "/reports": PATHS.reports,
  "/notifications": PATHS.notifications,
  "/assignments": PATHS.assignments,
  "/profiles": PATHS.profile,
  "/subscriptions-history": PATHS.subscriptionHistory,
  "/timetable": PATHS.timetable,
  "/guide-parents": PATHS.guide,
  "/user-updates": PATHS.profileEdit,
  "/add-student": PATHS.addStudent,
  "/payment-success": PATHS.paymentStatus,
  "/admin/dashboard/all": "/app/users/admin/all",
  "/student/dashboard/all": "/app/users/student/all",
  "/teacher/dashboard/all": "/app/users/teacher/all",
  "/parent/dashboard/all": "/app/users/parent/all",
};

/** Build a concrete URL, e.g. buildPath(PATHS.userDetails, { userType: "student", id }) */
export const buildPath = (pattern: string, params: Record<string, string | number | undefined> = {}) =>
  pattern
    .replace(/\/:(\w+)\?/g, (_, k) => (params[k] != null ? `/${params[k]}` : ""))
    .replace(/:(\w+)/g, (_, k) => String(params[k] ?? ""));
