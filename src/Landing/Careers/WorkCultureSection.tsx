import React from "react";
import { BookOpen, Sparkles } from "lucide-react";

const PERKS = [
  "Remote-first, with hubs in Lagos and Abuja",
  "Unlimited time off plus parental leave",
  "₦500k a year to spend on learning",
  "Equity for every full-time hire",
];

/** What it is like to work here. */
const WorkCultureSection: React.FC = () => (
  <section aria-labelledby="culture-title" className="lp-section pt-0">
    <div className="lp-container">
      <div className="rounded-[2rem] p-8 md:p-14 grid md:grid-cols-2 gap-10 items-center" style={{ background: "var(--lp-green-deep)", color: "#fff" }}>
        <div>
          <h2 id="culture-title" className="lp-h2">How we work</h2>
          <p className="mt-4 text-lg text-white/85">
            We care about <strong style={{ color: "var(--lp-yellow)" }}>impact, not hours</strong>. You’ll work alongside sharp, kind people who want better schooling for Africa.
          </p>
          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3"><Sparkles size={18} style={{ color: "var(--lp-yellow)" }} className="shrink-0" /> {p}</li>
            ))}
          </ul>
        </div>
        <figure className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,.08)" }}>
          <BookOpen size={52} style={{ color: "var(--lp-yellow)" }} />
          <blockquote className="mt-4 text-2xl font-semibold leading-snug">“We don’t only teach. We change lives.”</blockquote>
          <figcaption className="mt-3 text-sm text-white/70">The Yare Height Learning Hub team</figcaption>
        </figure>
      </div>
    </div>
  </section>
);

export default WorkCultureSection;
