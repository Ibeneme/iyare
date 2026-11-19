import React from "react";

/** Round brand badge: army-green circle with a yellow graduation cap. */
const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => (
  <span
    className={`inline-grid place-items-center rounded-full shrink-0 ${className}`}
    style={{ width: size, height: size, background: "var(--lp-green)" }}
    aria-hidden="true"
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 1.5 8.5 12 14l8.5-4.45V16" stroke="#f6c915" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11.5v4.2c0 1.4 2.7 3.3 6 3.3s6-1.9 6-3.3v-4.2" stroke="#f6c915" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export default LogoMark;
