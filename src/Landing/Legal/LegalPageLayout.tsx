import React from "react";
import { HighlightWord, Plus, Ring, SectionLabel, Sparkle } from "../Shared/index";

interface Props {
  label: string;
  icon: React.ReactNode;
  titleLead: string;
  titleHighlight: string;
  intro: string;
  footnote: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for legal pages: label, headline with highlight, white content card, small footnote. */
const LegalPageLayout: React.FC<Props> = ({ label, icon, titleLead, titleHighlight, intro, footnote, children }) => (
  <main className="lp-section overflow-hidden">
    <div className="lp-container max-w-4xl relative">
      <Sparkle className="absolute left-0 top-2 lp-bob hidden md:block" size={28} />
      <Ring className="absolute right-0 top-10 hidden md:block" size={28} />
      <Plus className="absolute right-[12%] top-[7.5rem] hidden lg:block" />

      <header className="text-center mb-14 relative">
        <SectionLabel>{icon}{label}</SectionLabel>
        <h1 className="lp-h1 mt-6" style={{ fontSize: "clamp(2.3rem, 6vw, 4rem)" }}>
          {titleLead} <HighlightWord>{titleHighlight}</HighlightWord>
        </h1>
        <p className="lp-lead mt-5 mx-auto max-w-xl">{intro}</p>
      </header>

      <div className="lp-card p-6 sm:p-10 space-y-10">{children}</div>

      <p className="text-center mt-10 text-sm lp-muted">{footnote}</p>
    </div>
  </main>
);

export default LegalPageLayout;
