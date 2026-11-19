import React from "react";

const LOOKS = [
  { skin: "#f2c29b", hair: "#3b2a1a", bg: "#fdf0b4", top: "#4b5a2a", style: "short" },
  { skin: "#8d5a3b", hair: "#1a1410", bg: "#e4e9d1", top: "#f6c915", style: "curly" },
  { skin: "#e9b48a", hair: "#a8641e", bg: "#fbe98f", top: "#2d3719", style: "long" },
  { skin: "#c68a5e", hair: "#241812", bg: "#cfd9b0", top: "#6b7d3a", style: "cap" },
  { skin: "#f6d3b3", hair: "#6b3f1d", bg: "#f1ecd6", top: "#f6c915", style: "bun" },
  { skin: "#6f432b", hair: "#120d0a", bg: "#fdf0b4", top: "#4b5a2a", style: "short" },
] as const;

/** Friendly flat illustrated face. `variant` 0–5 picks the look. Decorative only. */
const PersonAvatar: React.FC<{ variant?: number; size?: number; className?: string }> = ({ variant = 0, size = 56, className = "" }) => {
  const l = LOOKS[variant % LOOKS.length];
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" className={`rounded-full shrink-0 ${className}`}>
      <rect width="64" height="64" fill={l.bg} />
      <path d="M8 64c2-13 12-19 24-19s22 6 24 19z" fill={l.top} />
      <rect x="27" y="38" width="10" height="9" rx="4" fill={l.skin} />
      {(l.style === "long" || l.style === "bun") && <ellipse cx="32" cy="30" rx="17" ry="19" fill={l.hair} />}
      <ellipse cx="32" cy="29" rx="13" ry="14.5" fill={l.skin} />
      {l.style === "short" && <path d="M18 27c0-11 7-15 14-15s14 4 14 15c-4-6-9-8-14-8s-10 2-14 8z" fill={l.hair} />}
      {l.style === "curly" && (<><circle cx="21" cy="19" r="6" fill={l.hair} /><circle cx="32" cy="15" r="7" fill={l.hair} /><circle cx="43" cy="19" r="6" fill={l.hair} /></>)}
      {l.style === "long" && <path d="M18 28c0-11 6-16 14-16s14 5 14 16c-3-7-8-10-14-10s-11 3-14 10z" fill={l.hair} />}
      {l.style === "cap" && (<><path d="M18 24c1-9 8-12 14-12s13 3 14 12z" fill="#2d3719" /><rect x="14" y="23" width="26" height="4" rx="2" fill="#f6c915" /></>)}
      {l.style === "bun" && (<><circle cx="32" cy="9" r="6" fill={l.hair} /><path d="M19 27c0-9 6-13 13-13s13 4 13 13c-3-5-8-7-13-7s-10 2-13 7z" fill={l.hair} /></>)}
      <circle cx="27" cy="30" r="1.6" fill="#1d2414" />
      <circle cx="37" cy="30" r="1.6" fill="#1d2414" />
      <path d="M27.5 35.5c2.6 2.2 6.4 2.2 9 0" stroke="#1d2414" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
};

export default PersonAvatar;
