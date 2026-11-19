import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionLabel } from "../Shared/index";
import { signInPathFor } from "../../config/roles";

const AUDIENCES = [
  {
    role: "parent", title: "For parents", fill: "var(--lp-green)", color: "#fff", cta: "Sign in as a parent",
    points: ["See progress every day", "Message teachers directly", "Receive clear report cards", "Keep fees and plans in one place"],
  },
  {
    role: "student", title: "For students", fill: "var(--lp-yellow)", color: "var(--lp-on-yellow)", cta: "Sign in as a student",
    points: ["Join any class in one tap", "Set your own study goals", "Hand in homework online", "Watch your marks climb"],
  },
  {
    role: "teacher", title: "For teachers", fill: "var(--lp-green-deep)", color: "#fff", cta: "Sign in as a teacher",
    points: ["Teach live with simple tools", "Set and mark assignments", "Read learner performance charts", "Work inside a secure classroom"],
  },
];

/** Three role cards, each with a short checklist and a sign-in button. */
const AudienceSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="audience-title" className="lp-section">
      <div className="lp-container">
        <div className="text-center max-w-2xl mx-auto">
          <SectionLabel>Made for everyone at the table</SectionLabel>
          <h2 id="audience-title" className="lp-h2 mt-5">One platform, <span className="lp-gradient-text">three happy roles</span></h2>
          <p className="lp-lead mt-4">Each account type sees only what it needs, so everyone gets a clean, calm workspace.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <motion.article
              key={a.role}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-[1.75rem] p-7 flex flex-col"
              style={{ background: a.fill, color: a.color }}
            >
              <h3 className="lp-h3" style={{ fontSize: "1.6rem" }}>{a.title}</h3>
              <ul className="mt-6 space-y-3.5 flex-1">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm font-medium">
                    <span className="mt-0.5 w-5 h-5 rounded-full grid place-items-center shrink-0" style={{ background: "rgba(255,255,255,.22)" }}><Check size={12} strokeWidth={3} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(signInPathFor(a.role))}
                className="lp-btn mt-8 w-full"
                style={{ background: a.role === "student" ? "var(--lp-green-deep)" : "var(--lp-yellow)", color: a.role === "student" ? "#fff" : "var(--lp-on-yellow)" }}
              >
                {a.cta}
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
