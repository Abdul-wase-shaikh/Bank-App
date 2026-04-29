import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Fingerprint,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone as PhoneIcon,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LANGS } from "@/i18n/config";
import {
  authenticateBiometric,
  describeDevice,
  isBiometricSupported,
  pinApi,
  registerBiometric,
  type PinStatus,
} from "@/lib/secureLogin";

interface ProfileRow {
  full_name: string;
  phone: string;
  avatar_url: string | null;
}

interface AccountRow {
  account_number: string;
  currency: string;
  created_at?: string;
}

interface LoginEvent {
  id: string;
  method: string;
  outcome: string;
  ip: string | null;
  user_agent: string | null;
  is_suspicious: boolean;
  created_at: string;
}

const PHONE_REGEX = /^[6-9]\d{9}$/;

const initialsFor = (name: string, email: string) => {
  const src = (name || email || "").trim();
  if (!src) return "U";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "U").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
};

const friendlyDevice = (ua: string | null) => {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad/.test(ua)) return "iOS device";
  if (/Android/.test(ua)) return "Android device";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Browser";
};

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow>({
    full_name: "",
    phone: "",
    avatar_url: null,
  });
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [touched, setTouched] = useState({ phone: false });

  // security panel
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  // change-password
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: p }, { data: a }, { data: ps }, ev] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select("account_number, currency, created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        pinApi.status(),
        supabase
          .from("login_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      if (p) {
        setProfile({
          full_name: p.full_name ?? "",
          phone: p.phone ?? "",
          avatar_url: p.avatar_url ?? null,
        });
      }
      if (a) setAccount(a as AccountRow);
      if (ps) setPinStatus(ps);
      if (ev?.data) setEvents(ev.data as LoginEvent[]);
      setBioSupported(await isBiometricSupported());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const phoneError = useMemo(() => {
    if (!profile.phone) return "";
    return PHONE_REGEX.test(profile.phone)
      ? ""
      : "Enter a 10-digit Indian mobile number";
  }, [profile.phone]);

  const verified = !!user?.email_confirmed_at;
  const bioActive = (pinStatus?.biometricCredentials?.length ?? 0) > 0;

  const onAvatarPick = (file: File | null) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Please pick an image under 1 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setProfile((p) => ({ ...p, avatar_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!user) return;
    if (touched.phone === false) setTouched((t) => ({ ...t, phone: true }));
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        avatar_url: profile.avatar_url,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("profile.saved"));
  };

  const changePassword = async () => {
    if (pw.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPw({ next: "", confirm: "" });
  };

  const toggleBiometric = async (next: boolean) => {
    if (!user || !pinStatus) return;
    setBioBusy(true);
    try {
      if (next) {
        const { credentialId, publicKey } = await registerBiometric(
          user.id,
          user.email ?? "user",
        );
        const { error } = await pinApi.biometricRegister(
          credentialId,
          publicKey,
          describeDevice(),
        );
        if (error) throw new Error(error);
        toast.success("Biometric enabled on this device");
      } else {
        const ids = pinStatus.biometricCredentials.map((c) => c.id);
        if (ids.length)
          await supabase.from("webauthn_credentials").delete().in("id", ids);
        toast.success("Biometric disabled");
      }
      const { data: ps } = await pinApi.status();
      if (ps) setPinStatus(ps);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not change biometric setting";
      toast.error(msg);
    } finally {
      setBioBusy(false);
    }
  };

  const verifyBiometricNow = async () => {
    if (!pinStatus?.biometricCredentials?.length) return;
    try {
      const credId = await authenticateBiometric(
        pinStatus.biometricCredentials.map((c) => c.id),
      );
      toast[credId ? "success" : "error"](
        credId ? "Verified" : "Verification failed",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      toast.error(msg);
    }
  };

  const logoutEverywhere = async () => {
    try {
      // best-effort global sign-out; fall back to local
      await supabase.auth.signOut({ scope: "global" } as { scope: "global" });
    } catch {
      await signOut();
    }
    toast.success("Signed out from all devices");
    nav("/login");
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const memberSince = account?.created_at
    ? new Date(account.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="container py-8 max-w-5xl">
      {/* ───── Header card ───── */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative shrink-0 mx-auto md:mx-0">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Profile" />
            ) : null}
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display">
              {initialsFor(profile.full_name, user?.email ?? "")}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg hover:scale-105 transition"
            aria-label="Change photo"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAvatarPick(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <h1 className="font-display text-2xl md:text-3xl truncate">
              {profile.full_name || user?.email?.split("@")[0] || "Welcome"}
            </h1>
            {verified ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-center md:self-auto gap-1">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 self-center md:self-auto gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Unverified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1.5 justify-center md:justify-start">
            <Mail className="h-3.5 w-3.5" /> {user?.email}
          </p>
          {account?.account_number && (
            <p className="text-xs font-mono text-muted-foreground mt-1">
              A/C •••• {account.account_number.slice(-4)} · {account.currency} ·
              Member since {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* ───── Tabs ───── */}
      <Tabs defaultValue="personal" className="mt-6">
        <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-flex">
          <TabsTrigger value="personal" className="gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Personal ─── */}
        <TabsContent value="personal" className="mt-4">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <header>
              <h2 className="font-display text-xl">Personal information</h2>
              <p className="text-sm text-muted-foreground">
                This is how others will see you across SmartBank.
              </p>
            </header>
            <Separator />

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm">
                  {t("profile.fullName")}
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Your full name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  {t("profile.phone")}
                </Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profile.phone}
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="9876543210"
                    className={`pl-9 ${
                      touched.phone && phoneError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                </div>
                {touched.phone && phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm">Email address</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={user?.email ?? ""} disabled className="pl-9" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(user?.email ?? "", "Email")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from here. Contact support if you need
                  to update it.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={save}
                disabled={saving || !!phoneError}
                className="bg-gradient-primary text-primary-foreground gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("profile.save")}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── Account ─── */}
        <TabsContent value="account" className="mt-4">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <header>
              <h2 className="font-display text-xl">Account settings</h2>
              <p className="text-sm text-muted-foreground">
                Your account details and regional preferences.
              </p>
            </header>
            <Separator />

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm">Account number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={account?.account_number ?? "—"}
                    className="font-mono"
                  />
                  {account?.account_number && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copy(account.account_number, "Account number")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Currency</Label>
                <Input readOnly value={account?.currency ?? "—"} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Member since</Label>
                <Input readOnly value={memberSince} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Language</Label>
                <Select
                  value={i18n.language}
                  onValueChange={(v) => i18n.changeLanguage(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        <span className="mr-2">{l.flag}</span>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Security ─── */}
        <TabsContent value="security" className="mt-4 space-y-4">
          {/* Verification */}
          <div className="glass-card p-6 flex items-center gap-4">
            <div
              className={`h-11 w-11 rounded-xl grid place-items-center ${
                verified
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {verified ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">Email verification</div>
              <div className="text-sm text-muted-foreground">
                {verified
                  ? "Your email address is verified."
                  : "Your email address has not been verified yet."}
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Change password</div>
                <div className="text-sm text-muted-foreground">
                  Use at least 8 characters.
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPw" className="text-sm">
                  New password
                </Label>
                <Input
                  id="newPw"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPw" className="text-sm">
                  Confirm password
                </Label>
                <Input
                  id="confirmPw"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={changePassword}
                disabled={pwSaving || !pw.next || !pw.confirm}
                className="gap-2"
              >
                {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </div>
          </div>

          {/* PIN + Biometric */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Login PIN</div>
                  <div className="text-sm text-muted-foreground">
                    {pinStatus?.hasPin
                      ? "A login PIN is set for this account."
                      : "No login PIN set."}
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={pinStatus?.hasPin ? "/pin-reset" : "/pin-setup"}>
                  {pinStatus?.hasPin ? "Change PIN" : "Set PIN"}
                </Link>
              </Button>
            </div>

            <Separator />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    Biometric / 2FA
                    {bioActive && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bioSupported
                      ? "Use your device biometric to confirm sensitive actions."
                      : "This device doesn't support biometric authentication."}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bioActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={verifyBiometricNow}
                  >
                    Test
                  </Button>
                )}
                <Switch
                  checked={bioActive}
                  onCheckedChange={toggleBiometric}
                  disabled={!bioSupported || bioBusy}
                />
              </div>
            </div>

            {pinStatus?.biometricCredentials &&
              pinStatus.biometricCredentials.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Registered devices
                    </div>
                    {pinStatus.biometricCredentials.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Fingerprint className="h-4 w-4 text-muted-foreground" />
                          <span>{c.device_label || "Device"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await supabase
                              .from("webauthn_credentials")
                              .delete()
                              .eq("id", c.id);
                            const { data: ps } = await pinApi.status();
                            if (ps) setPinStatus(ps);
                            toast.success("Device removed");
                          }}
                          aria-label="Remove device"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>

          {/* Login activity */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Recent login activity</div>
                <div className="text-sm text-muted-foreground">
                  Last 5 sign-in attempts on this account.
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/security">View all</Link>
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          e.outcome === "success"
                            ? "bg-emerald-500"
                            : "bg-destructive"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-medium capitalize truncate">
                          {e.method} · {e.outcome}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {friendlyDevice(e.user_agent)}
                          {e.is_suspicious && " · suspicious"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {new Date(e.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout from all devices */}
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/15 text-destructive grid place-items-center">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Sign out from all devices</div>
              <div className="text-sm text-muted-foreground">
                You'll need to sign in again on every device.
              </div>
            </div>
            <Button variant="destructive" onClick={logoutEverywhere}>
              Sign out all
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
