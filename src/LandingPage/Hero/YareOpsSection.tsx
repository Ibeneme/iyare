import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const YareOpsSection: React.FC = () => {
  return (
    <section className="relative bg-[#023009] py-20 overflow-hidden">
      {/* Floating Gold Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-12 w-72 h-72 bg-[#ffd000]/10 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 25, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-16 w-80 h-80 bg-[#ffd000]/5 rounded-full"
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <Zap className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#ffd000] font-black text-sm tracking-widest">
              WHAT YARE MEANS
            </span>
            <Zap className="w-5 h-5 text-[#ffd000]" />
          </div>

          {/* YARE Meaning */}
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">
            <span className="block">
              <span className="text-[#ffd000]">Y</span> – You
            </span>
            <span className="block">
              <span className="text-[#ffd000]">A</span> – Are
            </span>
            <span className="block">
              <span className="text-[#ffd000]">R</span> – Remarkably
            </span>
            <span className="block">
              <span className="text-[#ffd000]">E</span> – Exceptional
            </span>
          </h2>

          <p className="text-white/80 text-lg max-w-3xl mx-auto">
            That’s what YARE stands for — and it’s what we believe every child
            is. Our mission is simple: help them shine effortlessly.
          </p>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm font-mono tracking-widest">
            <strong className="text-[#ffd000]">60+</strong> remarkable learners
            growing every day
          </p>
        </div>
      </div>
    </section>
  );
};

export default YareOpsSection;
