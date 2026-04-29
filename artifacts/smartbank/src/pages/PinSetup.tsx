import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PinPad } from "@/components/PinPad";
import { pinApi } from "@/lib/secureLogin";
import { useAuth } from "@/hooks/useAuth";
import { usePinSession } from "@/hooks/usePinSession";

type Step = "create" | "confirm" | "current";

export default function PinSetup() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { unlock } = usePinSession();
  const [hasExisting, setHasExisting] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("create");
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/login"); return; }
    pinApi.status().then(({ data }) => {
      const exists = !!data?.hasPin;
      setHasExisting(exists);
      if (exists) setStep("current");
    });
  }, [user, authLoading, nav]);

  const submit = async (finalConfirm: string) => {
    setSubmitting(true);
    const { error } = await pinApi.set(pin, finalConfirm, hasExisting ? currentPin : undefined);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      // reset to start
      setPin(""); setConfirm(""); setCurrentPin("");
      setStep(hasExisting ? "current" : "create");
      return;
    }
    toast.success("PIN saved successfully");
    unlock();
    nav("/biometric-setup", { replace: true });
  };

  if (authLoading || hasExisting === null) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-10 sm:py-16 grid place-items-center">
      <div className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
          Smart<span className="text-gradient">Bank</span>
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl">
          {hasExisting ? "Change your PIN" : "Create a 4-digit PIN"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "current" && "Enter your current PIN to continue."}
          {step === "create"  && "You'll use this every time you sign in. Pick something only you would know."}
          {step === "confirm" && "Re-enter the PIN to confirm."}
        </p>

        {/* progress dots */}
        <div className="flex items-center gap-2 mt-6">
          {(hasExisting ? ["current","create","confirm"] : ["create","confirm"]).map((s) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${step === s ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="mt-8">
          {step === "current" && (
            <PinPad value={currentPin} onChange={setCurrentPin} requireConfirm />
          )}
          {step === "create" && (
            <PinPad value={pin} onChange={setPin} requireConfirm />
          )}
          {step === "confirm" && (
            <PinPad value={confirm} onChange={setConfirm} disabled={submitting} requireConfirm />
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Button
            type="button"
            disabled={
              submitting ||
              (step === "current" && currentPin.length !== 4) ||
              (step === "create" && pin.length !== 4) ||
              (step === "confirm" && confirm.length !== 4)
            }
            onClick={() => {
              if (step === "current" && currentPin.length === 4) setStep("create");
              else if (step === "create" && pin.length === 4) { setStep("confirm"); setConfirm(""); }
              else if (step === "confirm" && confirm.length === 4) submit(confirm);
            }}
            className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_24px_hsl(142_76%_45%/0.5)] active:scale-95 transition-all p-0"
            aria-label={step === "confirm" ? "Save PIN" : "Continue"}
          >
            {submitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-8 w-8" strokeWidth={3} />}
          </Button>
        </div>

        {step === "confirm" && (
          <Button
            type="button" variant="ghost" className="w-full mt-2"
            onClick={() => { setPin(""); setConfirm(""); setStep("create"); }}
          >
            Start over
          </Button>
        )}

        <ul className="mt-8 space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Encrypted and stored hashed — never in plain text</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Account locks after 5 incorrect attempts</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Reset anytime via secure email OTP</li>
        </ul>
      </div>
    </div>
  );
}
