import React from "react";
import { Loader2 } from "lucide-react";

/** Full-height spinner shown while prices and location load. */
const PricingLoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex-1 min-h-[60vh] grid place-items-center px-6" role="status" aria-live="polite">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "var(--lp-green-mid)" }} />
      <p className="lp-muted">{message}</p>
    </div>
  </div>
);

export default PricingLoadingScreen;
