import React from "react";

/** Placeholder text bars that make small UI mock-ups feel real. */
const SkeletonLines: React.FC<{ widths?: number[]; className?: string }> = ({ widths = [80, 55, 68], className = "" }) => (
  <div className={`flex flex-col gap-2.5 ${className}`} aria-hidden="true">
    {widths.map((w, i) => (<span key={i} className="lp-skeleton" style={{ width: `${w}%` }} />))}
  </div>
);

export default SkeletonLines;
