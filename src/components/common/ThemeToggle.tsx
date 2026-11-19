import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "", size = "md" }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-300 cursor-pointer
        ${size === "sm" ? "w-10 h-5" : "w-12 h-6"}
        ${isDark ? "bg-[var(--color-brand)]" : "bg-[var(--color-surface-alt)]"}
        ${className}
      `}
    >
      <span
        className={`
          absolute flex items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300
          ${size === "sm" ? "w-4 h-4" : "w-5 h-5"}
          ${isDark
            ? size === "sm" ? "translate-x-5" : "translate-x-6"
            : "translate-x-0.5"
          }
        `}
      >
        {isDark
          ? <Moon size={size === "sm" ? 9 : 11} className="text-[var(--color-brand)]" />
          : <Sun size={size === "sm" ? 9 : 11} className="text-[var(--color-warning)]" />}
      </span>
      <span className="sr-only">{theme} mode active</span>
    </button>
  );
};

export default ThemeToggle;
