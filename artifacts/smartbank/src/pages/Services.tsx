import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { Wallet, Send, PiggyBank, CreditCard, LineChart, Shield, Smartphone, Globe } from "lucide-react";

const Services = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const services = [
    { icon: Wallet, key: "checking" },
    { icon: PiggyBank, key: "savings" },
    { icon: Send, key: "transfers" },
    { icon: CreditCard, key: "cards" },
    { icon: LineChart, key: "investing" },
    { icon: Shield, key: "insurance" },
    { icon: Smartphone, key: "mobile" },
    { icon: Globe, key: "global" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".svc-head",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out", clearProps: "all" }
      );
      gsap.fromTo(
        ".svc",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: { each: 0.06, from: "start" },
          ease: "power3.out",
          delay: 0.15,
          clearProps: "all",
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="container py-20">
      <div className="max-w-2xl">
        <h1 className="svc-head font-display text-5xl md:text-6xl">
          {t("services.title1")} <span className="text-gradient">{t("services.title2")}</span>
        </h1>
        <p className="svc-head mt-5 text-lg text-muted-foreground">{t("services.sub")}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
        {services.map((s) => (
          <div
            key={s.key}
            className="svc group relative flex h-full flex-col rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold leading-snug">{t(`services.items.${s.key}.t`)}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
              {t(`services.items.${s.key}.d`)}
            </p>
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          </div>
        ))}
      </div>
    </div>
  );
};
export default Services;
