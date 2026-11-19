import React from "react";

interface Props {
  /** Small pill above the title, e.g. "Admin" or "This week". */
  eyebrow?: string;
  title: string;
  /** One word of the title to show as a highlighted block (landing style). */
  highlight?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Page title block shared by every signed-in page (same look as the landing headings). */
const PageHeader: React.FC<Props> = ({ eyebrow, title, highlight, subtitle, actions }) => {
  const parts = highlight && title.includes(highlight) ? title.split(highlight) : null;
  return (
    <header className="page-header">
      <div className="min-w-0">
        {eyebrow && <span className="pill pill--green mb-3">{eyebrow}</span>}
        <h1 className="page-title">
          {parts ? (
            <>
              {parts[0]}
              <span className="hl">{highlight}</span>
              {parts.slice(1).join(highlight)}
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
};

export default PageHeader;
