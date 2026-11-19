import React from "react";
import type { LucideIcon } from "lucide-react";

const EmptyState: React.FC<{ icon?: LucideIcon; title: string; text?: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="empty-state">
    {Icon && (
      <span className="empty-icon">
        <Icon size={22} />
      </span>
    )}
    <p className="font-semibold text-[var(--color-primary)]">{title}</p>
    {text && <p className="text-sm text-[var(--color-muted)] max-w-sm">{text}</p>}
    {action}
  </div>
);

export default EmptyState;
