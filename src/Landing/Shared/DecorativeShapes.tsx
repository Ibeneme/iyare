import React from "react";

type ShapeProps = { size?: number; color?: string; className?: string; style?: React.CSSProperties };

/** Six-armed asterisk. */
export const Sparkle: React.FC<ShapeProps> = ({ size = 28, color = "var(--lp-yellow)", className = "", style }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round">
    <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
  </svg>
);

/** Concentric ring. */
export const Ring: React.FC<ShapeProps> = ({ size = 34, color = "var(--lp-green-mid)", className = "", style }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 34 34" className={className} style={style} fill="none" stroke={color} strokeWidth="1.8">
    <circle cx="17" cy="17" r="15" /><circle cx="17" cy="17" r="7" />
  </svg>
);

/** Plus sign. */
export const Plus: React.FC<ShapeProps> = ({ size = 18, color = "var(--lp-green-mid)", className = "", style }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 18 18" className={className} style={style} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <path d="M9 2v14M2 9h14" />
  </svg>
);

/** Little squiggle underline. */
export const Squiggle: React.FC<ShapeProps> = ({ size = 90, color = "var(--lp-yellow)", className = "", style }) => (
  <svg aria-hidden="true" width={size} height={size * 0.16} viewBox="0 0 90 14" className={className} style={style} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round">
    <path d="M3 8c8-8 12 8 20 0s12 8 20 0 12 8 20 0 12 8 21 0" />
  </svg>
);

/** Soft dot-pair accent. */
export const Dots: React.FC<ShapeProps> = ({ size = 26, color = "var(--lp-green-mid)", className = "", style }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 26 26" className={className} style={style} fill={color}>
    <circle cx="6" cy="6" r="3" /><circle cx="20" cy="13" r="3" /><circle cx="8" cy="20" r="3" />
  </svg>
);
