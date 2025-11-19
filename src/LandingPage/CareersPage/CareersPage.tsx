// src/pages/CareersPage/CareersPage.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  MapPin,
  DollarSign,
  Heart,
  BookOpen,
} from "lucide-react";

interface Job {
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  salary?: string;
  perks: string[];
  description: string;
}

const openRoles: Job[] = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
    salary: "₦8M – ₦12M / year",
    perks: [
      "Equity",
      "Health Insurance",
      "Learning Budget",
      "Relocation Support",
    ],
    description:
      "Build the future of education in Africa. Lead our React + Node stack.",
  },
  {
    title: "Content Creator (Science & Math)",
    department: "Curriculum",
    location: "Remote (Nigeria)",
    type: "Full-time",
    salary: "₦3.5M – ₦5M / year",
    perks: ["Flexible Hours", "Creative Freedom", "Teacher Training"],
    description:
      "Create engaging WAEC/JAMB lessons that inspire 100,000+ students.",
  },
  {
    title: "Customer Success Lead",
    department: "Support",
    location: "Abuja, Nigeria",
    type: "Full-time",
    salary: "₦4M – ₦6M / year",
    perks: ["Performance Bonus", "Parental Leave", "Team Offsites"],
    description:
      "Help parents and students succeed. Be the voice of Yare Height Learning Hub.",
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote (West Africa)",
    type: "Contract",
    salary: "₦500k – ₦800k / month",
    perks: ["Remote First", "Design Tools", "Mentorship"],
    description: "Design intuitive learning experiences for Nigerian students.",
  },
];

const CareersPage: React.FC = () => {
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
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-10 w-64 h-64 bg-[#ffd000]/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-16 w-80 h-80 bg-[#023009]/5 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Hero */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]"
          >
            <Users className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              JOIN OUR MISSION
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-[#023009] mb-6"
          >
            Build the Future
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                of Education
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
            Join 50+ innovators shaping how{" "}
            <strong className="text-[#023009]">Nigeria learns</strong>. Work
            from Lagos, Abuja, or remotely.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { icon: <Users />, label: "Team Size", value: "50+" },
            { icon: <MapPin />, label: "Locations", value: "5 Cities" },
            { icon: <Heart />, label: "Students Helped", value: "100,000+" },
            { icon: <Sparkles />, label: "Funding", value: "Seed Round" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl border-2 border-[#ffd000]/50 text-center"
            >
              <div className="text-[#ffd000] mb-2">{stat.icon}</div>
              <div className="text-3xl font-black text-[#023009]">
                {stat.value}
              </div>
              <div className="text-sm text-[#023009]/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Open Roles */}
        <div className="space-y-8 mb-20">
          <h2 className="text-4xl font-black text-[#023009] text-center mb-12">
            Open Roles
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {openRoles.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white p-8 rounded-3xl border-2 border-[#ffd000] transition-all duration-300 hover:border-[#023009] hover:shadow-xl h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#023009]">
                        {job.title}
                      </h3>
                      <p className="text-[#023009]/70 text-sm">
                        {job.department}
                      </p>
                    </div>
                    <span className="bg-[#ffd000] text-[#023009] px-3 py-1 rounded-full text-xs font-bold">
                      {job.type}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6 text-sm text-[#023009]/80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#ffd000]" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#ffd000]" />
                        {job.salary}
                      </div>
                    )}
                  </div>

                  <p className="text-[#023009]/70 mb-6 flex-1">
                    {job.description}
                  </p>

                  {/* Perks */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.perks.map((perk) => (
                      <span
                        key={perk}
                        className="bg-[#023009]/5 text-[#023009] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {perk}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <a
                    href={`mailto:careers@yare.education?subject=Application: ${job.title}`}
                    className="inline-flex items-center gap-2 text-[#023009] font-bold hover:text-[#34c759] transition-colors"
                  >
                    Apply Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Culture Section */}
        <div className="bg-gradient-to-r from-[#023009] to-[#023009]/90 text-white p-12 rounded-3xl shadow-xl mb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-black mb-4">Our Culture</h2>
              <p className="text-lg mb-6">
                We believe in <strong>impact over hours</strong>. Work with
                brilliant minds who care deeply about education in Africa.
              </p>
              <ul className="space-y-3">
                {[
                  "Remote-first with Lagos & Abuja hubs",
                  "Unlimited PTO + parental leave",
                  "Learning stipend: ₦500k/year",
                  "Equity for all full-time hires",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#ffd000]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
              <BookOpen className="w-16 h-16 text-[#ffd000] mb-4" />
              <p className="text-2xl font-bold">
                "We don't just teach — we transform lives."
              </p>
              <p className="text-sm mt-2">—  Yare Height Learning Hub Team</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareersPage;
