// src/constants/guide-steps.ts
import {
    Award,
    BookOpen,
    Grid,
    Calendar,
    CreditCard,
    Bell,
    Users,
    GraduationCap,
    Shield,
    Crown,
    Settings,
    type LucideIcon,
} from "lucide-react";

export type Role = "parent" | "student" | "teacher" | "admin" | "superadmin";

export interface GuideStep {
    title: string;
    body: Record<Role, string>;
    icon: LucideIcon;
    color: string;
    roles: Role[];
}

export const ALL_GUIDE_STEPS: GuideStep[] = [
    {
        title: "Welcome to Yare!",
        body: {
            parent: "Hello, Parent! Yare is your all-in-one window into your child’s academic world. Track progress, stay updated with teachers, manage fees, and celebrate every milestone — all in one secure place.",
            student: "Hey there, superstar! Welcome to Yare — your personal learning hub! Access lessons, submit assignments, chat with teachers, and watch your progress skyrocket. Let’s make learning fun!",
            teacher: "Welcome, Teacher! Yare empowers you to manage classes effortlessly, share resources, track attendance, send announcements, and focus on what matters most — inspiring your students.",
            admin: "Greetings, Admin! Take full control of the platform: manage users, monitor finances, oversee classes, and ensure everything runs smoothly across the entire institution.",
            superadmin: "All hail, Superadmin! You now hold the master keys. Fine-tune system settings, access advanced analytics, override permissions, and shape Yare exactly how your organization needs it.",
        },
        icon: Award,
        color: "text-yellow-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
    {
        title: "Subjects",
        body: {
            parent: "See every subject your child is studying, view syllabi, check enrolled teachers, and monitor overall curriculum coverage at a glance.",
            student: "All your subjects in one place! Click any subject to access lessons, materials, quizzes, and track how far you’ve progressed.",
            teacher: "Manage the subjects you teach: upload lesson plans, share resources, set assignments, and view student performance analytics.",
            admin: "Create, edit, and assign subjects across the platform. Control which subjects are active and who teaches them.",
            superadmin: "Full control over subject catalog: create new subjects, define grading rules, set prerequisites, and manage curriculum standards platform-wide.",
        },
        icon: BookOpen,
        color: "text-emerald-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
    {
        title: "Classes",
        body: {
            parent: "View all active classes your children are enrolled in — complete with teacher names, class strength, schedules, and direct links to join live sessions.",
            student: "Your classroom dashboard! See upcoming classes, join with one tap, review past recordings, and catch up on anything you missed.",
            teacher: "Create and organize your classes, take attendance with a single click, share screens, conduct polls, and keep everyone engaged.",
            admin: "Monitor every class across the institution: view attendance trends, teacher performance, and ensure proper scheduling.",
            superadmin: "Global class oversight with advanced filters, bulk actions, conflict detection, and detailed analytics on class utilization.",
        },
        icon: Grid,
        color: "text-cyan-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
    {
        title: "Timetable",
        body: {
            parent: "Never miss a class! Get a clear weekly/daily view of all your children’s schedules — color-coded and synced across devices.",
            student: "Plan your week like a pro. See exactly when each class happens, set reminders, and balance studies with everything else you love.",
            teacher: "Your personal teaching timetable — always up-to-date. Prepare in advance and avoid double-bookings.",
            admin: "Build and adjust timetables for the entire school. Drag-and-drop scheduling with automatic conflict alerts.",
            superadmin: "Advanced timetable engine: optimize room usage, handle substitutions, generate PDF exports, and integrate with external calendars.",
        },
        icon: Calendar,
        color: "text-green-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
    {
        title: "Lesson Fees",
        body: {
            parent: "Stay on top of finances: view invoices, payment history, upcoming dues, and download receipts — everything transparent and organized.",
            student: "Not applicable for students.",
            teacher: "Not applicable for teachers.",
            admin: "Full financial oversight: track payments, issue refunds, generate reports, and reconcile accounts across all families.",
            superadmin: "Define fee structures, set late fees, configure payment gateways, export financial data, and run custom reports anytime.",
        },
        icon: CreditCard,
        color: "text-orange-400",
        roles: ["parent", "admin", "superadmin"],
    },
    {
        title: "Updates",
        body: {
            parent: "Your family’s newsfeed! Instantly see new assignments, teacher notes, event reminders, progress reports, and celebrate achievements as they happen.",
            student: "Never miss a deadline again! Get notified about new homework, quizzes, announcements, and shout-outs from your teachers.",
            teacher: "Broadcast announcements, share files, post assignments, and send praise — reach every student (and their parents) instantly.",
            admin: "Moderate and archive all updates. Ensure communication stays appropriate and on-brand.",
            superadmin: "Full audit trail of every announcement, plus templates, scheduled posts, and emergency broadcast capabilities.",
        },
        icon: Bell,
        color: "text-rose-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
    {
        title: "Students",
        body: {
            parent: "Manage your children’s profiles, update contact info, view detailed progress reports, and communicate directly with their teachers.",
            student: "Not applicable for students.",
            teacher: "Your student roster at your fingertips: track individual progress, leave private notes, and message parents when needed.",
            admin: "Central student database: handle admissions, transfers, graduations, and generate official documents.",
            superadmin: "Ultimate student data control: bulk import/export, custom fields, access policies, and integration with external systems.",
        },
        icon: Users,
        color: "text-purple-400",
        roles: ["parent", "teacher", "admin", "superadmin"],
    },
    {
        title: "Enrolled",
        body: {
            parent: "Easily enroll your child in new subjects or packages, choose payment plans, and keep their learning journey uninterrupted.",
            student: "Not applicable for students.",
            teacher: "Not applicable for teachers.",
            admin: "Process enrollments, approve waiting lists, assign students to classes, and manage capacity.",
            superadmin: "Oversee enrollment trends with powerful analytics: conversion rates, popular packages, revenue forecasts, and more.",
        },
        icon: GraduationCap,
        color: "text-indigo-400",
        roles: ["parent", "admin", "superadmin"],
    },
    {
        title: "Admin Tools",
        body: {
            parent: "Not applicable for parents.",
            student: "Not applicable for students.",
            teacher: "Not applicable for teachers.",
            admin: "Your command center: manage users, configure permissions, adjust platform settings, and run day-to-day operations smoothly.",
            superadmin: "Enhanced toolkit with user impersonation, database backups, feature flags, and emergency maintenance controls.",
        },
        icon: Shield,
        color: "text-amber-500",
        roles: ["admin", "superadmin"],
    },
    {
        title: "Superadmin Panel",
        body: {
            parent: "Not applicable for parents.",
            student: "Not applicable for students.",
            teacher: "Not applicable for teachers.",
            admin: "Not applicable for regular admins.",
            superadmin: "The ultimate control room: real-time analytics dashboard, system health monitors, audit logs, custom branding, API access, and full override capabilities.",
        },
        icon: Crown,
        color: "text-pink-500",
        roles: ["superadmin"],
    },
    {
        title: "Settings",
        body: {
            parent: "Personalize notifications, switch themes, manage connected devices, and update your family’s contact preferences.",
            student: "Update your profile picture, change password, tweak notification sounds, and make Yare truly yours.",
            teacher: "Set availability hours, default 2FA, email signatures, and default class settings.",
            admin: "Configure institution-wide settings: logo, academic year, grading system, email templates, and user permission roles.",
            superadmin: "Deep system configuration: database settings, cache management, third-party integrations, custom domains, and advanced security policies.",
        },
        icon: Settings,
        color: "text-gray-400",
        roles: ["parent", "student", "teacher", "admin", "superadmin"],
    },
];