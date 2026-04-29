import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, Loader2, ShieldCheck, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { describeDevice, isBiometricSupported, pinApi, registerBiometric } from "@/lib/secureLogin";

export default function BiometricSetup() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [hasAny, setHasAny] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/login"); return; }
    setSupported(isBiometricSupported());
    pinApi.status().then(({ data }) => setHasAny((data?.biometricCredentials?.length ?? 0) > 0));
  }, [user, authLoading, nav]);

  const enroll = async () => {
    if (!user) return;
    setEnrolling(true);
    try {
      const { credentialId, publicKey } = await registerBiometric(user.id, user.email ?? "user");
      const { error } = await pinApi.biometricRegister(credentialId, publicKey, describeDevice());
      if (error) { toast.error(error); return; }
      toast.success("Biometric login enabled");
      nav("/dashboard", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not enable biometric login");
    } finally {
      setEnrolling(false);
    }
  };

  const skip = () => nav("/dashboard", { replace: true });

  if (authLoading || supported === null) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-10 sm:py-16 grid place-items-center">
      <div className="glass-card w-full max-w-md p-6 sm:p-8 text-center">
        <div className="flex items-center gap-2 font-display font-bold text-lg justify-center">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
          Smart<span className="text-gradient">Bank</span>
        </div>

        <div className="mx-auto mt-8 grid place-items-center h-24 w-24 rounded-3xl bg-gradient-accent/20 border border-accent/30 glow-primary">
          <Fingerprint className="h-12 w-12 text-accent" strokeWidth={1.5} />
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl">Enable biometric login</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Use {/iPhone|iPad/i.test(navigator.userAgent) ? "Face ID or Touch ID" : "your fingerprint or face"} for instant access. Your PIN always stays as a backup.
        </p>

        {!supported && (
          <p className="mt-6 text-sm rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2">
            This device or browser doesn't support biometric authentication. You can still sign in with your PIN.
          </p>
        )}

        {hasAny && (
          <p className="mt-6 text-sm rounded-lg bg-primary/10 border border-primary/30 text-primary px-3 py-2">
            Biometric is already enabled on a registered device. You can add another from Security settings.
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            disabled={!supported || enrolling}
            onClick={enroll}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Fingerprint className="h-4 w-4 mr-2" /> Enable biometric</>}
          </Button>
          <Button type="button" variant="ghost" onClick={skip} className="w-full">
            <SkipForward className="h-4 w-4 mr-2" /> Use PIN only for now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Biometric data never leaves your device — we only store a public key handle.
        </p>
      </div>
    </div>
  );
}
