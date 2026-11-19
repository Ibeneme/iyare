import React from "react";

const SKIN = ["#f6d5b8", "#e8b98d", "#c98f63", "#8d5a3b", "#fbe3cf"];
const BG = ["#f6c915", "#b9c77f", "#fdf0b4", "#e4e9d1", "#d9c9a3", "#9fb25a"];
const HAIR = ["#2d3719", "#4a3426", "#1d1d1d", "#7a4b1e", "#c98f1b", "#5b6b2e"];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Drawn-in-code cartoon face, deterministic per person (same name → same face). */
const Cartoon: React.FC<{ seed: string; size: number }> = ({ seed, size }) => {
  const h = hash(seed || "user");
  const skin = SKIN[h % SKIN.length], bg = BG[(h >>> 3) % BG.length], hair = HAIR[(h >>> 6) % HAIR.length];
  const style = (h >>> 9) % 4, mouth = (h >>> 11) % 3, glasses = (h >>> 13) % 3 === 0;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true" style={{ display: "block" }}>
      <rect width="64" height="64" fill={bg} />
      <path d="M8 64c2-14 12-18 24-18s22 4 24 18z" fill={hair === "#2d3719" ? "#4b5a2a" : "#2d3719"} />
      <rect x="27" y="40" width="10" height="9" rx="3" fill={skin} />
      {style === 0 && <circle cx="32" cy="25" r="17" fill={hair} />}
      {style === 1 && <path d="M13 28c0-14 8-19 19-19s19 5 19 19c-4-8-10-10-19-10s-15 2-19 10z" fill={hair} />}
      {style === 2 && <><circle cx="17" cy="20" r="7" fill={hair} /><circle cx="47" cy="20" r="7" fill={hair} /></>}
      <ellipse cx="32" cy="30" rx="13" ry="14.5" fill={skin} />
      {style === 3 && <path d="M18 27c2-12 26-12 28 0-6-5-22-5-28 0z" fill={hair} />}
      {style === 1 && <path d="M19 25c3-7 23-7 26 0-7-3-19-3-26 0z" fill={hair} />}
      <circle cx="26.5" cy="30" r="1.8" fill="#1d2414" /><circle cx="37.5" cy="30" r="1.8" fill="#1d2414" />
      {glasses && <g fill="none" stroke="#1d2414" strokeWidth="1.3"><circle cx="26.5" cy="30" r="4.5" /><circle cx="37.5" cy="30" r="4.5" /><path d="M31 30h2" /></g>}
      {mouth === 0 && <path d="M27 37c3 3 7 3 10 0" stroke="#1d2414" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      {mouth === 1 && <path d="M27 36.5c3 4.5 7 4.5 10 0z" fill="#8a2f2f" />}
      {mouth === 2 && <path d="M28 37.5h8" stroke="#1d2414" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
};

interface Props {
  name?: string;
  email?: string;
  /** Uploaded picture URL; when missing (or broken) the cartoon fallback is drawn. */
  src?: string | null;
  size?: number;
  className?: string;
}

/** Every place that shows a person uses this: photo if there is one, otherwise a cartoon face. */
const Avatar: React.FC<Props> = ({ name, email, src, size = 40, className = "" }) => {
  const [broken, setBroken] = React.useState(false);
  const seed = `${name || ""}${email || ""}`;
  return (
    <span className={`inline-block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }} title={name}>
      {src && !broken ? <img src={src} alt={name ? `${name}'s photo` : ""} width={size} height={size} className="h-full w-full object-cover" onError={() => setBroken(true)} /> : <Cartoon seed={seed} size={size} />}
    </span>
  );
};

export default Avatar;
