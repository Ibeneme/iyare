import { getCookie, } from "../../../utils/cookies";
// GuideModal.tsx - Universal Multi-Role Onboarding Guide (No Borders)
import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Grid,
  CreditCard,
  Bell,
  User,
  Settings,
  Award,
  Users,
  BarChart3,
  UserCheck,
  Book,
  GraduationCap,
  BookMarkedIcon,
  Shield,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

type UserType = "student" | "parent" | "teacher" | "admin" | "superadmin";

interface GuideStep {
  title: string;
  body: string;
  icon: React.ElementType;
}

interface RoleStyle {
  accentHex: string;
  accentClass: string;
  buttonClass: string;
}

interface GuideConfig extends RoleStyle {
  steps: GuideStep[];
}

// === CENTRALIZED STYLES & ACCENTS ===
// Define the dynamic styles here to work better with Tailwind JIT compilation
const ROLE_STYLES: Record<UserType, RoleStyle> = {
  student: {
    accentHex: "#00A3AD", // Teal/Cyan
    accentClass: "text-[#00A3AD]",
    buttonClass: "bg-[#00A3AD] text-white hover:bg-cyan-600",
  },
  parent: {
    accentHex: "#00A3AD",
    accentClass: "text-[#00A3AD]",
    buttonClass: "bg-[#00A3AD] text-white hover:bg-cyan-600",
  },
  teacher: {
    accentHex: "#00A3AD",
    accentClass: "text-[#00A3AD]",
    buttonClass: "bg-[#00A3AD] text-white hover:bg-cyan-600",
  },
  admin: {
    accentHex: "#00A3AD",
    accentClass: "text-[#00A3AD]",
    buttonClass: "bg-[#00A3AD] text-white hover:bg-cyan-600",
  },
  superadmin: {
    accentHex: "#EC4899", // Pink (Distinct for top-tier role)
    accentClass: "text-[#EC4899]",
    buttonClass: "bg-[#EC4899] text-white hover:bg-pink-600",
  },
};

// === GUIDE CONTENT PER ROLE (simplified structure) ===

const studentSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Student!",
    body: "Your learning adventure begins now. Explore lessons, track your progress, and stay ahead with an all-in-one digital school experience designed just for you.",
    icon: Star,
  },
  {
    title: "My Subjects",
    body: "Access all your enrolled subjects, explore lessons, and quickly jump into topics you're currently studying.",
    icon: BookOpen,
  },
  {
    title: "My Classes",
    body: "Join live classes, meet your teachers, and interact in real time — all with a single tap.",
    icon: Grid,
  },
  {
    title: "Timetable",
    body: "See your weekly schedule at a glance so you're always prepared and never miss a class again.",
    icon: Calendar,
  },
  {
    title: "Assignments",
    body: "Submit homework easily, check deadlines, and monitor your completion progress.",
    icon: Award,
  },
  {
    title: "Updates",
    body: "Stay informed with teacher messages, reminders, announcements, and class alerts.",
    icon: Bell,
  },
  {
    title: "Progress",
    body: "Track your academic growth, view achievements, and stay motivated with performance insights.",
    icon: BarChart3,
  },
  {
    title: "Settings",
    body: "Update your profile and customize notifications to suit your study style.",
    icon: Settings,
  },
];

const parentSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Parent!",
    body: "Stay connected to your child's academic life with real-time updates, monitoring tools, and complete visibility of their learning journey.",
    icon: User,
  },
  {
    title: "Subjects",
    body: "View all subjects your children are registered for and see how they’re performing.",
    icon: BookOpen,
  },
  {
    title: "Classes",
    body: "Monitor class activities, teachers, schedules, and attendance throughout the week.",
    icon: Grid,
  },
  {
    title: "Timetable",
    body: "View a combined schedule for all your children, helping you keep everything organized.",
    icon: Calendar,
  },
  {
    title: "Lesson Fees",
    body: "Easily track lesson payments, upcoming fees, and complete transaction history.",
    icon: CreditCard,
  },
  {
    title: "Updates",
    body: "Receive notifications about homework, announcements, and teacher messages instantly.",
    icon: Bell,
  },
  {
    title: "Enrolled",
    body: "Manage enrollments, renew lessons, and access payment options anytime.",
    icon: Users,
  },
  {
    title: "Settings",
    body: "Adjust app preferences, linked children, and notification settings.",
    icon: Settings,
  },
];

const teacherSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Teacher!",
    body: "Manage your classes, students, teaching materials, and schedule with simplicity and efficiency.",
    icon: Book,
  },
  {
    title: "My Classes",
    body: "View all your active classes, manage attendance, and oversee student engagement.",
    icon: Users,
  },
  {
    title: "Create Lesson",
    body: "Build engaging lessons, upload notes, assign work, and share resources with your students.",
    icon: BookOpen,
  },
  {
    title: "Timetable",
    body: "Access your complete weekly teaching schedule in one organized view.",
    icon: Calendar,
  },
  {
    title: "Students",
    body: "Monitor student participation, track performance, and provide academic guidance.",
    icon: UserCheck,
  },
  {
    title: "Announcements",
    body: "Send important updates and reminders directly to your students and parents.",
    icon: Bell,
  },
  {
    title: "Earnings",
    body: "Track completed sessions, payments, and upcoming payouts.",
    icon: CreditCard,
  },
  {
    title: "Settings",
    body: "Update your profile, subjects, and availability preferences.",
    icon: Settings,
  },
];

const adminSuperadminSteps: GuideStep[] = [
  {
    title: "Welcome Back, Admin!",
    body: "Welcome to the Yare platform! As an admin, you have full control over every aspect of the system — from managing students and teachers to overseeing classes, subjects, and payments. This guide will walk you through each section so you can make the most of the tools at your disposal.",
    icon: Shield,
  },
  {
    title: "Subjects",
    body: "Create and organize all subjects offered in the school. Assign unique codes, write detailed descriptions, link them to appropriate grades and classes, and ensure each subject is taught by qualified teachers. Keep the curriculum structured and up-to-date for all academic programs.",
    icon: BookOpen,
  },
  {
    title: "Classes",
    body: "Manage all classes within the school efficiently. View enrolled students, assign and manage teachers, monitor attendance, track class performance, and make adjustments to class schedules as needed. Ensure students and teachers have a smooth, organized learning experience.",
    icon: Grid,
  },
  {
    title: "Timetable",
    body: "Design and publish weekly timetables for each class, preventing scheduling conflicts and ensuring optimal utilization of teachers and classrooms. Adjust schedules dynamically, accommodate special events, and maintain clarity for students, teachers, and staff.",
    icon: Calendar,
  },
  {
    title: "Lesson Fees",
    body: "Track student payments, manage subscriptions, process renewals, and view detailed payment histories. Set up multiple fee structures, monitor unpaid fees, and generate financial reports to maintain a transparent and well-organized billing system.",
    icon: CreditCard,
  },
  {
    title: "Admins",
    body: "Add and manage admin accounts with precision. Assign roles, define permissions, suspend or reactivate accounts, and ensure only authorized personnel have access to sensitive information. Maintain a secure and well-controlled administrative environment.",
    icon: Shield,
  },
  {
    title: "Students",
    body: "View and manage every student’s profile, including enrollment status, assigned subjects, grades, behavior records, and lesson access. Monitor subscription and payment status, ensure proper class placement, and address student-related concerns effectively.",
    icon: GraduationCap,
  },
  {
    title: "Parents",
    body: "Monitor parent accounts, view linked children, track payments, and manage communication preferences. Ensure parents stay informed about their children’s progress, fees, and school notifications, enhancing parent-school collaboration.",
    icon: Users,
  },
  {
    title: "Teachers",
    body: "Onboard and manage teachers effectively. Assign classes and subjects, review their schedules, track performance, and manage compensation. Ensure teachers are supported with the right resources and can deliver high-quality lessons consistently.",
    icon: BookOpen,
  },
  {
    title: "Awards",
    body: "Recognize excellence across students and staff. Give badges, certificates, and awards for outstanding achievements, academic performance, and special contributions. Foster motivation and encourage a culture of excellence throughout the school.",
    icon: Award,
  },
  {
    title: "Reports",
    body: "Generate insightful reports on attendance, revenue, student performance, and overall platform usage. Use these analytics to make informed decisions, identify trends, and continuously improve school management and operations.",
    icon: BarChart3,
  },
  {
    title: "Settings",
    body: "Configure school-wide settings, including fee structures, notifications, grading systems, session dates, and security rules. Maintain flexibility and control over the platform’s core configurations to ensure smooth operation and compliance.",
    icon: Settings,
  },
  {
    title: "Guide",
    body: "You’ve completed the admin tour! Return anytime to refresh your knowledge or train new admins. This guide ensures every feature and tool is fully understood and used effectively for optimal school management.",
    icon: BookMarkedIcon,
  },
];

// === CONFIG BY ROLE ===
const guides: Record<UserType, GuideConfig> = {
  student: {
    steps: studentSteps,
    ...ROLE_STYLES.student,
  },
  parent: {
    steps: parentSteps,
    ...ROLE_STYLES.parent,
  },
  teacher: {
    steps: teacherSteps,
    ...ROLE_STYLES.teacher,
  },
  admin: {
    steps: adminSuperadminSteps,
    ...ROLE_STYLES.admin,
  },
  superadmin: {
    steps: adminSuperadminSteps,
    ...ROLE_STYLES.superadmin,
  },
};

// === MAIN COMPONENT ===
const GuideModal: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Safely read userType from cookies
  const rawUserType =
    typeof window !== "undefined" ? getCookie("userType") : null;
  const userType = (rawUserType as UserType) || "student"; // fallback

  const config = guides[userType];
  if (!config) return null; // Safety

  const steps = config.steps;
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const current = steps[currentStep];

  const handleClose = () => {
    setTimeout(() => navigate("/app/subjects"), 400);
  };

  const next = () => {
    if (isLastStep) handleClose();
    else setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const prev = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // Reset on mount
  useEffect(() => {
    setCurrentStep(0);
  }, [userType]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${userType} guide`}
          className="card-elevated relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem]"
        >
          {/* Top bar */}
          <div className="flex justify-between items-center p-5 sm:p-8 pb-0">
            <span className="badge-gray capitalize">
              {userType} guide · {currentStep + 1}/{totalSteps}
            </span>
            <button onClick={handleClose} className="btn-icon" aria-label="Close guide">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 sm:p-12 pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-4 flex justify-start">
                  <div className="w-28 h-28 md:w-40 md:h-40 bg-surface rounded-[2rem] grid place-items-center">
                    <current.icon size={52} className="text-primary" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="md:col-span-8 text-left">
                  <h2 className="text-3xl md:text-4xl font-semibold text-primary tracking-tight leading-tight mb-4">
                    {current.title}
                  </h2>
                  <p className="text-base text-muted leading-relaxed max-w-md">{current.body}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-6 divider">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === currentStep ? "28px" : "8px",
                      backgroundColor: i === currentStep ? "var(--color-primary)" : "var(--color-card-border)",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {currentStep > 0 && (
                  <button onClick={prev} className="btn-icon w-11 h-11" aria-label="Previous step">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button onClick={next} className="btn-primary flex-1 md:flex-none">
                  {isLastStep ? "Finish tour" : "Continue"}
                  {!isLastStep && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuideModal;
