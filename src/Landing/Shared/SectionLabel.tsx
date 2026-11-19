import React from "react";

interface Props { children: React.ReactNode; tone?: "yellow" | "green"; dot?: boolean; className?: string }

/** Small tinted pill that sits above a section heading. */
const SectionLabel: React.FC<Props> = ({ children, tone = "yellow", dot = false, className = "" }) => (
  <span className={`lp-label ${tone === "green" ? "lp-label--green" : ""} ${dot ? "lp-label--dot" : ""} ${className}`}>
    {children}
  </span>
);

export default SectionLabel;
