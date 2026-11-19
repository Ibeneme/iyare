import React, { useEffect } from "react";
import { pulseBusy, useBusy, markClick } from "../../lib/loading";

const INTERACTIVE = "a[href], button, [role=button], [role=tab], summary";
const SKIP = "[data-no-loader], .select-popup, .picker-popup, input, textarea, select, .select-trigger";

/**
 * Full-screen loader for the content area. The sidebar stays visible and clickable because the
 * overlay starts to its right (and below the mobile top bar). Mounted once in AppLayout.
 */
const BusyOverlay: React.FC = () => {
  const busy = useBusy();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest?.(INTERACTIVE) || el.closest?.(SKIP)) return;
      if ((el.closest("button") as HTMLButtonElement | null)?.disabled) return;
      markClick();
      pulseBusy(450);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!busy) return null;
  return (
    <div className="busy-overlay" role="status" aria-live="polite" aria-label="Loading">
      <div className="busy-spinner" />
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default BusyOverlay;
