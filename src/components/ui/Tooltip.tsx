import React, { useRef, useState, useLayoutEffect } from "react";
import Portal from "../common/Portal";
import "./Tooltip.css";

interface TooltipProps {
  label: React.ReactNode;
  children: React.ReactElement;
  placement?: "top" | "bottom";
}

/**
 * Reuses the same Portal primitive as ConfirmModal, so the tip escapes any clipped/overflow
 * ancestor (table cells, cards) instead of getting cut off. Positions itself off the
 * trigger's bounding rect rather than relying on CSS :hover + absolute positioning.
 */
const Tooltip: React.FC<TooltipProps> = ({ label, children, placement = "top" }) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      left: rect.left + rect.width / 2,
      top: placement === "top" ? rect.top : rect.bottom,
    });
  }, [open, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      {open && (
        <Portal>
          <div
            className={`tip-bubble tip-${placement}`}
            style={{ top: coords.top, left: coords.left }}
            role="tooltip"
          >
            {label}
          </div>
        </Portal>
      )}
    </>
  );
};

export default Tooltip;
