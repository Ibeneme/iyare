/**
 * Types that mirror the server's Mongoose models (yare-server v4) one-to-one.
 * Field names, enums and optionality follow src/models/* on the server.
 * ObjectIds arrive as strings; dates arrive as ISO strings.
 */

export type Id = string;
export type ISODate = string;
export interface SubscriptionPlanMeta {
  badge?: string | null;
  billingLabel?: string;
  perUnitLabel?: string;
  compareAtNGN?: number | null;
  savingsNGN?: number | null;
  features?: string[];
}
// ───────── Roles ─────────
/** The five roles. A Super Admin signs in as userType "admin" with role "superadmin". */
export type ServerRole = "superadmin" | "admin" | "teacher" | "student" | "parent";
/** What the JWT `userType` claim / the userType cookie holds. */
export type UserType = "admin" | "teacher" | "student" | "parent";
export type Currency = "NGN" | "USD";

// ───────── People ─────────
export interface Admin {
  _id: Id;
  email: string;
  firstName: string;
  lastName: string;
  role: "superadmin" | "admin";
  userType?: string;
  isSuspended: boolean;
  isDeleted?: boolean;
  createdAt?: ISODate;
}

export interface Teacher {
  _id: Id;
  email: string;
  firstName: string;
  lastName: string;
  userType: "teacher";
  classIds: Id[];
  subjectIds: Id[];
  gradeIds: Id[];
  certifications: string[];
  skills: string[];
  languages: string[];
  educationBackground?: string;
  isSuspended: boolean;
  inClass: boolean;
  reported: boolean;
}

export interface Parent {
  _id: Id;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: "parent";
  children: Id[];
  isSuspended: boolean;
  isVerified: boolean;
  reported: boolean;
}

/** A student; when a parent manages them the server calls them a "ward". */
export interface Student {
  _id: Id;
  email: string;
  firstName: string;
  lastName: string;
  userType: "student";
  parentId: Id | null;
  gradeId: Id | Pick<Grade, "_id" | "title"> | null;
  subjects: Array<Id | Pick<Subject, "_id" | "name" | "code">>;
  languages: string[];
  skills: string[];
  isSuspended: boolean;
  inClass: boolean;
  isPaid: boolean;
  isSubscribed: boolean;
  lessonFeeId: Id | null;
  // free trial + grace (see AccessState)
  trialEndsAt: ISODate | null;
  trialDays: number;
  subscriptionExpiredAt: ISODate | null;
  expiryGraceEndsAt: ISODate | null;
  adminGraceUntil: ISODate | null;
  adminGraceDuration: GraceDuration | null;
}
export type Ward = Student;

// ───────── Academic structure ─────────
export interface Grade {
  _id: Id;
  title: string;
  description?: string;
  studentIds: Id[];
  classIds: Id[];
  subjectIds: Id[];
  studentCount?: number;
  classCount?: number;
  subjectCount?: number;
}

export interface Subject {
  _id: Id;
  name: string;
  code?: string;
  description?: string;
  gradeLevel: Id[];
  isActive: boolean;
  children: Id[];
  teachers: Id[];
  classes: Id[];
}

export interface StudentGroup {
  _id: Id;
  name: string;
  gradeId?: Id;
  studentIds: Array<Id | Pick<Student, "_id" | "firstName" | "lastName">>;
}

// ───────── Pricing & payments ─────────
export type PriceKind = "grade" | "subject" | "perk" | "subscription" | "kind";

export interface Pricing {
  _id: Id;
  kind: PriceKind;
  refId?: Id;
  name: string;
  description?: string;
  prices: Record<Currency, number>;
  durationDays: number;
  isActive: boolean;
  meta: any,
  planKey: any
}

export type TransactionStatus = "pending" | "success" | "failed" | "abandoned";

export interface Transaction {
  _id: Id;
  reference: string;
  parentId: Id | Pick<Parent, "_id" | "firstName" | "lastName" | "email"> | null;
  payerEmail: string;
  studentIds: Array<Id | Pick<Student, "_id" | "firstName" | "lastName">>;
  planName?: string;
  durationDays?: number;
  items: Array<{ kind: PriceKind; refId?: Id; name: string; amount: number }>;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  channel?: string;
  paidAt?: ISODate;
  verifiedBy?: "webhook" | "callback";
  createdAt: ISODate;
}

export interface LessonFee {
  _id: Id;
  studentId: Id;
  payerId?: Id;
  planName?: string;
  duration: string;
  amount: number;
  currency: Currency;
  expired: boolean;
  expiresAt?: ISODate;
  reference?: string;
  paid: { isPaid: boolean; timestamp?: ISODate; paymentMethod?: string; paymentService?: string };
}

export interface CheckoutRequest {
  email: string;
  studentDetails: Array<{ _id: Id }>;
  currency: Currency;
  planName?: string;
  duration?: number;
}
export interface CheckoutResponse {
  checkout_url: string;
  reference: string;
  amount: number;
  currency: Currency;
  paymentIds: Id[];
}

// ───────── Access: trial, grace, view-only ─────────
export type GraceDuration = "3d" | "1w" | "4w" | "3m";
export type AccessReason = "paid" | "trial" | "trial_ended" | "admin_grace" | "expiry_grace" | "lapsed" | "not_subscribed";
export interface AccessState {
  mode: "full" | "read_only";
  reason: AccessReason;
  until?: ISODate;
  since?: ISODate;
}
/** What a student is allowed to see: never mentions fees. */
export interface StudentAccessView {
  mode: "full" | "read_only";
  readOnly: boolean;
  message: string | null;
}
export interface WardAccess {
  studentId: Id;
  name: string;
  access: AccessState;
  daysLeft: number | null;
  needsRenewal: boolean;
}

// ───────── Classes & classroom ─────────
export interface TimeWindow { startTime: string; endTime: string }
export type Frequency = "none" | "daily" | "weekly" | "monthly";
export interface Schedule {
  frequency: Frequency;
  timeSlots: TimeWindow[];
  daysOfWeek: Array<{ day: number; timeSlots: TimeWindow[] }>;
  daysOfMonth: Array<{ day: number; timeSlots: TimeWindow[] }>;
  specificDates: Array<{ date: ISODate; timeSlots: TimeWindow[] }>;
  startDate?: ISODate;
  endDate?: ISODate;
}
export type ClassAudience = "grade" | "groups" | "students";

export interface ClassSession {
  _id: Id;
  title: string;
  subjectId: Id | Pick<Subject, "_id" | "name">;
  gradeId?: Id;
  audience: ClassAudience;
  groupIds: Id[];
  studentIds: Id[];
  teacherId?: Id | Pick<Teacher, "_id" | "firstName" | "lastName" | "email">;
  schedules: Schedule[];
}

export type ClassroomRole = "admin" | "teacher" | "student" | "parent";
export interface ClassAccess {
  role: ClassroomRole;
  isHost: boolean;
  live: boolean;
  class: { _id: Id; title: string };
}
export interface ClassAssignment {
  _id: Id;
  classId: Id;
  teacherId: Id;
  title: string;
  instructions?: string;
  dueDate?: ISODate;
  postedDuringLive: boolean;
  createdAt: ISODate;
}
export interface ClassroomNote { content: string; version: number; lastEditedBy?: string }
export interface ChatMessage { text: string; sender?: string; senderId?: string; at?: number }

// ───────── Tasks ─────────
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export interface TaskActor { assignedTo?: any, id: Id | Pick<Teacher, "_id" | "firstName" | "lastName" | "email">; model: "Teacher" | "Admin" }
export interface Task {
  _id: Id;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: ISODate;
  labels: string[];
  assignedTo?: {
    id: any,
    type: any
  };
  createdBy: TaskActor;
  assignedByAdmin: boolean;
  completedAt?: ISODate | null;
  createdAt: ISODate;
}
export type TaskBoard = Record<TaskStatus, Task[]>;

// ───────── Platform ─────────
export type AnnouncementKind = "announcement" | "maintenance" | "banner";
export type Severity = "info" | "success" | "warning" | "critical";
export interface PlatformAnnouncement {
  _id: Id;
  kind: AnnouncementKind;
  title: string;
  body: string;
  severity: Severity;
  linkUrl?: string;
  linkLabel?: string;
  dismissible: boolean;
  audience: UserType[];
  startsAt: ISODate | null;
  endsAt: ISODate | null;
  isActive: boolean;
  pinned: boolean;
  blocking: boolean;
  status?: "live" | "scheduled" | "ended" | "off";
  createdAt: ISODate;
}
export interface PlatformSettings {
  trial: { enabled: boolean; days: number };
}

export interface AppNotification {
  _id: Id;
  title: string;
  description: string;
  type: string;
  read: boolean;
  createdAt: ISODate;
  meta?: Record<string, string>;
}

/** Shape of the server's error envelope. */
export interface ApiErrorBody { success?: false; message?: string; error?: string; maintenance?: boolean; readOnly?: boolean }

// ───────── Awards (admin-issued, with perks) ─────────
export type PerkKind = "none" | "free_month" | "discount" | "custom";
export interface AwardGrant {
  _id: Id;
  title: string;
  description: string;
  studentId: Id | Pick<Student, "_id" | "firstName" | "lastName" | "email">;
  perk: { kind: PerkKind; discountPercent?: number; note?: string; expiresAt: ISODate | null; redeemedAt: ISODate | null };
  createdAt: ISODate;
}

// ───────── Parent notification preferences ─────────
export interface NotificationPrefs {
  email: boolean;
  classReminders: boolean;
  feeNotices: boolean;
  awards: boolean;
  wards: Array<{ studentId: Id; name: string; classReminders: boolean; joinAlerts: boolean }>;
}
