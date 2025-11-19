// src/components/HomeLessonsSection/HomeLessonsSection.tsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Laptop,
  Users,
  Trophy,
  Clock,
  Globe,
  MessageCircle,
  FileText,
  BarChart3,
  Gamepad2,
  Video,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: <Laptop className="w-8 h-8" />,
    title: "Live Classes from Home",
    desc: "Join expert teachers in real-time — no travel, no stress.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: "Smart Workbooks",
    desc: "Interactive quizzes, assignments, and instant grading.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Study with Friends",
    desc: "Group chats, projects, and peer support — just like school.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <Trophy className="w-8 h-8" />,
    title: "Earn Badges & Rewards",
    desc: "Unlock achievements, track progress, and stay motivated.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Learn on Your Time",
    desc: "Morning, evening, or weekend — study when it suits you.",
    bg: "bg-[#ffd000]",
    text: "text-[#023009]",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Exams Ready",
    desc: "Global teaching methods = exam success.",
    bg: "bg-[#023009]",
    text: "text-white",
  },
];

const HomeLessonsSection: React.FC = () => {
  const navigate = useNavigate();

  const handleParentLogin = () => {
    navigate("/auth-sign-in?type=parent");
  };

  const handleStudentLogin = () => {
    navigate("/auth-sign-in?type=student");
  };

  return (
    <section className="relative bg-gradient-to-b from-[#f5fdf5] to-white py-32 overflow-hidden">
      {/* Tech Circuit Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-circuit-pattern bg-[length:200px_200px]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-64 h-64 bg-[#ffd000]/10 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-32 w-80 h-80 bg-[#023009]/5 rounded-full"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <div className="w-2 h-2 bg-[#ffd000] rounded-full animate-ping"></div>
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              HOME + SCHOOL = BRIGHTER FUTURE
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-[#023009] mb-6">
            School at Home,
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Reimagined
              </span>
            </span>
          </h2>
          <p className="text-xl text-[#023009]/70 max-w-3xl mx-auto">
            Live classes, homework, exams, and friends — all in one safe, smart
            app.
            <strong className="text-[#023009]">
              {" "}
              Built for Global students.
            </strong>
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative bg-white p-8 rounded-3xl border-2 border-[#ffd000] h-full transition-all duration-300 hover:border-[#023009]">
                <div
                  className={`${feature.bg} ${feature.text} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#023009] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#023009]/70 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Parent + Student CTA */}
        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Parent Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-[#023009] p-10 rounded-3xl text-white flex flex-col justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Users className="w-9 h-9 text-[#ffd000]" />
                For Parents
              </h3>
              <ul className="space-y-5 text-lg">
                <li className="flex items-start gap-4">
                  <BarChart3 className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Track progress daily</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      See attendance, quiz scores, and teacher notes instantly.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Chat with teachers</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Ask questions, share concerns, or book consultations.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Get report cards</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Download PDF reports with grades and comments.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[#ffd000] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Set study goals</strong>
                    <p className="text-[#ffd000]/80 text-sm mt-1">
                      Create plans and get weekly performance alerts.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={handleParentLogin}
              className="mt-8 bg-[#ffd000] text-[#023009] px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:-translate-y-1 text-lg"
            >
              Open Parent Portal
            </button>
          </motion.div>

          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-[#ffd000] p-10 rounded-3xl text-[#023009] flex flex-col justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Trophy className="w-9 h-9" />
                For Students
              </h3>
              <ul className="space-y-5 text-lg font-medium">
                <li className="flex items-start gap-4">
                  <Video className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Join class in 1 click</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      No setup. Just log in and start learning.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Submit homework easily</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      Upload files, get feedback, never miss a deadline.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Gamepad2 className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Play & earn points</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      Compete, win badges, and level up your skills.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-[#023009] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Re-watch any lesson</strong>
                    <p className="text-[#023009]/80 text-sm mt-1">
                      Pause, rewind, review — learn at your own pace.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={handleStudentLogin}
              className="mt-8 bg-[#023009] text-white px-8 py-4 rounded-full font-bold hover:bg-[#023009]/90 transition-all duration-300 transform hover:-translate-y-1 text-lg"
            >
              Start Learning Now
            </button>
          </motion.div>
        </div>

        {/* Final Trust Badge */}
        <div className="text-center mt-20">
          <p className="text-[#023009]/60 text-sm font-mono tracking-widest">
            Trusted by{" "}
            <strong className="text-[#023009]">2,500+ Students</strong> Global
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomeLessonsSection;
