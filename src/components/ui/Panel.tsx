import React from "react";

interface Props {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** "binder" draws the ring-binder holes from the landing hero cards. */
  variant?: "plain" | "binder";
  className?: string;
  children: React.ReactNode;
}

/** The standard white content card (optionally with ring-binder holes). */
const Panel: React.FC<Props> = ({ title, subtitle, actions, variant = "plain", className = "", children }) => (
  <section className={`panel ${variant === "binder" ? "panel--binder" : ""} ${className}`}>
    {variant === "binder" && [0.18, 0.4, 0.62, 0.84].map((p) => <span key={p} className="panel-ring" style={{ top: `${p * 100}%` }} aria-hidden="true" />)}
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </section>
);

export default Panel;
