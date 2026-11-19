import React from "react";
import { Lock } from "lucide-react";

/** Small reassurance line under the plan cards. */
const PricingTrustNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-14 text-center text-sm lp-muted inline-flex items-center justify-center gap-2 w-full">
    <Lock className="w-4 h-4" style={{ color: "var(--lp-green-text)" }} /> {children}
  </p>
);

export default PricingTrustNote;
