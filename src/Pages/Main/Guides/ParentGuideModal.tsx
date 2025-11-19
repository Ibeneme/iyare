// GuideModal.tsx - Universal Multi-Role Onboarding Guide
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
  Chalkboard,
  Star,
  Shield,
  BarChart3,
  Globe,
  UserCheck,
  FileText,
  Book,
  GraduationCap,
  BookMarkedIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

type UserType = "student" | "parent" | "teacher" | "admin" | "superadmin";

interface GuideStep {
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
}

interface GuideConfig {
  steps: GuideStep[];
  accent: string;
  border: string;
  button: string;
}

// === GUIDE CONTENT PER ROLE ===

const studentSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Student!",
    body: "Your learning adventure begins now. Explore lessons, track your progress, and stay ahead with an all-in-one digital school experience designed just for you.",
    icon: Star,
    color: "text-yellow-400",
  },
  {
    title: "My Subjects",
    body: "Access all your enrolled subjects, explore lessons, and quickly jump into topics you're currently studying.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "My Classes",
    body: "Join live classes, meet your teachers, and interact in real time — all with a single tap.",
    icon: Grid,
    color: "text-yellow-400",
  },
  {
    title: "Timetable",
    body: "See your weekly schedule at a glance so you're always prepared and never miss a class again.",
    icon: Calendar,
    color: "text-yellow-400",
  },
  {
    title: "Assignments",
    body: "Submit homework easily, check deadlines, and monitor your completion progress.",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Updates",
    body: "Stay informed with teacher messages, reminders, announcements, and class alerts.",
    icon: Bell,
    color: "text-yellow-400",
  },
  {
    title: "Progress",
    body: "Track your academic growth, view achievements, and stay motivated with performance insights.",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Settings",
    body: "Update your profile and customize notifications to suit your study style.",
    icon: Settings,
    color: "text-yellow-400",
  },
];

const parentSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Parent!",
    body: "Stay connected to your child's academic life with real-time updates, monitoring tools, and complete visibility of their learning journey.",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Subjects",
    body: "View all subjects your children are registered for and see how they’re performing.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Classes",
    body: "Monitor class activities, teachers, schedules, and attendance throughout the week.",
    icon: Grid,
    color: "text-yellow-400",
  },
  {
    title: "Timetable",
    body: "View a combined schedule for all your children, helping you keep everything organized.",
    icon: Calendar,
    color: "text-yellow-400",
  },
  {
    title: "Lesson Fees",
    body: "Easily track lesson payments, upcoming fees, and complete transaction history.",
    icon: CreditCard,
    color: "text-yellow-400",
  },
  {
    title: "Updates",
    body: "Receive notifications about homework, announcements, and teacher messages instantly.",
    icon: Bell,
    color: "text-yellow-400",
  },
  {
    title: "Enrolled",
    body: "Manage enrollments, renew lessons, and access payment options anytime.",
    icon: User,
    color: "text-yellow-400",
  },
  {
    title: "Settings",
    body: "Adjust app preferences, linked children, and notification settings.",
    icon: Settings,
    color: "text-yellow-400",
  },
];

const teacherSteps: GuideStep[] = [
  {
    title: "Welcome to Yare, Teacher!",
    body: "Manage your classes, students, teaching materials, and schedule with simplicity and efficiency.",
    icon: Book,
    color: "text-yellow-400",
  },
  {
    title: "My Classes",
    body: "View all your active classes, manage attendance, and oversee student engagement.",
    icon: Users,
    color: "text-yellow-400",
  },
  {
    title: "Create Lesson",
    body: "Build engaging lessons, upload notes, assign work, and share resources with your students.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Timetable",
    body: "Access your complete weekly teaching schedule in one organized view.",
    icon: Calendar,
    color: "text-yellow-400",
  },
  {
    title: "Students",
    body: "Monitor student participation, track performance, and provide academic guidance.",
    icon: UserCheck,
    color: "text-yellow-400",
  },
  {
    title: "Announcements",
    body: "Send important updates and reminders directly to your students and parents.",
    icon: Bell,
    color: "text-yellow-400",
  },
  {
    title: "Earnings",
    body: "Track completed sessions, payments, and upcoming payouts.",
    icon: CreditCard,
    color: "text-yellow-400",
  },
  {
    title: "Settings",
    body: "Update your profile, subjects, and availability preferences.",
    icon: Settings,
    color: "text-yellow-400",
  },
];

const adminSteps: GuideStep[] = [
  {
    title: "Welcome Back, Admin!",
    body: "Welcome to the Yare platform! As an admin, you have full control over every aspect of the system — from managing students and teachers to overseeing classes, subjects, and payments. This guide will walk you through each section so you can make the most of the tools at your disposal.",
    icon: Shield,
    color: "text-yellow-400",
  },
  {
    title: "Subjects",
    body: "Create and organize all subjects offered in the school. Assign unique codes, write detailed descriptions, link them to appropriate grades and classes, and ensure each subject is taught by qualified teachers. Keep the curriculum structured and up-to-date for all academic programs.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Classes",
    body: "Manage all classes within the school efficiently. View enrolled students, assign and manage teachers, monitor attendance, track class performance, and make adjustments to class schedules as needed. Ensure students and teachers have a smooth, organized learning experience.",
    icon: Grid,
    color: "text-yellow-400",
  },
  {
    title: "Timetable",
    body: "Design and publish weekly timetables for each class, preventing scheduling conflicts and ensuring optimal utilization of teachers and classrooms. Adjust schedules dynamically, accommodate special events, and maintain clarity for students, teachers, and staff.",
    icon: Calendar,
    color: "text-yellow-400",
  },
  {
    title: "Lesson Fees",
    body: "Track student payments, manage subscriptions, process renewals, and view detailed payment histories. Set up multiple fee structures, monitor unpaid fees, and generate financial reports to maintain a transparent and well-organized billing system.",
    icon: CreditCard,
    color: "text-yellow-400",
  },
  {
    title: "Admins",
    body: "Add and manage admin accounts with precision. Assign roles, define permissions, suspend or reactivate accounts, and ensure only authorized personnel have access to sensitive information. Maintain a secure and well-controlled administrative environment.",
    icon: Shield,
    color: "text-yellow-400",
  },
  {
    title: "Students",
    body: "View and manage every student’s profile, including enrollment status, assigned subjects, grades, behavior records, and lesson access. Monitor subscription and payment status, ensure proper class placement, and address student-related concerns effectively.",
    icon: GraduationCap,
    color: "text-yellow-400",
  },
  {
    title: "Parents",
    body: "Monitor parent accounts, view linked children, track payments, and manage communication preferences. Ensure parents stay informed about their children’s progress, fees, and school notifications, enhancing parent-school collaboration.",
    icon: Users,
    color: "text-yellow-400",
  },
  {
    title: "Teachers",
    body: "Onboard and manage teachers effectively. Assign classes and subjects, review their schedules, track performance, and manage compensation. Ensure teachers are supported with the right resources and can deliver high-quality lessons consistently.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Awards",
    body: "Recognize excellence across students and staff. Give badges, certificates, and awards for outstanding achievements, academic performance, and special contributions. Foster motivation and encourage a culture of excellence throughout the school.",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Reports",
    body: "Generate insightful reports on attendance, revenue, student performance, and overall platform usage. Use these analytics to make informed decisions, identify trends, and continuously improve school management and operations.",
    icon: BarChart3,
    color: "text-yellow-400",
  },
  {
    title: "Settings",
    body: "Configure school-wide settings, including fee structures, notifications, grading systems, session dates, and security rules. Maintain flexibility and control over the platform’s core configurations to ensure smooth operation and compliance.",
    icon: Settings,
    color: "text-yellow-400",
  },
  {
    title: "Guide",
    body: "You’ve completed the admin tour! Return anytime to refresh your knowledge or train new admins. This guide ensures every feature and tool is fully understood and used effectively for optimal school management.",
    icon: BookMarkedIcon,
    color: "text-yellow-400",
  },
];

const superadminSteps: GuideStep[] = [
  {
    title: "Welcome Back, Admin!",
    body: "Welcome to the Yare platform! As an admin, you have full control over every aspect of the system — from managing students and teachers to overseeing classes, subjects, and payments. This guide will walk you through each section so you can make the most of the tools at your disposal.",
    icon: Shield,
    color: "text-yellow-400",
  },
  {
    title: "Subjects",
    body: "Create and organize all subjects offered in the school. Assign unique codes, write detailed descriptions, link them to appropriate grades and classes, and ensure each subject is taught by qualified teachers. Keep the curriculum structured and up-to-date for all academic programs.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Classes",
    body: "Manage all classes within the school efficiently. View enrolled students, assign and manage teachers, monitor attendance, track class performance, and make adjustments to class schedules as needed. Ensure students and teachers have a smooth, organized learning experience.",
    icon: Grid,
    color: "text-yellow-400",
  },
  {
    title: "Timetable",
    body: "Design and publish weekly timetables for each class, preventing scheduling conflicts and ensuring optimal utilization of teachers and classrooms. Adjust schedules dynamically, accommodate special events, and maintain clarity for students, teachers, and staff.",
    icon: Calendar,
    color: "text-yellow-400",
  },
  {
    title: "Lesson Fees",
    body: "Track student payments, manage subscriptions, process renewals, and view detailed payment histories. Set up multiple fee structures, monitor unpaid fees, and generate financial reports to maintain a transparent and well-organized billing system.",
    icon: CreditCard,
    color: "text-yellow-400",
  },
  {
    title: "Admins",
    body: "Add and manage admin accounts with precision. Assign roles, define permissions, suspend or reactivate accounts, and ensure only authorized personnel have access to sensitive information. Maintain a secure and well-controlled administrative environment.",
    icon: Shield,
    color: "text-yellow-400",
  },
  {
    title: "Students",
    body: "View and manage every student’s profile, including enrollment status, assigned subjects, grades, behavior records, and lesson access. Monitor subscription and payment status, ensure proper class placement, and address student-related concerns effectively.",
    icon: GraduationCap,
    color: "text-yellow-400",
  },
  {
    title: "Parents",
    body: "Monitor parent accounts, view linked children, track payments, and manage communication preferences. Ensure parents stay informed about their children’s progress, fees, and school notifications, enhancing parent-school collaboration.",
    icon: Users,
    color: "text-yellow-400",
  },
  {
    title: "Teachers",
    body: "Onboard and manage teachers effectively. Assign classes and subjects, review their schedules, track performance, and manage compensation. Ensure teachers are supported with the right resources and can deliver high-quality lessons consistently.",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  {
    title: "Awards",
    body: "Recognize excellence across students and staff. Give badges, certificates, and awards for outstanding achievements, academic performance, and special contributions. Foster motivation and encourage a culture of excellence throughout the school.",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Reports",
    body: "Generate insightful reports on attendance, revenue, student performance, and overall platform usage. Use these analytics to make informed decisions, identify trends, and continuously improve school management and operations.",
    icon: BarChart3,
    color: "text-yellow-400",
  },
  {
    title: "Settings",
    body: "Configure school-wide settings, including fee structures, notifications, grading systems, session dates, and security rules. Maintain flexibility and control over the platform’s core configurations to ensure smooth operation and compliance.",
    icon: Settings,
    color: "text-yellow-400",
  },
  {
    title: "Guide",
    body: "You’ve completed the admin tour! Return anytime to refresh your knowledge or train new admins. This guide ensures every feature and tool is fully understood and used effectively for optimal school management.",
    icon: BookMarkedIcon,
    color: "text-yellow-400",
  },
];

// === CONFIG BY ROLE ===
const guides: Record<UserType, GuideConfig> = {
  student: {
    steps: studentSteps,
    accent: "yellow",
    border: "border-yellow-500",
    button: "bg-yellow-500 hover:bg-yellow-400 text-black",
  },
  parent: {
    steps: parentSteps,
    accent: "yellow",
    border: "border-yellow-500",
    button: "bg-yellow-500 hover:bg-yellow-400 text-black",
  },
  teacher: {
    steps: teacherSteps,
    accent: "yellow",
    border: "border-yellow-500",
    button: "bg-yellow-500 hover:bg-yellow-400 text-black",
  },
  admin: {
    steps: adminSteps,
    accent: "yellow",
    border: "border-yellow-500",
    button: "bg-yellow-500 hover:bg-yellow-400 text-black",
  },
  superadmin: {
    steps: superadminSteps,
    accent: "pink",
    border: "border-pink-500",
    button: "bg-pink-500 hover:bg-pink-400 text-white",
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

  console.log(rawUserType, 'rawUserType')
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-2xl rounded-2xl bg-gray-900 border-2 ${config.border} shadow-2xl overflow-hidden`}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 z-10 rounded-full bg-white/10 p-2.5 text-gray-400 hover:bg-white/20 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 md:p-12">
            <motion.div
              key={currentStep}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start gap-5 mb-8">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <current.icon className={`w-10 h-10 ${current.color}`} />
                </div>
                <h2
                  className={`text-3xl font-bold text-${config.accent}-400 mt-2`}
                >
                  {current.title}
                </h2>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed">
                {current.body}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 my-10">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? `w-10 bg-${config.accent}-400`
                      : "w-2 bg-white/25"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prev}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition ${
                  currentStep === 0
                    ? "text-gray-600 cursor-not-allowed"
                    : `text-${config.accent}-400 bg-${config.accent}-400/10 hover:bg-${config.accent}-400/20`
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={next}
                className={`px-8 py-3 ${config.button} font-bold rounded-xl shadow-lg transition hover:scale-105 active:scale-95`}
              >
                {isLastStep ? "Get Started" : "Next"}
              </button>
            </div>

            {/* {!isLastStep && (
              <button
                onClick={handleClose}
                className={`mt-6 text-sm text-gray-500 hover:text-${config.accent}-400 transition block mx-auto`}
              >
                Skip Guide → Go to Dashboard
              </button>
            )} */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuideModal;
