import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Play } from "lucide-react";
import { HighlightWord, NotebookCard, PersonAvatar, Plus, Ring, SectionLabel, SkeletonLines, Sparkle } from "../Shared/index";
import { PATHS } from "../../routes/paths";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

/** First screen: headline with highlighted words, two calls to action and three notebook cards. */
const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-16 sm:pt-20 pb-16">
      {/* Floating decoration */}
      <Sparkle className="absolute left-[8%] top-[34%] lp-bob hidden md:block" size={34} />
      <Sparkle className="absolute right-[10%] top-[10%] lp-bob lp-bob--slow hidden md:block" size={30} color="var(--lp-green-mid)" />
      <Ring className="absolute left-[18%] top-[56%] hidden lg:block" />
      <Ring className="absolute right-[7%] top-[26%] hidden lg:block" size={26} color="var(--lp-yellow)" />
      <Plus className="absolute right-[22%] top-[58%] hidden lg:block" />

      <div className="lp-container relative text-center">
        <motion.div {...rise(0)}>
          <SectionLabel>Live online lessons for Nigerian families</SectionLabel>
        </motion.div>

        <motion.h1 id="hero-title" {...rise(0.1)} className="lp-h1 mt-6 mx-auto max-w-4xl">
          Learn big things,
          <br />
          without ever <HighlightWord>leaving home.</HighlightWord>
        </motion.h1>

        <motion.p {...rise(0.2)} className="lp-lead mt-6 mx-auto max-w-xl">
          Yare Height brings qualified teachers, live classes, homework and progress reports into one friendly place, so every child can keep growing at their own pace.
        </motion.p>

        <motion.div {...rise(0.3)} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate(PATHS.register)} className="lp-btn lp-btn--dark lp-btn--lg">Start learning</button>
          <a href="#how-it-works" className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--lp-ink)]">
            <span className="w-10 h-10 grid place-items-center rounded-full bg-[var(--lp-surface)] shadow-[0_6px_18px_-6px_rgba(45,55,25,.35)]">
              <Play size={14} fill="currentColor" />
            </span>
            See how it works
          </a>
        </motion.div>
      </div>

      {/* Notebook cards */}
      <div className="lp-container mt-14 sm:mt-16">
        <div className="grid gap-5 md:gap-6 md:grid-cols-[1.35fr_1fr_1.15fr]">
          <motion.div {...rise(0.4)}>
            <NotebookCard tone="green" title={<>Today’s<br />Classes</>}>
              <div className="flex items-center gap-3">
                <PersonAvatar variant={2} size={58} />
                <SkeletonLines widths={[88, 62]} className="flex-1" />
              </div>
              <ul className="mt-6 space-y-3 text-base font-medium">
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/60" /> Maths · 10:00 am</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/60" /> English · 12:30 pm</li>
              </ul>
              <SkeletonLines widths={[92, 70]} className="mt-6" />
            </NotebookCard>
          </motion.div>

          <motion.div {...rise(0.5)}>
            <NotebookCard tone="yellow" title={<>Homework<br />Tracker</>} rings>
              <ul className="space-y-4">
                {[true, true, false, false].map((done, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full grid place-items-center border-2 ${done ? "bg-[var(--lp-green-deep)] border-[var(--lp-green-deep)] text-white" : "border-[var(--lp-green-deep)]/40"}`}>
                      {done && <Check size={13} strokeWidth={3} />}
                    </span>
                    <SkeletonLines widths={[i % 2 ? 62 : 80]} className="flex-1" />
                  </li>
                ))}
              </ul>
            </NotebookCard>
          </motion.div>

          <motion.div {...rise(0.6)}>
            <NotebookCard tone="deep" title={<>Parent<br />Chat</>} rings>
              <div className="flex items-start gap-3">
                <PersonAvatar variant={4} size={44} />
                <div className="rounded-2xl rounded-tl-sm bg-white/12 px-4 py-3 text-sm flex-1">Great progress in reading today!</div>
              </div>
              <div className="flex items-start gap-3 mt-4 flex-row-reverse">
                <PersonAvatar variant={1} size={44} />
                <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm flex-1" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>Thank you, teacher!</div>
              </div>
              <div className="flex items-start gap-3 mt-4">
                <PersonAvatar variant={4} size={44} />
                <SkeletonLines widths={[78, 50]} className="flex-1 pt-3" />
              </div>
            </NotebookCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
