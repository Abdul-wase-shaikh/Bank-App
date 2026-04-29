import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("contact.sent"));
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div ref={ref} className="container py-20">
      <div className="max-w-2xl">
        <h1 className="reveal font-display text-5xl md:text-6xl">{t("contact.title1")} <span className="text-gradient">{t("contact.title2")}</span></h1>
        <p className="reveal mt-5 text-lg text-muted-foreground">{t("contact.sub")}</p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="reveal glass-card p-6 md:col-span-1 space-y-5">
          <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-primary mt-1" /><div><div className="font-medium">{t("contact.email")}</div><div className="text-sm text-muted-foreground">support@smartbank.io</div></div></div>
          <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-primary mt-1" /><div><div className="font-medium">{t("contact.phone")}</div><div className="text-sm text-muted-foreground">+1 (800) 123-4567</div></div></div>
          <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary mt-1" /><div><div className="font-medium">{t("contact.hq")}</div><div className="text-sm text-muted-foreground">350 Mission St, San Francisco, CA</div></div></div>
        </div>

        <form onSubmit={submit} className="reveal glass-card p-6 md:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">{t("contact.name")}</label>
              <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
            </div>
            <div>
              <label className="text-sm">{t("contact.email")}</label>
              <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-sm">{t("contact.message")}</label>
            <textarea required rows={5} maxLength={1000} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/50" />
          </div>
          <Button type="submit" className="bg-gradient-primary text-primary-foreground"><Send className="h-4 w-4 mr-2" /> {t("contact.send")}</Button>
        </form>
      </div>
    </div>
  );
};
export default Contact;
