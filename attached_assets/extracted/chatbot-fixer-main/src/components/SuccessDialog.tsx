import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * Celebratory success modal with confetti — used after a successful payment
 * or transfer. Confetti is generated with GSAP, no extra deps.
 */
export const SuccessDialog = ({
  open,
  onOpenChange,
  title = "Payment succeeded!",
  description = "Your transaction was completed successfully. Thank you for your payment.",
  ctaLabel = "Go to your dashboard",
  onCta,
}: SuccessDialogProps) => {
  const confettiRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = confettiRef.current;
    if (!root) return;
    root.innerHTML = "";
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--accent))",
      "#22c55e",
      "#facc15",
      "#f472b6",
      "#60a5fa",
    ];
    const pieces: HTMLSpanElement[] = [];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("span");
      const size = 6 + Math.random() * 8;
      el.style.cssText = `position:absolute;left:50%;top:30%;width:${size}px;height:${size * (Math.random() > 0.5 ? 1 : 0.4)}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? "2px" : "50%"};transform:translate(-50%,-50%);pointer-events:none;`;
      root.appendChild(el);
      pieces.push(el);
    }
    gsap.set(checkRef.current, { scale: 0, opacity: 0 });
    gsap.to(checkRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" });
    pieces.forEach((p) => {
      gsap.to(p, {
        x: (Math.random() - 0.5) * 360,
        y: 200 + Math.random() * 200,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 1.4 + Math.random() * 1.2,
        ease: "power2.out",
      });
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-border/60">
        <div className="relative bg-card p-8 text-center">
          <div ref={confettiRef} className="pointer-events-none absolute inset-0 overflow-hidden" />
          <div className="relative">
            <div ref={checkRef} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 shadow-[0_0_40px_hsl(142_76%_45%/0.6)]">
              <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold">{title}</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
            <Button
              onClick={() => {
                onOpenChange(false);
                onCta?.();
              }}
              className="mt-6 bg-emerald-500 hover:bg-emerald-500/90 text-white px-8"
              size="lg"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
