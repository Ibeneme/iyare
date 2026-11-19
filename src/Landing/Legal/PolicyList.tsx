import React from "react";

/** Bulleted list with small army-green dots. */
const PolicyList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3">
        <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "var(--lp-green)" }} aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default PolicyList;
