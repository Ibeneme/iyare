import React from "react";
import { motion } from "framer-motion";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Sparkle } from "../Shared/index";

/** Final call to action, shown above the footer on every public page. */
const ContactUsSection: React.FC = () => (
  <section aria-labelledby="contact-title" className="px-3 sm:px-6 py-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-14 sm:px-14 text-center"
      style={{ background: "var(--lp-green)", color: "#fff" }}
    >
      <Sparkle className="absolute left-[8%] top-[18%] lp-bob" size={30} />
      <Sparkle className="absolute right-[9%] bottom-[16%] lp-bob lp-bob--slow" size={24} color="#fff" />

      <span className="lp-label" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>
        <Clock size={14} /> Open day and night
      </span>
      <h2 id="contact-title" className="lp-h2 mt-5">Got a question? <span style={{ color: "var(--lp-yellow)" }}>Just ask.</span></h2>
      <p className="mt-4 mx-auto max-w-xl text-white/85 leading-relaxed">
        A real person, not a bot, will reply within <strong className="text-white">2 minutes</strong>, any time of the day.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href="https://wa.me/2347067363653" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn--yellow lp-btn--lg"><MessageCircle size={18} /> Chat on WhatsApp</a>
        <a href="mailto:support@yare.ng" className="lp-btn lp-btn--lg" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}><Mail size={18} /> Email us</a>
      </div>

      <p className="mt-8 text-xs sm:text-sm text-white/75">
        <strong className="text-white">2,500+</strong> parents helped this week · <strong className="text-white">4.9 stars</strong> on WhatsApp · <strong className="text-white">100%</strong> replied
      </p>
    </motion.div>
  </section>
);

export default ContactUsSection;
