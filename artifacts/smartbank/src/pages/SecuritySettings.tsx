import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, Fingerprint, KeyRound, Loader2, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePinSession } from "@/hooks/usePinSession";
import {
  authenticateBiometric, describeDevice, isBiometricSupported,
  pinApi, registerBiometric, txnPinApi, type PinStatus, type TxnPinStatus,
} from "@/lib/secureLogin";
import { supabase } from "@/integrations/supabase/client";

interface LoginEvent {
  id: string;
  method: string;
  outcome: string;
  ip: string | null;
  user_agent: string | null;
  is_suspicious: boolean;
  created_at: string;
}

export default function SecuritySettings() {
  const nav = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { lock } = usePinSession();
  const [status, setStatus] = useState<PinStatus | null>(null);
  const [txnStatus, setTxnStatus] = useState<TxnPinStatus | null>(null);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [{ data: s }, { data: ts }, ev] = await Promise.all([
      pinApi.status(),
      txnPinApi.status(),
      supabase.from("login_events").select("*").order("created_at", { ascending: false }).limit(15),
    ]);
    if (s) setStatus(s);
    if (ts) setTxnStatus(ts);
    if (ev.data) setEvents(ev.data as any);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/login"); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const toggleBiometric = async (next: boolean) => {
    if (!user || !status) return;
    setBusy(true);
    try {
      if (next) {
        const { credentialId, publicKey } = await registerBiometric(user.id, user.email ?? "user");
        const { error } = await pinApi.biometricRegister(credentialId, publicKey, describeDevice());
        if (error) throw new Error(error);
        toast.success("Biometric enabled on this device");
      } else {
        // delete all credentials (RLS allows owner delete)
        const ids = status.biometricCredentials.map((c) => c.id);
        if (ids.length) await supabase.from("webauthn_credentials").delete().in("id", ids);
        toast.success("Biometric disabled");
      }
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change biometric setting");
    } finally {
      setBusy(false);
    }
  };

  const removeCredential = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.from("webauthn_credentials").delete().eq("id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Device removed");
    refresh();
  };

  const logoutAll = async () => {
    setBusy(true);
    const { error } = await pinApi.logoutAll();
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Signed out from all devices");
    lock();
    await signOut();
    nav("/login", { replace: true });
  };

  if (authLoading || !status) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const bioOn = status.biometricCredentials.length > 0;
  const bioSupported = isBiometricSupported();

  return (
    <div className="container py-10 sm:py-12 max-w-2xl">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Account security
      </div>
      <h1 className="font-display text-3xl sm:text-4xl">Secure login</h1>
      <p className="text-muted-foreground mt-2">Manage your PIN, biometric login and active sessions.</p>

      <div className="mt-8 grid gap-4">
        {/* PIN */}
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/15 text-primary"><KeyRound className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">4-digit PIN</div>
              <p className="text-sm text-muted-foreground">
                {status.hasPin
                  ? `Last changed ${status.pinChangedAt ? new Date(status.pinChangedAt).toLocaleString() : "—"}`
                  : "Not yet configured"}
              </p>
            </div>
            <Link to="/pin-setup"><Button variant="outline" size="sm">{status.hasPin ? "Change" : "Set"}</Button></Link>
          </div>
          {status.hasPin && (
            <div className="mt-4 pl-15">
              <Link to="/pin-reset" className="text-xs text-primary hover:underline">Forgot PIN? Reset via email</Link>
            </div>
          )}
        </section>

        {/* Transaction PIN (6-digit) */}
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/15 text-primary"><Banknote className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">6-digit transaction PIN</div>
              <p className="text-sm text-muted-foreground">
                {txnStatus?.hasTxnPin
                  ? `Last changed ${txnStatus.txnPinChangedAt ? new Date(txnStatus.txnPinChangedAt).toLocaleString() : "—"}`
                  : "Required to authorize withdrawals and transfers — not yet set"}
              </p>
            </div>
            <Link to="/txn-pin-setup">
              <Button variant="outline" size="sm">{txnStatus?.hasTxnPin ? "Change" : "Set"}</Button>
            </Link>
          </div>
          {txnStatus?.hasTxnPin && (
            <div className="mt-4">
              <Link to="/txn-pin-reset" className="text-xs text-primary hover:underline">
                Forgot transaction PIN? Reset via email
              </Link>
            </div>
          )}
        </section>

        {/* Biometric */}
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-accent/15 text-accent"><Fingerprint className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">Biometric login</div>
              <p className="text-sm text-muted-foreground">
                {!bioSupported
                  ? "Not supported on this device or browser"
                  : bioOn ? `Enabled on ${status.biometricCredentials.length} device(s)` : "Disabled — use PIN only"}
              </p>
            </div>
            <Switch
              checked={bioOn}
              disabled={!bioSupported || !status.hasPin || busy}
              onCheckedChange={toggleBiometric}
              aria-label="Toggle biometric login"
            />
          </div>
          {!status.hasPin && (
            <p className="mt-3 text-xs text-destructive">Set a PIN first — biometric requires a PIN as backup.</p>
          )}
          {bioOn && (
            <ul className="mt-5 space-y-2">
              {status.biometricCredentials.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-secondary/40 border border-border/40 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{c.device_label ?? "Device"}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.last_used_at ? `Last used ${new Date(c.last_used_at).toLocaleString()}` : "Not yet used"}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => removeCredential(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sessions */}
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-destructive/15 text-destructive"><LogOut className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">Sign out of all devices</div>
              <p className="text-sm text-muted-foreground">Ends every active session immediately.</p>
            </div>
            <Button variant="destructive" size="sm" disabled={busy} onClick={logoutAll}>Sign out all</Button>
          </div>
        </section>

        {/* Recent activity */}
        <section className="glass-card p-5 sm:p-6">
          <div className="font-medium mb-4">Recent login activity</div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent events.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className={`rounded-lg border px-3 py-2 text-sm flex items-start justify-between gap-3 ${
                  e.is_suspicious ? "border-destructive/40 bg-destructive/10" : "border-border/40 bg-secondary/30"
                }`}>
                  <div>
                    <div className="font-medium capitalize">
                      {e.method} · <span className={e.outcome === "success" ? "text-primary" : "text-destructive"}>{e.outcome}</span>
                      {e.is_suspicious && <span className="ml-2 text-xs rounded-full bg-destructive/20 text-destructive px-2 py-0.5">Suspicious</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 break-all">
                      {e.ip ?? "unknown ip"} · {e.user_agent?.slice(0, 60) ?? "unknown device"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
