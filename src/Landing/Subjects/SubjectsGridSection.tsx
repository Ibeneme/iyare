import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Beaker, Brain, Calculator, Code2, Globe2, Star } from "lucide-react";
import { PATHS } from "../../routes/paths";

interface SubjectCategory {
  title: string;
  items: string[];
  description: string;
  icon: React.ReactNode;
  tone: string;
}

const subjects: SubjectCategory[] = [
  {
    title: "Core Subjects",
    items: ["Mathematics", "English Language"],
    description: "The base of every exam. Master these and WAEC and JAMB feel far less scary.",
    icon: <Calculator className="w-7 h-7" />,
    tone: "lp-card--soft",
  },
  {
    title: "Reasoning & Logic",
    items: ["Non-Verbal Reasoning", "Verbal Reasoning"],
    description: "Sharpen your thinking and breeze through aptitude tests.",
    icon: <Brain className="w-7 h-7" />,
    tone: "lp-card--yellow",
  },
  {
    title: "Languages",
    items: ["English", "French", "Igbo", "Yoruba", "Hausa"],
    description: "Speak and write the languages that matter to you, and score top marks in them.",
    icon: <Globe2 className="w-7 h-7" />,
    tone: "lp-card--sand",
  },
  {
    title: "Science",
    items: ["Physics", "Chemistry", "Biology"],
    description: "Make sense of the world around you and get ahead in STEM.",
    icon: <Beaker className="w-7 h-7" />,
    tone: "lp-card--soft",
  },
  {
    title: "Digital Skills",
    items: ["UI/UX Design", "Frontend Web Dev", "Python Basics"],
    description: "Learn to code and design today, and open doors to a global career.",
    icon: <Code2 className="w-7 h-7" />,
    tone: "lp-card--yellow",
  },
];

/** One card per subject group, each with its subjects and a Start learning link. */
const SubjectsGridSection: React.FC = () => (
  <section aria-labelledby="subjects-grid-title" className="pb-8">
    <h2 id="subjects-grid-title" className="sr-only">Subject groups</h2>
    <div className="lp-container grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((s, i) => (
        <motion.article
          key={s.title}
          initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.1 }}
          className={`group lp-card ${s.tone} p-7 flex flex-col`}
        >
          <div className="flex items-center justify-between">
            <span className="w-14 h-14 grid place-items-center rounded-2xl" style={{ background: "var(--lp-green)", color: "var(--lp-on-green)" }}>{s.icon}</span>
            <span className="flex gap-0.5" aria-label="Rated five stars">
              {[...Array(5)].map((_, k) => (<Star key={k} className="w-4 h-4" style={{ fill: "var(--lp-yellow)", color: "var(--lp-yellow)" }} />))}
            </span>
          </div>

          <h3 className="lp-h3 mt-6" style={{ fontSize: "1.55rem" }}>{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed lp-muted">{s.description}</p>

          <ul className="mt-5 space-y-2 flex-1">
            {s.items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--lp-green)" }} /> {item}
              </li>
            ))}
          </ul>

          <Link to={PATHS.pricing} className="lp-btn lp-btn--dark mt-7 self-start">
            Start learning <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.article>
      ))}
    </div>
  </section>
);

export default SubjectsGridSection;
