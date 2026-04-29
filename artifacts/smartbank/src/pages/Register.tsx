import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  User,
  Mail,
  AtSign,
  CreditCard,
  Lock,
  Building2,
} from "lucide-react";

type AccountType = "" | "checking" | "savings" | "business";

const passwordScore = (pw: string) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4); // 0-4
};

const Register = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    accountType: "" as AccountType,
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reg-card", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".reg-field", { y: 12, opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.15 });
    }, ref);
    return () => ctx.revert();
  }, []);

  const score = useMemo(() => passwordScore(form.password), [form.password]);
  const strengthLabel = ["—", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = [
    "bg-muted",
    "bg-destructive",
    "bg-accent",
    "bg-primary/70",
    "bg-primary",
  ][score];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { toast.error(t("auth.usernameRequired")); return; }
    if (!form.accountType) { toast.error(t("auth.accountTypeRequired")); return; }
    if (form.password.length < 6) { toast.error(t("auth.pwShort")); return; }
    if (form.password !== form.confirmPassword) { toast.error(t("auth.pwMismatch")); return; }
    if (!agree) { toast.error(t("auth.agreeRequired")); return; }

    setLoading(true);
    // Normalize email exactly the same way as Login. Mismatched casing or a
    // stray space here is the #1 reason people later get "Invalid login
    // credentials" — they registered as "Foo@x.com " but try to log in as
    // "foo@x.com".
    const email = form.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/pin-setup`,
        data: {
          full_name: form.fullName,
          username: form.username,
          account_type: form.accountType,
        },
      },
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    // When email confirmation is enabled in Supabase (the default), signUp
    // succeeds but returns no session. If we navigate to a protected route
    // here the user is silently bounced and thinks "register worked" — then
    // login fails with "Invalid login credentials" because their email is
    // unconfirmed. Surface the real state instead.
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      // Supabase returns an empty identities array when the email is already
      // registered, to avoid leaking account existence. Tell the user.
      toast.error("This email is already registered. Please sign in instead.");
      nav("/login");
      return;
    }

    if (!data.session) {
      toast.success("Account created. Please check your email to confirm your address before signing in.");
      nav("/login");
      return;
    }

    toast.success(t("auth.createdToast"));
    nav("/pin-setup");
  };

  const inputBase =
    "w-full bg-secondary/60 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 ring-primary/50 placeholder:text-muted-foreground/60";

  return (
    <div ref={ref} className="container py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="reg-card flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Smart<span className="text-gradient">Bank</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl">{t("auth.openTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.openSub")}</p>
          </div>
          <div className="hidden md:grid h-24 w-24 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg">
            <Building2 className="h-12 w-12" />
          </div>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="reg-card glass-card p-6 md:p-8 space-y-8">
          {/* Personal Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-semibold text-primary">{t("auth.personalInfo")}</h2>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="reg-field">
                <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                  <User className="h-4 w-4 text-primary" /> {t("auth.fullName")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder={t("auth.fullNamePh")}
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="reg-field">
                <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                  <Mail className="h-4 w-4 text-primary" /> {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t("auth.emailPh")}
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Account Details + Security */}
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-semibold text-primary">{t("auth.accountDetails")}</h2>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="space-y-4">
                <div className="reg-field">
                  <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                    <AtSign className="h-4 w-4 text-primary" /> {t("auth.username")}
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder={t("auth.usernamePh")}
                      className={inputBase}
                    />
                  </div>
                </div>
                <div className="reg-field">
                  <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                    <CreditCard className="h-4 w-4 text-primary" /> {t("auth.accountType")}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      required
                      value={form.accountType}
                      onChange={(e) => setForm({ ...form, accountType: e.target.value as AccountType })}
                      className={`${inputBase} appearance-none pr-8`}
                    >
                      <option value="" disabled>{t("auth.accountTypePh")}</option>
                      <option value="checking">{t("auth.checking")}</option>
                      <option value="savings">{t("auth.savings")}</option>
                      <option value="business">{t("auth.business")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-semibold text-primary">{t("auth.security")}</h2>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="space-y-4">
                <div className="reg-field">
                  <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                    <Lock className="h-4 w-4 text-primary" /> {t("auth.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={t("auth.passwordPh")}
                      className={inputBase}
                    />
                  </div>
                </div>
                <div className="reg-field">
                  <label className="text-xs font-medium flex items-center gap-2 mb-1.5">
                    <Lock className="h-4 w-4 text-primary" /> {t("auth.confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder={t("auth.confirmPasswordPh")}
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Password strength meter */}
                <div className="reg-field">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">{t("auth.passwordStrength")}</span>
                    <span className="text-muted-foreground">{strengthLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-colors ${
                          score >= i ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Terms */}
          <div className="reg-field flex items-start gap-3 pt-2 border-t border-border/60">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground">
              {t("auth.agree")}{" "}
              <a className="text-primary hover:underline" href="#">{t("auth.terms")}</a>{" "}
              {t("auth.and")}{" "}
              <a className="text-primary hover:underline" href="#">{t("auth.privacy")}</a>.
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="reg-field w-full h-12 text-base bg-gradient-primary text-primary-foreground hover:opacity-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.create")}
          </Button>

          <p className="reg-field text-sm text-muted-foreground text-center">
            {t("auth.haveAcct")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("auth.signInLink")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
