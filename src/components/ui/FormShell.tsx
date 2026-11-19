import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "./PageHeader";
import Panel from "./Panel";

/** Shell for dedicated create/edit pages: back link, landing-style heading, one binder card. */
const FormShell: React.FC<{ backTo: string; backLabel: string; eyebrow?: string; title: string; highlight?: string; subtitle?: string; children: React.ReactNode }> = ({ backTo, backLabel, eyebrow, title, highlight, subtitle, children }) => (
  <div className="page !max-w-3xl">
    <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft size={16} /> {backLabel}</Link>
    <PageHeader eyebrow={eyebrow} title={title} highlight={highlight} subtitle={subtitle} />
    <Panel variant="binder">{children}</Panel>
  </div>
);
export default FormShell;
