import { PATHS } from "../routes/paths";

export type Role = "admin" | "teacher" | "student" | "parent";
export const ROLES: Role[] = ["admin", "teacher", "student", "parent"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

/** Where each account type lands after signing in. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: PATHS.subjects,
  teacher: PATHS.subjects,
  student: PATHS.subjects,
  parent: PATHS.subjects,
};

/** Where each account type is sent after signing out (their own sign-in screen). */
export const signInPathFor = (role?: string | null): string => {
  if (role === "admin" || role === "teacher") return `${PATHS.adminSignIn}?type=${role}`;
  if (isRole(role)) return `${PATHS.signIn}?type=${role}`;
  return PATHS.signIn;
};

/**
 * What each account type can do. Components ask `can("manage_users")`
 * instead of comparing role strings.
 */
export type Permission =
  | "manage_users"        // list / edit admins, teachers, students, parents
  | "view_reports"
  | "manage_awards"
  | "manage_classes"      // create / edit / schedule classes
  | "manage_subjects"     // create / edit subjects
  | "view_grades"
  | "pay_fees"            // lesson fees, subscriptions, payment history
  | "add_students"        // parents add children
  | "view_child_profile"  // "My profile" with enrolled children / subjects
  | "teach_live";         // host a live class

export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["manage_users", "view_reports", "manage_awards", "manage_classes", "manage_subjects", "view_grades", "teach_live"],
  teacher: ["manage_awards", "manage_classes", "teach_live"],
  student: ["view_grades", "pay_fees", "view_child_profile"],
  parent: ["view_grades", "pay_fees", "add_students", "view_child_profile"],
};

export const can = (role: string | null | undefined, permission: Permission): boolean =>
  isRole(role) && PERMISSIONS[role].includes(permission);
