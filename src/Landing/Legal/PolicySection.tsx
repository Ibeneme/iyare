import React from "react";

interface Props { title: string; icon: React.ReactNode; children: React.ReactNode }

/** One numbered block of a legal page: yellow icon chip, heading, body. */
const PolicySection: React.FC<Props> = ({ title, icon, children }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-4">
      <span className="w-11 h-11 shrink-0 grid place-items-center rounded-2xl" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>{icon}</span>
      <h2 className="lp-h3">{title}</h2>
    </div>
    <div className="sm:pl-[3.75rem] lp-muted leading-relaxed">{children}</div>
  </section>
);

export default PolicySection;
