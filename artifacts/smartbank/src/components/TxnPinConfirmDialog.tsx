import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinPad } from "@/components/PinPad";
import {
  authenticateBiometric,
  isBiometricSupported,
  txnPinApi,
  type TxnPinStatus,
} from "@/lib/secureLogin";

interface TxnPinConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Called once auth succeeds. Receives whichever proof was used so the
   * caller can pass it to the banking edge function.
   */
  onConfirmed: (proof: { txnPin?: string; biometricCredentialId?: string }) => void;
  title?: string;
  description?: string;
  /** Try platform biometric first if registered. Default true. */
  preferBiometric?: boolean;
}

type Mode = "verify" | "setup-create" | "setup-confirm";

/**
 * 6-digit transaction PIN re-prompt with biometric shortcut.
 * - If the user has no transaction PIN yet, the dialog walks them through
 *   creating one (prompt-on-first-use) and then completes the action.
 * - 5 failed PIN attempts → 15-minute lockout (enforced server-side).
 */
export const TxnPinConfirmDialog = ({
  open,
  onOpenChange,
  onConfirmed,
  title = "Authorize transaction",
  description = "Enter your 6-digit transaction PIN to confirm.",
  preferBiometric = true,
}: TxnPinConfirmDialogProps) => {
  const [status, setStatus] = useState<TxnPinStatus | null>(null);
  const [mode, setMode] = useState<Mode>("verify");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bioInProgress, setBioInProgress] = useState(false);
  const [bioTried, setBioTried] = useState(false);
  const [now, setNow] = useState(Date.now());

  const refreshStatus = useCallback(async () => {
    const { data } = await txnPinApi.status();
    if (data) {
      setStatus(data);
      setMode(data.hasTxnPin ? "verify" : "setup-create");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPin("");
      setConfirmPin("");
      setBioTried(false);
      setStatus(null);
      refreshStatus();
    }
  }, [open, refreshStatus]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const lockedUntilMs = status?.lockedUntil ? new Date(status.lockedUntil).getTime() : 0;
  const isLocked = lockedUntilMs > now;
  const lockSecondsLeft = Math.max(0, Math.ceil((lockedUntilMs - now) / 1000));
  const hasBio = (status?.biometricCredentials?.length ?? 0) > 0;

  const remainingAttempts = useMemo(() => {
    if (!status) return null;
    return Math.max(0, 5 - (status.failedCount ?? 0));
  }, [status]);

  // auto-trigger biometric on open (only when we already have a PIN)
  useEffect(() => {
    if (!open || !status || bioTried || isLocked) return;
    if (status.hasTxnPin && preferBiometric && hasBio && isBiometricSupported()) {
      setBioTried(true);
      tryBiometric();
    } else {
      setBioTried(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status]);

  async function tryBiometric() {
    if (!status) return;
    setBioInProgress(true);
    try {
      const allowed = status.biometricCredentials.map((c) => c.credential_id);
      if (allowed.length === 0) throw new Error("No registered devices");
      const credIdStr = await authenticateBiometric(allowed);
      onConfirmed({ biometricCredentialId: credIdStr });
      onOpenChange(false);
    } catch (e: any) {
      console.info("Biometric fallback:", e?.message);
    } finally {
      setBioInProgress(false);
    }
  }

  async function submitVerify(value: string) {
    if (isLocked) return;
    setSubmitting(true);
    // We don't pre-verify on the server here — the banking function will verify
    // the PIN atomically with the action. This avoids two round-trips and
    // keeps the lockout counter accurate to actual transaction attempts.
    setSubmitting(false);
    onConfirmed({ txnPin: value });
    onOpenChange(false);
  }

  async function submitSetup(finalConfirm: string) {
    setSubmitting(true);
    const { error } = await txnPinApi.set(pin, finalConfirm);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      setPin("");
      setConfirmPin("");
      setMode("setup-create");
      return;
    }
    toast.success("Transaction PIN saved");
    // Re-load status, then continue verify path with the freshly-set PIN.
    await refreshStatus();
    onConfirmed({ txnPin: pin });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting && !bioInProgress) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            {mode === "verify" ? title : "Set your 6-digit transaction PIN"}
          </DialogTitle>
          <DialogDescription>
            {mode === "verify"
              ? description
              : mode === "setup-create"
                ? "This new 6-digit PIN is required to authorize withdrawals and transfers. It's separate from your 4-digit login PIN."
                : "Re-enter the 6 digits to confirm."}
          </DialogDescription>
        </DialogHeader>

        {!status ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isLocked ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Transactions temporarily locked</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Too many incorrect attempts. Try again in{" "}
                  <span className="font-mono">
                    {Math.floor(lockSecondsLeft / 60)}:{String(lockSecondsLeft % 60).padStart(2, "0")}
                  </span>{" "}
                  or reset your transaction PIN.
                </p>
              </div>
            </div>
            <Link to="/txn-pin-reset" className="block mt-4" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full">Reset transaction PIN via email</Button>
            </Link>
          </div>
        ) : mode === "verify" ? (
          <>
            <div className="pt-2">
              <PinPad
                length={6}
                value={pin}
                onChange={setPin}
                disabled={submitting || bioInProgress}
                requireConfirm
              />
            </div>

            {remainingAttempts !== null && remainingAttempts < 5 && remainingAttempts > 0 && (
              <p className="text-center text-xs text-destructive">
                {remainingAttempts} {remainingAttempts === 1 ? "attempt" : "attempts"} remaining before lockout.
              </p>
            )}

            <div className="flex justify-center">
              <Button
                onClick={() => submitVerify(pin)}
                disabled={pin.length !== 6 || submitting || bioInProgress}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_24px_hsl(142_76%_45%/0.5)] active:scale-95 transition-all p-0"
                aria-label="Authorize"
              >
                {submitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-8 w-8" strokeWidth={3} />}
              </Button>
            </div>

            <div className="space-y-2">
              {hasBio && isBiometricSupported() && (
                <Button
                  variant="outline" className="w-full"
                  onClick={tryBiometric} disabled={bioInProgress || submitting}
                >
                  {bioInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Fingerprint className="h-4 w-4 mr-2" /> Use biometric</>
                  )}
                </Button>
              )}
              <Link to="/txn-pin-reset" className="block" onClick={() => onOpenChange(false)}>
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Forgot transaction PIN?
                </Button>
              </Link>
              <Button
                variant="ghost" className="w-full text-muted-foreground"
                onClick={() => onOpenChange(false)} disabled={submitting || bioInProgress}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : mode === "setup-create" ? (
          <>
            <div className="pt-2">
              <PinPad
                length={6}
                value={pin}
                onChange={setPin}
                disabled={submitting}
                requireConfirm
              />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => { if (pin.length === 6) { setMode("setup-confirm"); setConfirmPin(""); } }}
                disabled={pin.length !== 6 || submitting}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_24px_hsl(142_76%_45%/0.5)] active:scale-95 transition-all p-0"
                aria-label="Continue"
              >
                <Check className="h-8 w-8" strokeWidth={3} />
              </Button>
            </div>
            <Button
              variant="ghost" className="w-full text-muted-foreground"
              onClick={() => onOpenChange(false)} disabled={submitting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <div className="pt-2">
              <PinPad
                length={6}
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={submitting}
                requireConfirm
              />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => submitSetup(confirmPin)}
                disabled={confirmPin.length !== 6 || submitting}
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_24px_hsl(142_76%_45%/0.5)] active:scale-95 transition-all p-0"
                aria-label="Confirm PIN"
              >
                {submitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-8 w-8" strokeWidth={3} />}
              </Button>
            </div>
            <Button
              variant="ghost" className="w-full"
              onClick={() => { setPin(""); setConfirmPin(""); setMode("setup-create"); }}
              disabled={submitting}
            >
              Start over
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
