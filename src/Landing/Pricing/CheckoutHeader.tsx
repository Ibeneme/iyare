import React from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "../Shared/index";

/** Slim brand bar for pages that have no main navbar (payment steps). */
const CheckoutHeader: React.FC = () => (
  <header className="lp-container py-5 flex items-center justify-between">
    <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Yare Height home">
      <LogoMark size={40} />
      <span>Yare Height</span>
    </Link>
    <Link to="/pricing" className="lp-btn lp-btn--ghost">Back to plans</Link>
  </header>
);

export default CheckoutHeader;
