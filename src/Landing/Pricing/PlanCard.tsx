import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";

interface Props {
  index: number;
  name: string;
  duration: string;
  priceText: string;
  originalText?: string;
  savingsText?: string;
  priceNote?: string;
  features: string[];
  popular?: boolean;
  buttonLabel: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** One pricing tile. The popular plan is army green; the others are white. */
const PlanCard: React.FC<Props> = ({
  index, name, duration, priceText, originalText, savingsText, priceNote, features, popular, buttonLabel, disabled, onSelect,
}) => {
  const onGreen = Boolean(popular);
  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.55 }}
      className={`relative flex flex-col rounded-[1.75rem] p-7 sm:p-8 ${popular ? "md:-mt-4 md:mb-4" : "lp-card"}`}
      style={popular ? { background: "var(--lp-green)", color: "var(--lp-on-green)" } : undefined}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>
          <Sparkles className="w-3.5 h-3.5" /> Most popular
        </span>
      )}

      <header>
        <h3 className="lp-h3" style={{ fontSize: "1.5rem" }}>{name}</h3>
        <p className={`text-sm mt-1 ${onGreen ? "opacity-80" : "lp-muted"}`}>{duration}</p>
      </header>

      <div className="mt-6">
        {savingsText && originalText && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`line-through text-lg ${onGreen ? "opacity-70" : "lp-muted"}`}>{originalText}</span>
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>
              You save {savingsText}
            </span>
          </div>
        )}
        <div className="text-4xl sm:text-5xl font-semibold tracking-tight mt-2">{priceText}</div>
        {priceNote && <p className={`text-sm mt-1 ${onGreen ? "opacity-80" : "lp-muted"}`}>{priceNote}</p>}
      </div>

      <ul className="mt-7 space-y-3.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm leading-relaxed">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full grid place-items-center"
              style={{ background: onGreen ? "var(--lp-yellow)" : "var(--lp-green-soft)", color: onGreen ? "var(--lp-on-yellow)" : "var(--lp-green-text)" }}>
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span className={onGreen ? "opacity-95" : ""}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={disabled}
        className={`lp-btn lp-btn--lg w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed ${popular ? "lp-btn--yellow" : "lp-btn--dark"}`}
      >
        {buttonLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </motion.article>
  );
};

export default PlanCard;
