import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Smile, Sparkles, Star } from "lucide-react";

const PARENTS = ["Live progress updates", "Message teachers directly", "Weekly reports", "Screen-time controls", "A friendly parent community"];
const STUDENTS = ["See friends every day", "Play learning games", "Collect stars", "Never lose homework", "Kind, encouraging teachers"];

const Column: React.FC<{ title: string; icon: React.ReactNode; items: string[]; bullet: React.ReactNode; delay: number }> = ({ title, icon, items, bullet, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }}>
    <h3 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
      <span style={{ color: "var(--lp-yellow)" }}>{icon}</span> {title}
    </h3>
    <ul className="mt-6 space-y-3.5">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3 text-white/90">
          <span style={{ color: "var(--lp-yellow)" }}>{bullet}</span> {item}
        </li>
      ))}
    </ul>
  </motion.div>
);

/** Dark green panel listing what parents and students each get. */
const ForParentsAndStudentsSection: React.FC = () => (
  <section aria-labelledby="parents-students-title" className="lp-section pt-0">
    <div className="lp-container">
      <div className="rounded-[2rem] p-8 md:p-14" style={{ background: "var(--lp-green-deep)", color: "#fff" }}>
        <h2 id="parents-students-title" className="sr-only">What parents and students get</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          <Column title="For parents" icon={<Smile className="w-9 h-9" />} items={PARENTS} bullet={<CheckCircle className="w-5 h-5" />} delay={0} />
          <Column title="For students" icon={<Sparkles className="w-9 h-9" />} items={STUDENTS} bullet={<Star className="w-5 h-5" />} delay={0.1} />
        </div>
      </div>
    </div>
  </section>
);

export default ForParentsAndStudentsSection;
