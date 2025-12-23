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

  // Safely read userType from localStorage
  const rawUserType =
    typeof window !== "undefined" ? localStorage.getItem("userType") : null;
  const userType = (rawUserType as UserType) || "student"; // fallback

  const config = guides[userType];
  if (!config) return null; // Safety

  const steps = config.steps;
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const current = steps[currentStep];

  const handleClose = () => {
    setTimeout(() => navigate("/subject-manager"), 400);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        {/* Main Modal Container: Removed borders and simplified shadow */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-lg md:max-w-3xl rounded-3xl bg-gray-900 shadow-2xl`}
          style={{
            // Internal, subtle glow for premium feel without hard borders
            boxShadow: `0 0 50px -10px ${config.accentHex}40, 0 20px 25px -5px rgba(0, 0, 0, 0.4)`,
          }}
        >
          {/* Accent Header Line (Instead of top border) */}
          <div
            className="h-1.5 w-full rounded-t-3xl"
            style={{ backgroundColor: config.accentHex }}
          />

          {/* Close Button - Now slightly lower due to accent line */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 z-10 rounded-full bg-white/10 p-2 text-gray-300 hover:bg-white/20 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-10">
            <motion.div
              key={currentStep}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className="flex items-start gap-6 mb-8">
                {/* Icon Container - Retained subtle accent background */}
                <div
                  className="p-4 rounded-xl flex-shrink-0"
                  style={{
                    backgroundColor: `${config.accentHex}1A`, // Light accent background
                  }}
                >
                  <current.icon
                    className={`w-8 h-8 md:w-10 md:h-10 ${config.accentClass}`}
                  />
                </div>
                <div>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-0.5">
                    {current.title}
                  </h2>
                  <div className="text-sm font-semibold text-gray-500 mt-1 capitalize">
                    Role: **{userType}**
                  </div>
                </div>
              </div>

              {/* Body Text */}
              <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
                {current.body}
              </p>
            </motion.div>

            {/* Progress Bar & Step Counter */}
            <div className="my-8 md:my-10">
              <div className="relative h-1.5 w-full bg-gray-700 rounded-full mb-3">
                <motion.div
                  className="absolute top-0 left-0 h-1.5 rounded-full"
                  style={{ backgroundColor: config.accentHex }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Step counter */}
              <div className="flex justify-between items-center text-sm text-gray-400 font-medium">
                <span>
                  Step **{currentStep + 1}** of **{totalSteps}**
                </span>
                <span className={config.accentClass}>{current.title}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={prev}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition disabled:text-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed`}
                style={
                  currentStep !== 0
                    ? {
                        color: config.accentHex,
                        backgroundColor: `${config.accentHex}1A`,
                      }
                    : {}
                }
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={next}
                className={`px-8 py-3 font-bold rounded-xl shadow-xl transition duration-200 ease-out transform hover:scale-[1.03] active:scale-95 ${config.buttonClass}`}
              >
                {isLastStep ? "Complete Tour & Get Started" : "Next Step"}
                {!isLastStep && (
                  <ChevronRight className="w-5 h-5 inline ml-2" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuideModal;
