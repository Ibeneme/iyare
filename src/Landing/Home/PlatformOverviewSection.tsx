import React from "react";
import { motion } from "framer-motion";
import { PersonAvatar, SectionLabel, SkeletonLines, Plus, Sparkle } from "../Shared/index";

const ITEMS = [
  { title: "Subjects", caption: "Every core subject, taught step by step", ring: "var(--lp-yellow)" },
  { title: "Live classes", caption: "Small groups, real teachers, real time", ring: "var(--lp-green)" },
  { title: "Homework", caption: "Set, submitted and marked in one place", ring: "var(--lp-green-deep)" },
  { title: "Progress", caption: "Clear monthly reports for parents", ring: "var(--lp-sand)" },
];

const ROWS = [
  { time: "09:00", subject: "Maths", avatar: 0 },
  { time: "11:00", subject: "English", avatar: 2, active: true },
  { time: "14:00", subject: "Science", avatar: 3 },
  { time: "16:00", subject: "Reading", avatar: 4 },
];

/** Split section: intro copy, a mock "school day" card, and a four-point list with ring bullets. */
const PlatformOverviewSection: React.FC = () => (
  <section id="how-it-works" aria-labelledby="overview-title" className="lp-section relative">
    <Plus className="absolute left-[4%] top-[70%] hidden lg:block" />
    <Sparkle className="absolute left-[40%] top-[24%] hidden lg:block" size={22} color="var(--lp-green-mid)" />
    <div className="lp-container grid gap-12 lg:grid-cols-[1fr_1.05fr_0.9fr] items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <SectionLabel dot>Learning with Yare Height</SectionLabel>
        <h2 id="overview-title" className="lp-h2 mt-5">
          Lessons
          <br />
          That Work.
        </h2>
        <p className="lp-lead mt-5 max-w-sm">
          Whether your child is catching up, keeping pace or racing ahead, Yare Height turns a spare corner at home into a well-run classroom.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="lp-card lp-card--yellow p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: "var(--lp-yellow-text)" }}>A day at Yare</span>
          <div className="flex -space-x-2">
            {[0, 3, 4].map((v) => (<PersonAvatar key={v} variant={v} size={30} className="ring-2 ring-[var(--lp-yellow-soft)]" />))}
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {ROWS.map((r) => (
            <li
              key={r.time}
              className="flex items-center gap-3 rounded-2xl px-3 py-3"
              style={r.active ? { background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" } : { background: "color-mix(in srgb, var(--lp-surface) 70%, transparent)" }}
            >
              <span className="text-xs font-semibold w-11 shrink-0">{r.time}</span>
              <PersonAvatar variant={r.avatar} size={30} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{r.subject}</p>
                {!r.active && <SkeletonLines widths={[60]} className="mt-1.5 [&>span]:!bg-[var(--lp-line)]" />}
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.ul initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
        {ITEMS.map((it) => (
          <li key={it.title} className="flex items-start gap-4">
            <span className="mt-1 w-6 h-6 rounded-full shrink-0 border-[3px]" style={{ borderColor: it.ring }} aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{it.title}</h3>
              <p className="mt-1 text-sm lp-muted flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.ring }} aria-hidden="true" />
                {it.caption}
              </p>
            </div>
          </li>
        ))}
      </motion.ul>
    </div>
  </section>
);

export default PlatformOverviewSection;
