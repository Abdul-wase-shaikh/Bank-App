import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { LANGS } from "@/i18n/config";
import {
  Menu,
  X,
  ShieldCheck,
  Settings,
  User,
  LogOut,
  Languages,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/services", label: t("nav.services") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            Smart<span className="text-gradient">Bank</span>
          </span>
        </Link>

        {/* Desktop nav — public links hidden once logged in */}
        <nav className="hidden md:flex items-center gap-1">
          {!user &&
            links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                </span>
              </NavLink>
              <NavLink
                to="/bills"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <Receipt className="h-4 w-4" /> Bills
                </span>
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm ${
                  isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {t("nav.admin")}
            </NavLink>
          )}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 rounded-full border-border/60 bg-secondary/40 backdrop-blur-md hover:bg-secondary/70"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/profile")}>
                  <User className="h-4 w-4 mr-2" /> {t("nav.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/security")}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="h-4 w-4 mr-2" />
                    <span className="flex-1">Language</span>
                    <span className="text-xs text-muted-foreground ml-2">{currentLang.flag} {currentLang.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-44">
                      {LANGS.map(l => (
                        <DropdownMenuItem
                          key={l.code}
                          onClick={() => i18n.changeLanguage(l.code)}
                          className={i18n.language === l.code ? "bg-accent/20 text-accent" : ""}
                        >
                          <span className="mr-2">{l.flag}</span>{l.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    await signOut();
                    nav("/");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <LanguageSwitcher />
              <Button variant="ghost" onClick={() => nav("/login")}>
                {t("nav.login")}
              </Button>
              <Button
                onClick={() => nav("/register")}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {t("nav.openAccount")}
              </Button>
            </>
          )}
        </div>

        {/* Mobile trigger */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          {!user && <LanguageSwitcher />}
          <button
            className="p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={t("nav.menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="container py-3 flex flex-col gap-1">
            {!user &&
              links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                </Link>
                <Link
                  to="/bills"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" /> Bills
                </Link>
                <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Settings
                </div>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <User className="h-4 w-4" /> {t("nav.profile")}
                </Link>
                <Link
                  to="/security"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" /> Security
                </Link>
                <div className="px-3 py-2 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <LanguageSwitcher />
                </div>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-accent"
              >
                {t("nav.admin")}
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={async () => {
                    await signOut();
                    nav("/");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.signOut")}
                </Button>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      nav("/login");
                    }}
                  >
                    {t("nav.login")}
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                    onClick={() => {
                      setOpen(false);
                      nav("/register");
                    }}
                  >
                    {t("nav.register")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
