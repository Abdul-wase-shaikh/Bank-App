import { useRef, useState } from "react";
import { Eye, EyeOff, Wifi, ShieldCheck, Copy, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { gsap } from "gsap";
import { formatCurrency } from "@/lib/format";

type Props = {
  holderName: string;
  accountNumber: string;
  balance: number;
  currency?: string;
  createdAt?: string;
};

const deriveCardNumber = (acct: string) => {
  const digits = (acct || "").replace(/\D/g, "").padStart(10, "0");
  const seed = digits.slice(-10);
  const base = ("4242" + seed + "00000000").slice(0, 15);
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(base[14 - i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
};

const deriveCvv = (acct: string) => {
  const digits = (acct || "").replace(/\D/g, "");
  const n = digits ? parseInt(digits.slice(-4), 10) : 0;
  return String(((n * 73) % 900) + 100);
};

const deriveExpiry = (createdAt?: string) => {
  const d = createdAt ? new Date(createdAt) : new Date();
  const exp = new Date(d.getFullYear() + 5, d.getMonth(), 1);
  const mm = String(exp.getMonth() + 1).padStart(2, "0");
  const yy = String(exp.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
};

export const DigitalCard = ({ holderName, accountNumber, balance, currency = "INR", createdAt }: Props) => {
  const [show, setShow] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const card = deriveCardNumber(accountNumber);
  const cvv = deriveCvv(accountNumber);
  const exp = deriveExpiry(createdAt);
  const groups = card.match(/.{1,4}/g) ?? [];
  const masked = groups.map((g, i) => (i === 0 || i === 3 ? g : "••••"));

  const copy = async (e: React.MouseEvent, value: string, label: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 30 + (flipped ? 180 : 0);
    const rotateX = (0.5 - py) * 20;
    gsap.to(el, {
      rotationX: rotateX,
      rotationY: rotateY,
      scale: 1.04,
      duration: 0.4,
      ease: "power3.out",
      transformPerspective: 1000,
      transformOrigin: "center",
      overwrite: "auto",
    });
  };

  const handleLeave = () => {
    const el = innerRef.current;
    if (!el) return;
    gsap.to(el, {
      rotationX: 0,
      rotationY: flipped ? 180 : 0,
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    const el = innerRef.current;
    if (el) {
      gsap.to(el, { rotationY: next ? 180 : 0, rotationX: 0, scale: 1, duration: 0.9, ease: "power3.inOut", overwrite: "auto" });
    }
  };

  return (
    <div className="card-3d-wrap w-full max-w-md" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div
        ref={innerRef}
        onClick={handleFlip}
        className="relative aspect-[1.6/1] w-full cursor-pointer card-spin card-hue"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-border/60 shadow-2xl text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(var(--accent) / 0.85) 60%, hsl(var(--background)))",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />

          <div className="relative h-full p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-display text-sm tracking-[0.25em] uppercase">Smart Bank</span>
              </div>
              <Wifi className="h-5 w-5 rotate-90 opacity-90" />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-accent to-primary/70 shadow-inner" />
              <button
                onClick={(e) => { e.stopPropagation(); setShow(s => !s); }}
                className="ml-auto text-xs flex items-center gap-1 opacity-90 hover:opacity-100"
              >
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {show ? "Hide" : "Show"}
              </button>
              <button
                onClick={(e) => copy(e, card, "Card number")}
                className="text-xs flex items-center gap-1 opacity-90 hover:opacity-100"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>

            <div className="font-mono text-lg md:text-xl tracking-[0.2em] flex justify-between">
              {(show ? groups : masked).map((g, i) => <span key={i}>{g}</span>)}
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest opacity-70">Cardholder</div>
                <div className="font-semibold truncate uppercase">{holderName || "Card Holder"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Expires</div>
                <div className="font-mono">{exp}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest opacity-70">Balance</div>
                <div className="font-display font-bold">{formatCurrency(balance, currency)}</div>
              </div>
            </div>
          </div>

          <div className="absolute top-5 right-5 mt-6 font-display italic text-xl tracking-tight opacity-95">VISA</div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-border/60 shadow-2xl text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--accent) / 0.85) 40%, hsl(var(--primary) / 0.95))",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />

          {/* Magnetic stripe */}
          <div className="absolute top-6 left-0 right-0 h-10 bg-black/80" />

          <div className="relative h-full p-5 flex flex-col justify-between pt-20">
            {/* Chip detail */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 rounded-md shadow-inner relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(45 95% 65%), hsl(38 90% 45%) 50%, hsl(35 80% 30%))" }}>
                <div className="absolute inset-1 grid grid-cols-3 grid-rows-3 gap-[1px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-[1px]" style={{ background: "hsl(30 60% 20% / 0.4)" }} />
                  ))}
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest opacity-80">EMV Chip · Contactless</div>
            </div>

            {/* CVV strip */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-white/90 rounded-sm flex items-center justify-end px-3">
                <span className="font-mono text-foreground text-base tracking-[0.3em]">{cvv}</span>
              </div>
              <button
                onClick={(e) => copy(e, cvv, "CVV")}
                className="text-xs flex items-center gap-1 opacity-90 hover:opacity-100"
              >
                <Copy className="h-3.5 w-3.5" /> CVV
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70">Card Number</div>
                  <div className="font-mono text-sm md:text-base tracking-[0.2em]">{groups.join(" ")}</div>
                </div>
                <button
                  onClick={(e) => copy(e, card, "Card number")}
                  className="text-xs flex items-center gap-1 opacity-90 hover:opacity-100"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-end justify-between gap-4 pt-1">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest opacity-70">Account</div>
                  <div className="font-mono text-xs truncate">{accountNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70">Expires</div>
                  <div className="font-mono">{exp}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                  className="text-xs flex items-center gap-1 opacity-90 hover:opacity-100"
                  aria-label="Flip card"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Front
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
