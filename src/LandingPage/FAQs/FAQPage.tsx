// src/components/FAQSection/FAQSection.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  GraduationCap,
  Globe2,
  Laptop,
  BookOpen,
  BarChart3,
  CheckCircle,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

interface FAQ {
  question: string;
  answer: string | string[];
  icon: React.ReactNode;
}

const faqs: FAQ[] = [
  {
    question: "How can I register my child?",
    answer: [
      "1. Go to yare.ng and click **Get Started**",
      "2. Enter your phone number or email",
      "3. Choose a plan (or start free trial)",
      "4. Add your child’s name, class, and school",
      "5. Done! Login details sent via SMS & email",
    ],
    icon: <UserPlus className="w-5 h-5" />,
  },
  {
    question: "How experienced are your teachers?",
    answer:
      "All teachers are **verified graduates** with 3–15+ years of classroom experience. Many are WAEC/JAMB examiners, ex-heads of department, or former British Council trainers. We only hire the top 5% of applicants.",
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    question: "Do you prepare children for the 11+ exams?",
    answer:
      "Yes! We offer **dedicated 11+ prep** for UK independent schools. Includes verbal reasoning, non-verbal reasoning, maths, and English — all aligned with GL, CEM, and ISEB formats.",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    question: "How do you deliver your classes?",
    answer:
      "Live, interactive classes via Zoom-style video. Small groups (max 12 students). Real-time chat, whiteboard, polls, and breakout rooms. Recordings available 24/7.",
    icon: <Laptop className="w-5 h-5" />,
  },
  {
    question: "What countries do you operate in?",
    answer:
      "We serve families in **Nigeria, UK, USA, Canada, UAE, and 20+ other countries**. As long as you have internet, your child can join from anywhere.",
    icon: <Globe2 className="w-5 h-5" />,
  },
  {
    question: "What Curriculum do you use?",
    answer:
      "We support **multiple curricula** so your child never falls behind:\n\n**British • Nigerian • Australian • Ontario • US • EYFS**\n\nSwitch anytime in parent settings.",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    question: "How do I track my child’s progress?",
    answer: [
      "On the **learner’s portal** we share a **monthly report**, highlighting:",
      "• Topics covered during the sessions",
      "• Areas your child did well in or needed extra help with",
      "• Overall progress and next steps",
      "Teachers are **available anytime** via chat or call to discuss your child’s growth.",
    ],
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    question: "Does the content align with my child’s school and syllabus?",
    answer:
      "Yes! We **map every lesson** to your child’s exact school syllabus. Enter their school and class — we auto-align content. Works for Lagos International School, Grange, or public schools in Kano.",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const FAQSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative bg-gradient-to-b from-[#f5fdf5] to-white py-32 overflow-hidden">
      {/* Circuit Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-circuit-pattern bg-[length:200px_200px]" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-16 w-64 h-64 bg-[#ffd000]/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-72 h-72 bg-[#023009]/5 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]"
          >
            <MessageCircle className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              FREQUENTLY ASKED
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-[#023009] mb-6"
          >
            Your Questions
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Answered
              </span>
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl text-[#023009]/70 max-w-3xl mx-auto"
          >
            From Lagos to London — parents ask, we answer.
          </motion.p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div
                className={`bg-white rounded-3xl border-2 transition-all duration-300 ${
                  activeIndex === index
                    ? "border-[#023009] shadow-lg"
                    : "border-[#ffd000]/50 hover:border-[#ffd000]"
                }`}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        activeIndex === index
                          ? "bg-[#023009] text-white"
                          : "bg-[#ffd000] text-[#023009]"
                      }`}
                    >
                      {faq.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#023009]">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeIndex === index ? (
                      <ChevronUp className="w-6 h-6 text-[#023009]" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#023009]/60" />
                    )}
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2">
                        <div className="pl-14 space-y-3 text-[#023009]/75 text-sm md:text-base leading-relaxed">
                          {Array.isArray(faq.answer) ? (
                            faq.answer.map((line, i) => (
                              <p
                                key={i}
                                className={i === 0 ? "font-medium" : ""}
                              >
                                {line}
                              </p>
                            ))
                          ) : (
                            <p>{faq.answer}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <p className="text-[#023009]/70 mb-4">Still have questions?</p>
          <a
            href="mailto:support@yare.ng"
            className="inline-flex items-center gap-2 bg-[#023009] text-white px-8 py-4 rounded-full font-bold hover:bg-[#012009] transition-all"
          >
            Contact Support <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
