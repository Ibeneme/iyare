import React from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "green" | "yellow" | "blue" | "sand" | "deep" | "plain";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

const FORCE_BLACK_TONES = new Set<Tone>(["green", "yellow", "blue"]);

/** Pastel bento tile for one number. */
const StatCard: React.FC<Props> = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "plain",
  className = "",
}) => {
  const forceBlack = FORCE_BLACK_TONES.has(tone);

  return (
    <div
      className={`stat-card stat-card--${tone} ${className}`.trim()}
      style={
        forceBlack
          ? ({
              color: "#000000",
              WebkitTextFillColor: "#000000",
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className="stat-label"
          style={forceBlack ? { color: "#000000", WebkitTextFillColor: "#000000" } : undefined}
        >
          {label}
        </p>
        {Icon && (
          <span
            className="stat-icon"
            style={forceBlack ? { color: "#000000", WebkitTextFillColor: "#000000" } : undefined}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <p
        className="stat-value mt-3"
        style={forceBlack ? { color: "#000000", WebkitTextFillColor: "#000000" } : undefined}
      >
        {value}
      </p>
      {hint && (
        <p
          className="text-xs mt-1 opacity-70"
          style={forceBlack ? { color: "#000000", WebkitTextFillColor: "#000000" } : undefined}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default StatCard;