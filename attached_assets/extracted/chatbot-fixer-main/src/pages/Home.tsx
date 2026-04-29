import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Sparkles, TrendingUp, Globe, CreditCard } from "lucide-react";

const Home = () => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const featRef = useRef<HTMLDivElement>(null);

  const features = [
    { icon: Zap, key: "instant" },
    { icon: Shield, key: "security" },
    { icon: Sparkles, key: "ai" },
    { icon: TrendingUp, key: "insights" },
    { icon: Globe, key: "global" },
    { icon: CreditCard, key: "cards" },
  ];

  const stats = [
    { v: "2.4M+", l: t("home.stats.customers") },
    { v: "₹1L Cr+", l: t("home.stats.moved") },
    { v: "99.99%", l: t("home.stats.uptime") },
    { v: "150+", l: t("home.stats.countries") },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-anim", { y: 30, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" });
      gsap.from(".hero-card", { scale: 0.92, opacity: 0, duration: 1, delay: 0.4, ease: "power3.out" });
      gsap.from(".stat", { y: 20, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.8, ease: "power2.out" });
      gsap.from(".feature", { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, delay: 1.0, ease: "power2.out" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div>
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="container relative pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="hero-anim inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> {t("home.badge")}
            </div>
            <h1 className="hero-anim mt-6 font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
              {t("home.heroTitle1")}<br />
              <span className="text-gradient">{t("home.heroTitle2")}</span> {t("home.heroTitle3")}<br />{t("home.heroTitle4")}
            </h1>
            <p className="hero-anim mt-6 text-lg text-muted-foreground max-w-xl">
              {t("home.heroSubtitle")}
            </p>
            <div className="hero-anim mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <Link to="/register">{t("home.openFree")} <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services">{t("home.explore")}</Link>
              </Button>
            </div>
            <div className="hero-anim mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.l} className="stat">
                  <div className="text-2xl font-display font-bold text-gradient">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-card relative">
            <div className="glass-card p-6 relative animate-float">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">SMART BANK</span>
                <span>VISA Infinite</span>
              </div>
              <div className="mt-10 font-mono text-xl tracking-widest">4242 •••• •••• 7392</div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{t("home.card.holder")}</div>
                  <div className="font-medium">ALEX MORGAN</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{t("home.card.balance")}</div>
                  <div className="text-2xl font-display font-bold text-gradient">₹20,45,800</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-primary blur-2xl opacity-50" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-accent blur-3xl opacity-30" />
            </div>

            <div className="glass-card mt-6 p-5 grid grid-cols-3 gap-4 text-center">
              {[{l:t("home.card.income"),v:"+₹7,02,000"},{l:t("home.card.spent"),v:"₹2,64,500"},{l:t("home.card.saved"),v:"+₹4,37,500"}].map(x=>(
                <div key={x.l}>
                  <div className="text-xs text-muted-foreground">{x.l}</div>
                  <div className="font-semibold mt-1">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={featRef} className="container py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl">{t("home.featuresTitle1")} <span className="text-gradient">{t("home.featuresTitle2")}</span></h2>
          <p className="mt-4 text-muted-foreground">{t("home.featuresSub")}</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.key} className="feature glass-card p-6 hover:-translate-y-1 transition-transform">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-lg">{t(`home.features.${f.key}.t`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`home.features.${f.key}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <h2 className="relative font-display text-4xl md:text-5xl">{t("home.ctaTitle")}</h2>
          <p className="relative mt-4 text-muted-foreground max-w-xl mx-auto">{t("home.ctaSub")}</p>
          <div className="relative mt-8">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Link to="/register">{t("home.getStarted")} <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
