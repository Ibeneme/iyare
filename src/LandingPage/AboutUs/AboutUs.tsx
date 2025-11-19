// src/pages/AboutUsPage/AboutUsPage.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Globe2,
  Heart,
  Trophy,
  Home,
  Video,
  Laptop,
  MessagesSquare,
  FileCheck,
  Calendar,
  Shield,
  CheckCircle,
  Star,
  Sparkles,
  Smile,
  ArrowRight,
} from "lucide-react";
import childOnGlasses from "../../assets/images/childonglasses.jpg";
import crayons from "../../assets/images/crayons.jpg";

const AboutUsPage: React.FC = () => {
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
          className="absolute top-32 left-10 w-64 h-64 bg-[#ffd000]/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-16 w-80 h-80 bg-[#023009]/5 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* HERO */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]"
          >
            <Globe2 className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              TRUSTED BY 15,000+ FAMILIES
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-[#023009] mb-6"
          >
            Real School.
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Real Home.
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
            Yare Height Learning Hub is the complete digital school — live
            classes, real teachers, friends, exams, and joy — all from home.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          >
            <a
              href="/register"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#ffd000] text-[#023009] rounded-full font-bold text-lg hover:bg-[#e6c200] transition-all"
            >
              Start 7-Day Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </a>
            <a
              href="/subjects"
              className="px-8 py-4 bg-[#023009] text-white rounded-full font-bold text-lg hover:bg-[#012009] transition-all"
            >
              View Classes
            </a>
          </motion.div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {[
            { num: "15,000+", label: "Active Students" },
            { num: "98.2%", label: "Pass Rate" },
            { num: "40+", label: "Teachers" },
            { num: "4.9 stars", label: "Rating" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl border-2 border-[#ffd000]/50 text-center"
            >
              <div className="text-4xl font-black text-[#023009]">
                {stat.num}
              </div>
              <div className="text-sm text-[#023009]/80 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* MISSION */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-[#023009] mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-[#023009]/80 leading-relaxed mb-4">
              To give <strong>every child</strong> access to world-class
              education — with real teachers, real friends, and real joy —
              without leaving home.
            </p>
            <p className="text-lg text-[#023009]/80 leading-relaxed">
              We’re replacing chaos with structure. Fear with confidence.
              Isolation with community.
            </p>
            <p className="text-xl font-bold text-[#023009] mt-6">
              Education should never be a privilege. At Yare Height Learning
              Hub, it’s a promise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl overflow-hidden "
          >
            <img
              src={childOnGlasses}
              alt="Happy child learning"
              className="w-full h-96 object-cover"
            />
          </motion.div>
        </div>

        {/* VISION */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl overflow-hidden  order-2 lg:order-1"
          >
            <img
              src={crayons}
              alt="Creative learning"
              className="w-full h-96 object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-6xl font-black text-[#023009] mb-6">
              Our Vision
            </h2>
            <p className="text-lg text-[#023009]/80 leading-relaxed mb-4">
              Every child wakes up <strong>excited to learn</strong>, grows with
              confidence, and passes exams with pride.
            </p>
            <p className="text-lg text-[#023009]/80 leading-relaxed">
              No more traffic. No more strikes. No more safety worries. Learning
              that’s joyful, effective, and deeply rooted in our culture.
            </p>
            <p className="text-xl font-bold text-[#023009] mt-6">
              That future starts today — with Yare Height Learning Hub.
            </p>
          </motion.div>
        </div>

        {/* FOUNDER STORY */}
        <div className="bg-white rounded-3xl p-10 md:p-16  mb-20 border-2 border-[#ffd000]/50">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-black text-[#023009] mb-6">
                From One Vision to a Revolution
              </h2>
              <p className="text-lg text-[#023009]/80 leading-relaxed mb-4">
                In 2021, <strong>Onyekachi</strong> saw children falling behind
                during school closures. Tutors were expensive. YouTube wasn’t
                teaching.
              </p>
              <p className="text-lg text-[#023009]/80 leading-relaxed mb-4">
                He asked:{" "}
                <strong>
                  “Why can’t kids get a full school experience — from home?”
                </strong>
              </p>
              <p className="text-lg text-[#023009]/80 leading-relaxed">
                He built Yare Height Learning Hub — live classes, real friends,
                proper structure, and joy. Today, it’s Nigeria’s fastest-growing
                online school.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-3xl w-full h-80 mb-6" />
              <h3 className="text-2xl font-black text-[#023009]">
                Iyare Onyekachukwu
              </h3>
              <p className="text-lg font-semibold text-[#023009]/90">
                Founder & CEO
              </p>
              <p className="text-sm text-[#023009]/70 mt-3 max-w-xs mx-auto">
                Passionate educator making world-class learning accessible to
                every Nigerian child.
              </p>
            </motion.div>
          </div>
        </div>

        {/* VALUES */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-[#023009] text-center mb-12">
            We Believe in Three Things
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart />,
                title: "Joyful Learning",
                desc: "Children learn best when they’re happy.",
              },
              {
                icon: <Trophy />,
                title: "Real Results",
                desc: "Our students score A’s and B’s in WAEC & JAMB.",
              },
              {
                icon: <Home />,
                title: "Happy Families",
                desc: "No traffic. More family time. Learning that fits your life.",
              },
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-3xl border-2 border-[#ffd000] hover:border-[#023009] transition-all hover: text-center"
              >
                <div className="text-[#ffd000] mb-6">{v.icon}</div>
                <h3 className="text-2xl font-bold text-[#023009] mb-3">
                  {v.title}
                </h3>
                <p className="text-[#023009]/70">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-[#023009] text-center mb-12">
            Everything Your Child Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Video />,
                title: "Live Classes Daily",
                desc: "Real teachers teaching live.",
              },
              {
                icon: <Laptop />,
                title: "Interactive Lessons",
                desc: "Drag, draw, speak — learning feels like play.",
              },
              {
                icon: <MessagesSquare />,
                title: "Make Real Friends",
                desc: "Safe class chat. See friends every day.",
              },
              {
                icon: <FileCheck />,
                title: "Homework in Seconds",
                desc: "Submit with one tap. Get feedback fast.",
              },
              {
                icon: <Calendar />,
                title: "Proper Timetable",
                desc: "Assembly, periods, break — just like school.",
              },
              {
                icon: <Shield />,
                title: "100% Safe",
                desc: "No ads. No strangers. Full parent control.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl border border-[#ffd000]/50 hover:border-[#ffd000] transition-all"
              >
                <div className="p-4 bg-[#ffd000] rounded-2xl w-fit mb-5 text-[#023009]">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-[#023009] mb-2">
                  {f.title}
                </h3>
                <p className="text-[#023009]/70 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PARENTS & STUDENTS */}
        <div className="bg-[#023009] text-white p-12 rounded-3xl ">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-black mb-8 flex items-center gap-3">
                <Smile className="w-10 h-10 text-[#ffd000]" /> For Parents
              </h2>
              <ul className="space-y-4">
                {[
                  "Real-time progress",
                  "Message teachers",
                  "Weekly reports",
                  "Screen time control",
                  "Parent community",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#ffd000]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-black mb-8 flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-[#ffd000]" /> For Students
              </h2>
              <ul className="space-y-4">
                {[
                  "See friends daily",
                  "Play learning games",
                  "Earn stars",
                  "Never lose homework",
                  "Kind teachers",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-[#ffd000]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsPage;
