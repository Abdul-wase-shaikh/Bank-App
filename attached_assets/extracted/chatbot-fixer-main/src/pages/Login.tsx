import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const Login = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".card", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".field", { y: 15, opacity: 0, duration: 0.6, stagger: 0.08, delay: 0.2, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Normalize: trim whitespace and lowercase the email. Browser autofill
    // commonly leaves a trailing space or different casing, which causes
    // Supabase to return "Invalid login credentials" even though the password
    // is correct.
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      // Surface the real reason instead of the generic toast. The two cases
      // most users hit are "email not confirmed" (after sign up) and "invalid
      // login credentials" (typo or unconfirmed email aliased to that error).
      const msg = error.message || "";
      if (/email.*not.*confirmed/i.test(msg)) {
        toast.error("Please confirm your email before signing in. Check your inbox for the verification link.");
      } else if (/invalid.*login.*credentials/i.test(msg)) {
        toast.error("Email or password is incorrect. If you just registered, please confirm your email first.");
      } else {
        toast.error(msg);
      }
      return;
    }
    toast.success(t("auth.welcomeToast"));
    nav("/pin-unlock");
  };

  return (
    <div ref={ref} className="container py-20 grid place-items-center">
      <div className="card glass-card w-full max-w-md p-8">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
          Smart<span className="text-gradient">Bank</span>
        </div>
        <h1 className="mt-6 font-display text-3xl">{t("auth.welcomeBack")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.signInSub")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="field">
            <label className="text-sm">{t("auth.email")}</label>
            <input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
          </div>
          <div className="field">
            <label className="text-sm">{t("auth.password")}</label>
            <input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
          </div>
          <Button type="submit" disabled={loading} className="field w-full bg-gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.signIn")}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {t("auth.newHere")} <Link to="/register" className="text-primary hover:underline">{t("auth.openAcct")}</Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
