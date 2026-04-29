import { memo, useCallback, useEffect, useRef } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinPadProps {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  /**
   * Fired when the PIN reaches `length`. When `requireConfirm` is true,
   * onComplete is NOT fired automatically — the parent must call it after
   * the user presses OK.
   */
  onComplete?: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Visually hide entered digits (●). Default true. */
  mask?: boolean;
  /**
   * If true, the PIN is NOT auto-submitted when full. Use the OK button
   * exposed via the parent (or set this to true and listen via onComplete).
   * Default false to preserve old behavior elsewhere.
   */
  requireConfirm?: boolean;
  className?: string;
}

/**
 * Numeric PIN keypad. Memoized so parent re-renders during PIN entry don't
 * re-render every key — eliminates the input "lag" reported on the dialog.
 */
const PinPadInner = ({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
  mask = true,
  requireConfirm = false,
  className,
}: PinPadProps) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  // Hardware keyboard support without rendering a hidden input that re-mounts
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        if (valueRef.current.length < length) onChange(valueRef.current + e.key);
        e.preventDefault();
      } else if (e.key === "Backspace") {
        if (valueRef.current.length > 0) onChange(valueRef.current.slice(0, -1));
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (valueRef.current.length === length && onComplete) onComplete(valueRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, length, onChange, onComplete]);

  // Auto-fire complete only when not requiring an explicit OK press
  useEffect(() => {
    if (requireConfirm) return;
    if (value.length === length && onComplete) onComplete(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, requireConfirm]);

  const press = useCallback(
    (d: string) => {
      if (disabled) return;
      const v = valueRef.current;
      if (v.length >= length) return;
      onChange(v + d);
    },
    [disabled, length, onChange],
  );
  const back = useCallback(() => {
    if (disabled) return;
    const v = valueRef.current;
    if (v.length === 0) return;
    onChange(v.slice(0, -1));
  }, [disabled, onChange]);

  return (
    <div className={cn("w-full max-w-xs mx-auto select-none", className)}>
      {/* Dots */}
      <div className="flex justify-center gap-3 mb-8 w-full" aria-label="PIN entry" role="status">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border-2 transition-all duration-150 will-change-transform",
                filled
                  ? "bg-primary border-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)] scale-110"
                  : "border-border bg-secondary/40",
                !mask && filled && "bg-primary text-primary-foreground",
              )}
            >
              {!mask && filled && <span className="sr-only">{value[i]}</span>}
            </span>
          );
        })}
      </div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => press(String(n))}
            className="aspect-square rounded-2xl bg-secondary/60 hover:bg-secondary text-2xl font-semibold transition-colors duration-100 active:scale-95 disabled:opacity-50 border border-border/40 backdrop-blur-sm touch-manipulation"
          >
            {n}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className="aspect-square rounded-2xl bg-secondary/60 hover:bg-secondary text-2xl font-semibold transition-colors duration-100 active:scale-95 disabled:opacity-50 border border-border/40 touch-manipulation"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={back}
          aria-label="Backspace"
          className="aspect-square rounded-2xl bg-secondary/30 hover:bg-secondary/60 grid place-items-center transition-colors duration-100 active:scale-95 disabled:opacity-30 border border-border/40 touch-manipulation"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

// Memoize so parent state changes don't repaint every key
export const PinPad = memo(PinPadInner, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.disabled === next.disabled &&
    prev.length === next.length &&
    prev.mask === next.mask &&
    prev.requireConfirm === next.requireConfirm &&
    prev.onChange === next.onChange &&
    prev.onComplete === next.onComplete
  );
});
