import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { Award, Users, Globe, Heart } from "lucide-react";

const About = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const values = [
    { icon: Award, key: "trust" },
    { icon: Users, key: "people" },
    { icon: Globe, key: "borderless" },
    { icon: Heart, key: "care" },
  ];

  return (
    <div ref={ref} className="container py-20">
      <div className="max-w-3xl">
        <div className="reveal text-sm text-primary uppercase tracking-widest">{t("about.kicker")}</div>
        <h1 className="reveal mt-3 font-display text-5xl md:text-6xl">{t("about.title1")} <span className="text-gradient">{t("about.title2")}</span>.</h1>
        <p className="reveal mt-6 text-lg text-muted-foreground">{t("about.intro")}</p>
      </div>

      <div className="reveal mt-16 glass-card p-8 md:p-12 grid md:grid-cols-3 gap-8">
        <div><div className="text-4xl font-display text-gradient font-bold">2.4M+</div><div className="text-sm text-muted-foreground mt-1">{t("about.stats.customers")}</div></div>
        <div><div className="text-4xl font-display text-gradient font-bold">₹4L Cr</div><div className="text-sm text-muted-foreground mt-1">{t("about.stats.assets")}</div></div>
        <div><div className="text-4xl font-display text-gradient font-bold">4.9★</div><div className="text-sm text-muted-foreground mt-1">{t("about.stats.rating")}</div></div>
      </div>

      <h2 className="reveal mt-20 font-display text-3xl md:text-4xl">{t("about.valuesTitle")}</h2>
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {values.map(v => (
          <div key={v.key} className="reveal glass-card p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><v.icon className="h-5 w-5" /></div>
            <h3 className="mt-4 font-semibold">{t(`about.values.${v.key}.t`)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(`about.values.${v.key}.d`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default About;
