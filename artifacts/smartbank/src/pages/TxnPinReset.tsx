import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PinPad } from "@/components/PinPad";
import { useAuth } from "@/hooks/useAuth";
import { txnPinApi } from "@/lib/secureLogin";

type Step = "request" | "verify" | "newPin" | "confirmPin";

export default function TxnPinReset() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) nav("/login");
  }, [user, authLoading, nav]);

  const requestOtp = async () => {
    setSending(true);
    const { data, error } = await txnPinApi.resetRequest();
    setSending(false);
    if (error) { toast.error(error); return; }
    setSentTo(data?.sentTo ?? user?.email ?? null);
    if (data?.devOtp) setDevOtpHint(data.devOtp);
    toast.success(`Verification code sent to ${data?.sentTo}`);
    setStep("verify");
  };

  const verifyOtp = () => {
    if (otp.length !== 6) return;
    setStep("newPin");
  };

  const submitNewPin = async (finalConfirm: string) => {
    setSubmitting(true);
    const { error } = await txnPinApi.resetConfirm(otp, pin, finalConfirm);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      if (/expired|used|invalid/i.test(error)) { setStep("request"); setOtp(""); setPin(""); setConfirm(""); }
      else { setStep("newPin"); setPin(""); setConfirm(""); }
      return;
    }
    toast.success("Transaction PIN reset");
    nav("/security", { replace: true });
  };

  if (authLoading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-10 sm:py-16 grid place-items-center">
      <div className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
          Smart<span className="text-gradient">Bank</span>
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl">Reset your transaction PIN</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "request" && "We'll email a 6-digit code to verify it's really you."}
          {step === "verify"  && `Enter the 6-digit code we sent to ${sentTo}.`}
          {step === "newPin"  && "Choose a new 6-digit transaction PIN."}
          {step === "confirmPin" && "Confirm your new transaction PIN."}
        </p>

        {step === "request" && (
          <div className="mt-8">
            <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                Code will be sent to <span className="font-medium">{user?.email}</span>
              </div>
            </div>
            <Button onClick={requestOtp} disabled={sending} className="w-full mt-6 bg-gradient-primary text-primary-foreground">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send verification code"}
            </Button>
            <Link to="/security" className="block mt-2"><Button variant="ghost" className="w-full">Back to security</Button></Link>
          </div>
        )}

        {step === "verify" && (
          <div className="mt-8 flex flex-col items-center">
            {devOtpHint && (
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Demo mode — your code: <span className="font-mono text-primary tracking-widest">{devOtpHint}</span>
              </p>
            )}
            <InputOTP maxLength={6} value={otp} onChange={setOtp} onComplete={verifyOtp}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-10 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button onClick={verifyOtp} disabled={otp.length !== 6} className="w-full mt-8 bg-gradient-primary text-primary-foreground">Continue</Button>
            <Button variant="ghost" className="w-full mt-2" onClick={requestOtp} disabled={sending}>Resend code</Button>
          </div>
        )}

        {step === "newPin" && (
          <div className="mt-8">
            <PinPad
              length={6}
              value={pin}
              onChange={setPin}
              onComplete={(v) => { if (v.length === 6) { setStep("confirmPin"); setConfirm(""); } }}
            />
          </div>
        )}

        {step === "confirmPin" && (
          <div className="mt-8">
            <PinPad
              length={6}
              value={confirm}
              onChange={setConfirm}
              disabled={submitting}
              onComplete={(v) => v.length === 6 && submitNewPin(v)}
            />
            <Button variant="ghost" className="w-full mt-4" onClick={() => { setPin(""); setConfirm(""); setStep("newPin"); }}>
              Start over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
