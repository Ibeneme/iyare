import React from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  /** Defaults to document.body. Pass a different node (e.g. a dedicated tooltip layer) if needed. */
  container?: Element | null;
}

/**
 * Single shared createPortal wrapper. Everything that needs to escape its parent's overflow/
 * z-index stacking — confirmation dialogs, tooltips — renders through this one component so
 * there's exactly one place that touches document.body.
 */
const Portal: React.FC<PortalProps> = ({ children, container }) => {
  const target = container ?? (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;
  return createPortal(children, target);
};

export default Portal;
