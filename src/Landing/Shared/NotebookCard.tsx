import React from "react";

interface Props {
  tone: "green" | "yellow" | "deep";
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Draw ring-binder holes on the left edge (use on the 2nd and 3rd card). */
  rings?: boolean;
  className?: string;
}

/** Colourful card with a ring-binder edge, used in the hero. */
const NotebookCard: React.FC<Props> = ({ tone, title, children, rings = false, className = "" }) => (
  <article className={`lp-notebook lp-notebook--${tone} ${className}`}>
    {rings && [0.2, 0.4, 0.6, 0.8].map((p) => (
      <span key={p} className="lp-ring" style={{ top: `${p * 100}%` }} aria-hidden="true" />
    ))}
    <h3 className="lp-h3" style={{ fontSize: "1.55rem", lineHeight: 1.15 }}>{title}</h3>
    <div className="mt-5">{children}</div>
  </article>
);

export default NotebookCard;
