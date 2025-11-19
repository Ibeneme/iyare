// src/pages/SubjectsPage/SubjectsPage.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Globe2,
  Brain,
  Beaker,
  Code2,
  BookOpen,
  Star,
  ArrowRight,
} from "lucide-react";

interface SubjectCategory {
  title: string;
  items: string[];
  description: string;
  icon: React.ReactNode;
  color: string;
}

const subjects: SubjectCategory[] = [
  {
    title: "Core Subjects",
    items: ["Mathematics", "English Language"],
    description:
      "The foundation of every exam. Master them. Pass WAEC. Pass JAMB.",
    icon: <Calculator className="w-8 h-8" />,
    color: "text-[#023009]",
  },
  {
    title: "Reasoning & Logic",
    items: ["Non-Verbal Reasoning", "Verbal Reasoning"],
    description: "Think faster. Solve smarter. Crack aptitude tests with ease.",
    icon: <Brain className="w-8 h-8" />,
    color: "text-[#023009]",
  },
  {
    title: "Languages",
    items: ["English", "French", "Igbo", "Yoruba", "Hausa"],
    description:
      "Speak your roots. Write your languages. Score full marks in chosen languages.",
    icon: <Globe2 className="w-8 h-8" />,
    color: "text-[#023009]",
  },
  {
    title: "Science",
    items: ["Physics", "Chemistry", "Biology"],
    description: "Understand the world. Build the future. Excel in STEM.",
    icon: <Beaker className="w-8 h-8" />,
    color: "text-[#023009]",
  },
  {
    title: "Digital Skills",
    items: ["UI/UX Design", "Frontend Web Dev", "Python Basics"],
    description: "Code your future. Design your career. Earn in dollars.",
    icon: <Code2 className="w-8 h-8" />,
    color: "text-[#023009]",
  },
];

const SubjectsPage: React.FC = () => {
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
          className="absolute top-20 left-20 w-64 h-64 bg-[#ffd000]/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-32 w-80 h-80 bg-[#023009]/5 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Hero Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]"
          >
            <BookOpen className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              YARE HEIGHT Learning HUB CURRICULUM
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-[#023009] mb-6"
          >
            Choose Your
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Subjects
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl text-[#023009]/70 max-w-3xl mx-auto"
          >
            We cover <strong className="text-[#023009]">ANY subject</strong> —
            WAEC, JAMB, BECE, or beyond. All in one place.
          </motion.p>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative bg-white p-8 rounded-3xl border-2 border-[#ffd000] h-full flex flex-col justify-between transition-all duration-300 hover:border-[#023009] hover:shadow-xl">
                {/* Icon + Stars */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-[#ffd000] rounded-2xl text-[#023009] shadow-lg">
                    {subject.icon}
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-[#ffd000] text-[#ffd000]"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-[#023009] mb-3">
                    {subject.title}
                  </h3>
                  <p className="text-[#023009]/70 text-sm mb-4 leading-relaxed">
                    {subject.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {subject.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-[#023009] font-medium text-sm"
                      >
                        <div className="w-2 h-2 bg-[#023009] rounded-full"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-[#023009] font-bold text-sm hover:text-[#34c759] transition-colors"
                >
                  Start Learning
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final Trust Note */}
        <div className="text-center mt-20">
          <p className="text-[#023009]/60 text-sm font-mono tracking-widest">
            <strong className="text-[#023009]">2,500+ students</strong> already
            learning across Nigeria
          </p>
        </div>
      </div>
    </section>
  );
};

export default SubjectsPage;
