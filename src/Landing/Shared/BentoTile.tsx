import React from "react";

interface Props {
  tone: "green" | "yellow" | "sand" | "mint";
  className?: string;
  children: React.ReactNode;
}

/** Pastel rounded tile for the feature grid. */
const BentoTile: React.FC<Props> = ({ tone, className = "", children }) => (
  <div className={`lp-tile lp-tile--${tone} ${className}`}>{children}</div>
);

export default BentoTile;
