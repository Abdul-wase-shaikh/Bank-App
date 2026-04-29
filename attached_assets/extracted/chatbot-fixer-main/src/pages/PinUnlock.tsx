import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Check, Fingerprint, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PinPad } from "@/components/PinPad";
import { useAuth } from "@/hooks/useAuth";
import { usePinSession } from "@/hooks/usePinSession";
import { authenticateBiometric, isBiometricSupported, pinApi, type PinStatus } from "@/lib/secureLogin";

export default function PinUnlock() {
  const nav = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { unlock, unlocked } = usePinSession();

  const [status, setStatus] = useState<PinStatus | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bioTried, setBioTried] = useState(false);
  const [bioInProgress, setBioInProgress] = useState(false);
  const [now, setNow] = useState(Date.now());

  // tick clock for lockout countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshStatus = useCallback(async () => {
    const { data } = await pinApi.status();
    if (data) setStatus(data);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/login"); return; }
    if (unlocked) { nav("/dashboard", { replace: true }); return; }
    refreshStatus().then(() => {
      // After fetching status, decide where to go if no PIN yet
      pinApi.status().then(({ data }) => {
        if (!data?.hasPin) nav("/pin-setup", { replace: true });
      });
    });
  }, [user, authLoading, unlocked, nav, refreshStatus]);

  const lockedUntilMs = status?.lockedUntil ? new Date(status.lockedUntil).getTime() : 0;
  const isLocked = lockedUntilMs > now;
  const lockSecondsLeft = Math.max(0, Math.ceil((lockedUntilMs - now) / 1000));

  const hasBio = (status?.biometricCredentials?.length ?? 0) > 0;

  // Try biometric automatically on first arrival
  useEffect(() => {
    if (!status || bioTried || isLocked) return;
    if (hasBio && isBiometricSupported()) {
      setBioTried(true);
      tryBiometric();
    } else {
      setBioTried(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function tryBiometric() {
    if (!status) return;
    setBioInProgress(true);
    try {
      const allowed = status.biometricCredentials.map((c) => c.credential_id);
      if (allowed.length === 0) throw new Error("No registered devices");
      const credIdStr = await authenticateBiometric(allowed);
      const { data, error } = await pinApi.biometricVerify(credIdStr);
      if (error) throw new Error(error);
      if (data?.suspicious) toast.warning("New device detected — login was logged for your security.");
      unlock();
      toast.success("Welcome back");
      nav("/dashboard", { replace: true });
    } catch (e: any) {
      // silent fallback to PIN
      console.info("Biometric fallback:", e?.message);
    } finally {
      setBioInProgress(false);
    }
  }

  async function submitPin(value: string) {
    if (isLocked) return;
    setSubmitting(true);
    const { data, error } = await pinApi.verify(value);
    setSubmitting(false);
    if (error) {
      setPin("");
      toast.error(error);
      await refreshStatus();
      return;
    }
    if (data?.suspicious) toast.warning("New device detected — login was logged for your security.");
    unlock();
    toast.success("Welcome back");
    nav("/dashboard", { replace: true });
  }

  const remainingAttempts = useMemo(() => {
    if (!status) return null;
    return Math.max(0, 5 - (status.failedCount ?? 0));
  }, [status]);

  if (authLoading || !status) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-10 sm:py-16 grid place-items-center">
      <div className="glass-card w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
            Smart<span className="text-gradient">Bank</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl">Enter your PIN</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </p>

        {isLocked ? (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Account temporarily locked</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Too many incorrect attempts. Try again in <span className="font-mono">{Math.floor(lockSecondsLeft / 60)}:{String(lockSecondsLeft % 60).padStart(2, "0")}</span> or reset your PIN.
                </p>
              </div>
            </div>
            <Link to="/pin-reset" className="block mt-4">
              <Button variant="outline" className="w-full">Reset PIN via email</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <PinPad
                value={pin}
                onChange={setPin}
                disabled={submitting || bioInProgress}
                requireConfirm
              />
            </div>

            {remainingAttempts !== null && remainingAttempts < 5 && remainingAttempts > 0 && (
              <p className="text-center text-xs text-destructive mt-4">
                {remainingAttempts} {remainingAttempts === 1 ? "attempt" : "attempts"} remaining before lockout.
              </p>
            )}

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => submitPin(pin)}
                disabled={pin.length !== 4 || submitting || bioInProgress}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_24px_hsl(142_76%_45%/0.5)] active:scale-95 transition-all p-0"
                aria-label="Unlock"
              >
                {submitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-8 w-8" strokeWidth={3} />}
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              {hasBio && isBiometricSupported() && (
                <Button
                  variant="outline" className="w-full"
                  onClick={tryBiometric} disabled={bioInProgress || submitting}
                >
                  {bioInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Fingerprint className="h-4 w-4 mr-2" /> Use biometric</>}
                </Button>
              )}
              <Link to="/pin-reset" className="block">
                <Button variant="ghost" className="w-full text-muted-foreground">Forgot PIN?</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
