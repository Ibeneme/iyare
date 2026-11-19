import React from "react";
import { Target, Globe, Heart, Rocket, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const SettingAbout: React.FC = () => {
  const values = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "Our Mission",
      body: "To nurture a generation of bold thinkers and empathetic leaders through programs tailored to real-world challenges. We bridge the gap between academic theory and practical, cutting-edge professional skills.",
      accent: "border-[var(--color-card-border)]",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Our Vision",
      body: "A world where every learner—regardless of background—has the tools to reach their full potential. We see education as the ultimate catalyst for global innovation and continental growth.",
      accent: "border-yellow-500",
    },
  ];

  return (
    <div className="max-w-4xl text-left pb-20">
      {/* Header & Hero Concept */}
      <header className="mb-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg text-[10px] font-semibold  tracking-tight border border-[var(--color-card-border)]"
        >
          <Heart size={12} className="fill-current" /> The Yare Manifesto
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-semibold text-[var(--color-primary)] tracking-tight leading-[0.9]">
          Empowering <br />
          <span className="text-[var(--color-muted)]">
            Africa’s Future.
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-[var(--color-primary)] font-medium leading-relaxed max-w-2xl border-l-4 border-yellow-400 pl-6">
          Yare Learning Hub is a vibrant, community-driven education initiative
          dedicated to unlocking opportunities for individuals across Nigeria
          and beyond.
        </p>
      </header>

      {/* Main Narrative Section */}
      <section className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <h2 className="text-[10px] font-semibold  tracking-[0.4em] text-[var(--color-muted)] mb-4">
            Who We Are
          </h2>
          <div className="h-1 w-12 bg-[var(--color-brand)] rounded-full" />
        </div>
        <div className="md:col-span-8 space-y-6">
          <p className="text-[var(--color-muted)] font-semibold leading-loose">
            We believe that quality education should be a right, not a
            privilege. Our work is centered on making that belief a reality
            through a foundation of accessibility, inclusivity, and empowerment.
          </p>
          <p className="text-[var(--color-muted)] font-semibold leading-loose">
            By combining innovative teaching methods with meaningful mentorship
            and a deep sense of cultural pride, we create an environment where
            every learner can achieve profound growth and personal
            transformation.
          </p>
        </div>
      </section>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {values.map((v, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5 }}
            className={`p-10 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl shadow-[var(--shadow-card)] relative overflow-hidden`}
          >
            <div
              className={`absolute top-0 left-0 w-2 h-full bg-[var(--color-surface)] group-hover:bg-[var(--color-brand)] transition-colors`}
            />
            <div className="mb-6 p-4 bg-[var(--color-success-bg)] text-[var(--color-primary)] inline-block rounded-2xl">
              {v.icon}
            </div>
            <h3 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-4 ">
              {v.title}
            </h3>
            <p className="text-sm text-[var(--color-muted)] font-semibold leading-relaxed">
              {v.body}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Footer Callout */}
      <div className="mt-20 flex flex-col items-center p-12 bg-[#1b2030] rounded-3xl text-center relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Rocket size={120} className="text-white" />
        </div>

        <ShieldCheck className="text-yellow-400 w-12 h-12 mb-6" />
        <h4 className="text-2xl font-semibold text-white tracking-tight mb-4">
          Investing in Minds, Shaping the Continent.
        </h4>
        <p className="text-white/70 font-semibold text-sm max-w-md mb-8">
          Our long-term vision is to be a sustainable force for positive change,
          leaving a legacy of thriving communities.
        </p>
        <button className="px-10 py-4 bg-yellow-400 text-[var(--color-primary)] font-semibold text-[11px]  tracking-tight rounded-full hover:scale-105 transition-transform">
          Join Our Mission
        </button>
      </div>

      <p className="mt-12 text-center text-[9px] font-semibold text-[var(--color-muted)]  tracking-[0.4em]">
        Yare Learning Hub • Est. 2024
      </p>
    </div>
  );
};

export default SettingAbout;
