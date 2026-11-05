// src/components/LessonsDigitalizedSection/LessonsDigitalizedSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Smartphone,
  Headphones,
  Shield,
  Sparkles,
  PlayCircle,
  Download,
  Lock,
  Globe2,
  Star,
  ArrowRight,
} from "lucide-react";

const digitalFeatures = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "AI-Powered Learning",
    desc: "Personalized lessons that adapt to your child’s pace and style.",
    detail: "Smart recommendations, difficulty scaling, and instant hints.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Instant Feedback",
    desc: "No more waiting. Get answers and corrections in real time.",
    detail: "Auto-graded quizzes, teacher notes, and progress alerts.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Any Device, Anywhere",
    desc: "Learn on phone, tablet, or laptop — online or offline.",
    detail: "Download lessons, sync progress, and resume anytime.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <Headphones className="w-8 h-8" />,
    title: "Audio & Video Lessons",
    desc: "Watch, listen, and learn with crystal-clear content.",
    detail: "HD videos, voice notes, and interactive animations.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Safe & Secure",
    desc: "COPPA-compliant. Your child’s data is always protected.",
    detail: "End-to-end encryption, parent controls, and no ads.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Gamified Progress",
    desc: "Earn stars, unlock levels, and celebrate every win.",
    detail: "Leaderboards, daily challenges, and reward streaks.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
];

const LessonsDigitalizedSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-b from-white to-[#f5fdf5] py-32 overflow-hidden">
      {/* Tech Circuit Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-circuit-pattern bg-[length:200px_200px]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 left-16 w-72 h-72 bg-[#ffd000]/10 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-28 right-16 w-80 h-80 bg-[#023009]/5 rounded-full"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <div className="w-2 h-2 bg-[#ffd000] rounded-full animate-ping"></div>
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              LESSONS DIGITALIZED
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-[#023009] mb-6">
            Every Lesson,
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Digitalized
              </span>
            </span>
          </h2>
          <p className="text-xl text-[#023009]/70 max-w-3xl mx-auto">
            Traditional teaching meets cutting-edge tech. No textbooks. No
            excuses. Just results.
          </p>
        </div>

        {/* Digital Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {digitalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative bg-white p-8 rounded-3xl border-2 border-[#ffd000] h-full transition-all duration-300 hover:border-[#023009] flex flex-col">
                <div
                  className={`${feature.bg} ${feature.text} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#023009] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#023009]/70 leading-relaxed mb-2">
                  {feature.desc}
                </p>
                <p className="text-sm text-[#023009]/60 italic">
                  {feature.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dual CTA */}
        <div className="grid lg:grid-cols-2 gap-12 items-stretch mb-16">
          {/* Teacher / School Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-[#023009] p-10 rounded-3xl text-white flex flex-col justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Globe2 className="w-9 h-9 text-[#ffd000]" />
                For Teachers & Schools
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex items-start gap-4">
                  <PlayCircle className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Upload & teach live</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Stream lessons, share screen, and use digital whiteboard.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Download className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Assign & track homework</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Set deadlines, review submissions, and grade instantly.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Star className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Performance analytics</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      See class trends, weak areas, and top performers.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Lock className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Secure classroom</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Private links, attendance logs, and anti-cheat tools.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/auth-sign-in?type=teacher")}
              className="mt-8 bg-[#ffd000] text-[#023009] px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Teaching <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Student / Parent Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-[#ffd000] p-10 rounded-3xl text-[#023009] flex flex-col justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-9 h-9" />
                For Students & Parents
              </h3>
              <ul className="space-y-5 text-lg font-medium">
                <li className="flex items-start gap-4">
                  <Brain className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Learn smarter, not harder</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      AI suggests what to study next based on your performance.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Headphones className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Offline mode</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      Download lessons and study without internet.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>100% safe</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      No ads, no tracking, no distractions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Star className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Free trial included</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      7 days full access — no card needed.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/auth-sign-in?type=parent")}
              className="mt-8 bg-[#023009] text-white px-8 py-4 rounded-full font-bold hover:bg-[#023009]/90 transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* Final Trust Badge */}
        <div className="text-center">
          <p className="text-[#023009]/60 text-sm font-mono tracking-widest">
            Trusted by{" "}
            <strong className="text-[#023009]">15,000+ learners</strong> •
            Average Score Improvement:{" "}
            <strong className="text-[#023009] border-b-2 border-[#ffd000]">
              +42%
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LessonsDigitalizedSection;
