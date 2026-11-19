import { useEffect, useState } from "react";

/**
 * Page-level loader used by older pages: same overlay as the app-wide one (content area only,
 * the sidebar stays visible and usable). Gives up after 12 seconds so it can never stay forever.
 */
const Loader = () => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 12000);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="busy-overlay">
      <div className="busy-spinner" />
    </div>
  );
};

export default Loader;
