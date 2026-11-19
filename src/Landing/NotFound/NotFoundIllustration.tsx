import React from "react";
import { PersonAvatar, Ring, Sparkle } from "../Shared/index";

/** A big "404" in army green with a yellow zero, a confused avatar and floating shapes. */
const NotFoundIllustration: React.FC = () => (
  <div className="relative mx-auto w-fit select-none" aria-hidden="true">
    <Sparkle className="absolute -left-8 top-2 lp-bob" size={34} />
    <Ring className="absolute -right-10 top-10" size={30} color="var(--lp-yellow)" />
    <div className="flex items-center justify-center gap-2 sm:gap-4 font-semibold tracking-tighter leading-none" style={{ fontSize: "clamp(6rem, 24vw, 12rem)" }}>
      <span style={{ color: "var(--lp-green-text)" }}>4</span>
      <span className="grid place-items-center rounded-full overflow-hidden" style={{ width: "0.78em", height: "0.78em", background: "var(--lp-yellow)" }}>
        <PersonAvatar variant={3} size={96} className="w-[70%] h-[70%]" />
      </span>
      <span style={{ color: "var(--lp-green-text)" }}>4</span>
    </div>
  </div>
);

export default NotFoundIllustration;
