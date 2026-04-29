import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-[68px] items-center rounded-full border border-border/60 bg-secondary/40 backdrop-blur-md transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Sliding knob */}
      <span
        className={cn(
          "absolute top-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-md transition-transform duration-300 ease-out",
          isDark ? "translate-x-[32px]" : "translate-x-0",
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" strokeWidth={2.4} />
        ) : (
          <Sun className="h-3.5 w-3.5" strokeWidth={2.4} />
        )}
      </span>

      {/* Background icons (the inactive one shows in the rail) */}
      <span className="flex w-full items-center justify-between px-2">
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-opacity",
            isDark ? "text-muted-foreground/60 opacity-100" : "opacity-0",
          )}
          strokeWidth={2}
        />
        <Moon
          className={cn(
            "h-3.5 w-3.5 transition-opacity",
            isDark ? "opacity-0" : "text-muted-foreground/60 opacity-100",
          )}
          strokeWidth={2}
        />
      </span>
    </button>
  );
};
