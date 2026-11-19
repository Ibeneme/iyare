import React from "react";

/** Word(s) on a solid, slightly tilted colour block — the signature headline accent. */
const HighlightWord: React.FC<{ children: React.ReactNode; tone?: "green" | "yellow" }> = ({ children, tone = "green" }) => (
  <span className={`lp-highlight ${tone === "yellow" ? "lp-highlight--yellow" : ""}`}>{children}</span>
);

export default HighlightWord;
