import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 mt-20">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></span>
            Smart<span className="text-gradient">Bank</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{t("footer.tagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t("footer.product")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">{t("nav.services")}</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">{t("nav.dashboard")}</Link></li>
            <li><Link to="/transactions" className="hover:text-foreground">{t("tx.title")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t("footer.company")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">{t("nav.about")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("nav.contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t("footer.legal")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>FDIC member</li>
            <li>256-bit encryption</li>
            <li>SOC 2 Type II</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Smart Bank. {t("footer.rights")}
      </div>
    </footer>
  );
};
