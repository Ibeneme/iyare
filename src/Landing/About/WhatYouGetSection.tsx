import React from "react";
import { motion } from "framer-motion";
import { Calendar, FileCheck, Laptop, MessagesSquare, Shield, Video } from "lucide-react";
import { SectionLabel } from "../Shared/index";

const FEATURES = [
  { icon: <Video size={22} />, title: "Live classes every day", desc: "Real teachers, teaching in real time." },
  { icon: <Laptop size={22} />, title: "Hands-on lessons", desc: "Drag, draw and speak up, so learning feels like play." },
  { icon: <MessagesSquare size={22} />, title: "Friends in class", desc: "A safe class chat and familiar faces each day." },
  { icon: <FileCheck size={22} />, title: "Quick homework", desc: "Hand it in with one tap and get feedback fast." },
  { icon: <Calendar size={22} />, title: "A proper timetable", desc: "Assembly, lessons and break, just like at school." },
  { icon: <Shield size={22} />, title: "Totally safe", desc: "No ads, no strangers, and parents stay in control." },
];

/** Six feature cards: everything a child gets with Yare Height. */
const WhatYouGetSection: React.FC = () => (
  <section aria-labelledby="what-you-get-title" className="lp-section pt-0">
    <div className="lp-container">
      <div className="text-center max-w-2xl mx-auto">
        <SectionLabel dot>Features</SectionLabel>
        <h2 id="what-you-get-title" className="lp-h2 mt-5">Everything your child <span className="lp-gradient-text">needs to thrive</span></h2>
      </div>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
            className="lp-card p-7"
          >
            <span className="w-12 h-12 grid place-items-center rounded-2xl" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>{f.icon}</span>
            <h3 className="lp-h3 mt-5" style={{ fontSize: "1.2rem" }}>{f.title}</h3>
            <p className="mt-2 text-sm lp-muted">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhatYouGetSection;
