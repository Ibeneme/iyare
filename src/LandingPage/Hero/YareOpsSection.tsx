import React from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, ShieldCheck } from "lucide-react";

const YareOpsSection: React.FC = () => {
  // Animation Variants
  const containerVars = {
    animate: { transition: { staggerChildren: 0.2 } },
  };

  return (
    <section className="relative bg-[#023009] py-24 md:py-32 overflow-hidden selection:bg-[#ffd000] selection:text-[#023009]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-[#ffd000] rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Badge Header */}
        <div className="flex flex-col items-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-2 rounded-2xl border border-[#ffd000]/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#ffd000]" />
            <span className="text-[#ffd000] font-black text-[10px] uppercase tracking-[0.4em]">
              The Institutional Manifesto
            </span>
            <ShieldCheck className="w-4 h-4 text-[#ffd000]" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: YARE Acronym */}
          <motion.div
            variants={containerVars}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { l: "Y", t: "You" },
              { l: "A", t: "Are" },
              { l: "R", t: "Remarkably" },
              { l: "E", t: "Exceptional" },
            ].map((item, i) => (
              <motion.h2
                key={i}
                className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none flex items-baseline gap-4 italic group"
              >
                <span className="text-[#ffd000] drop-shadow-[0_0_15px_rgba(255,208,0,0.3)] group-hover:scale-110 transition-transform inline-block">
                  {item.l}
                </span>
                <span className="text-white/20 group-hover:text-white transition-colors duration-500">
                  —
                </span>
                <span className="text-3xl md:text-5xl group-hover:translate-x-2 transition-transform duration-500">
                  {item.t}
                </span>
              </motion.h2>
            ))}
          </motion.div>

          {/* Right Side: Philosophy */}
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute -left-6 top-0 w-1 h-full bg-[#ffd000] rounded-full" />
              <p className="text-xl md:text-2xl text-white font-bold leading-relaxed tracking-tight italic">
                "That’s what <span className="text-[#ffd000]">YARE</span> stands
                for — and it’s the fundamental truth we believe every student
                embodies. Our mission is to engineer the environment where they
                shine effortlessly."
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex-1 min-w-[200px]">
                <p className="text-[#ffd000] text-3xl font-black italic">60+</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                  Remarkable Learners
                </p>
              </div>
              <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 text-[#ffd000]">
                  <Zap size={20} fill="currentColor" />
                  <p className="text-3xl font-black italic">100%</p>
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                  Growth Trajectory
                </p>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-white/40 font-mono text-[11px] tracking-widest flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM NODE: MANIFESTO_PROTOCOL_V2
            </motion.p>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Border */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd000]/50 to-transparent" />
    </section>
  );
};

export default YareOpsSection;
