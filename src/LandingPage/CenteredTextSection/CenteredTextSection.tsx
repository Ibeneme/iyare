// src/components/CenteredTextSection/CenteredTextSection.tsx
import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mail, Clock } from "lucide-react";

const CenteredTextSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-[#ffd000] to-[#e6c200] py-20 overflow-hidden pb-48">
      {/* Subtle Circuit */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-circuit-pattern bg-[length:250px_250px]" />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-16 -left-16 w-64 h-64 bg-[#023009]/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-16 -right-16 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4 border border-white/30">
            <Clock className="w-4 h-4 text-[#023009]" />
            <span className="text-[#023009] font-black text-xs tracking-widest uppercase">
              24/7 • Under 2 Mins
            </span>
          </div>

          <h3 className="text-3xl md:text-4xl font-black text-[#023009] mb-3">
            Got a Question?
          </h3>

          <p className="text-base md:text-lg text-[#023009]/85 max-w-xl mx-auto font-medium leading-relaxed">
            Talk to a real person — not a bot. We reply in{" "}
            <strong>under 2 minutes</strong>, day or night.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10"
        >
          <a
            href="https://wa.me/2349012345678"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 bg-[#023009] text-white px-7 py-3.5 rounded-full font-bold text-base hover:bg-[#012009] transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
            <span className="text-xs font-normal opacity-75 ml-1">
              Most Used
            </span>
          </a>

          <a
            href="mailto:support@yare.ng"
            className="inline-flex items-center gap-2.5 bg-white text-[#023009] px-7 py-3.5 rounded-full font-bold text-base border-2 border-[#023009] hover:bg-[#023009] hover:text-white transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Mail className="w-5 h-5" />
            Email Us
          </a>
        </motion.div>

        {/* Trust Line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 text-xs md:text-sm text-[#023009]/70 font-mono tracking-wider"
        >
          <strong className="text-[#023009]">2,500+</strong> parents helped this
          week •<strong className="text-[#023009]"> 4.9 stars</strong> on
          WhatsApp •<strong className="text-[#023009]">100% reply</strong>
        </motion.p>
      </div>

      {/* Wavy Bottom – Matches SubjectsPage, FAQSection, etc. */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 text-[#023009]"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 Q360,70 720,40 T1440,40 L1440,80 L0,80 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

export default CenteredTextSection;
