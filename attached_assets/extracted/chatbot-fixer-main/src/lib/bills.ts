import {
  Smartphone, Phone, Tv, Wifi, PhoneCall,
  Zap, Droplet, Flame, Pipette,
  Home, Building2, Landmark,
  CreditCard, Car,
  Film, Music, Gamepad2, Sparkles,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type BillCategoryKey =
  | "mobile_prepaid" | "mobile_postpaid" | "dth" | "broadband" | "landline"
  | "electricity" | "water" | "lpg" | "piped_gas"
  | "rent" | "society" | "property_tax"
  | "credit_card" | "loan_emi" | "fastag"
  | "ott" | "music" | "gaming" | "other_subscription"
  | "other";

export interface CategoryMeta {
  key: BillCategoryKey;
  label: string;
  group: "Mobile & Communication" | "Utilities" | "Household" | "Financial" | "Subscriptions" | "Other";
  icon: LucideIcon;
  refPlaceholder: string;
  /** Tailwind classes for the icon tile background */
  tone: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "mobile_prepaid", label: "Prepaid Mobile",   group: "Mobile & Communication", icon: Smartphone, refPlaceholder: "Mobile number", tone: "from-sky-500/20 to-sky-500/5 text-sky-500" },
  { key: "mobile_postpaid",label: "Postpaid Mobile",  group: "Mobile & Communication", icon: Phone,      refPlaceholder: "Mobile number", tone: "from-blue-500/20 to-blue-500/5 text-blue-500" },
  { key: "dth",            label: "DTH",              group: "Mobile & Communication", icon: Tv,         refPlaceholder: "Subscriber ID", tone: "from-indigo-500/20 to-indigo-500/5 text-indigo-500" },
  { key: "broadband",      label: "Broadband",        group: "Mobile & Communication", icon: Wifi,       refPlaceholder: "Customer ID",   tone: "from-cyan-500/20 to-cyan-500/5 text-cyan-500" },
  { key: "landline",       label: "Landline",         group: "Mobile & Communication", icon: PhoneCall,  refPlaceholder: "Landline no.",  tone: "from-slate-500/20 to-slate-500/5 text-slate-500" },

  { key: "electricity",    label: "Electricity",      group: "Utilities",              icon: Zap,        refPlaceholder: "Consumer no.",  tone: "from-amber-500/20 to-amber-500/5 text-amber-500" },
  { key: "water",          label: "Water",            group: "Utilities",              icon: Droplet,    refPlaceholder: "Connection ID", tone: "from-blue-400/20 to-blue-400/5 text-blue-400" },
  { key: "lpg",            label: "LPG / Gas",        group: "Utilities",              icon: Flame,      refPlaceholder: "Consumer ID",   tone: "from-orange-500/20 to-orange-500/5 text-orange-500" },
  { key: "piped_gas",      label: "Piped Gas",        group: "Utilities",              icon: Pipette,    refPlaceholder: "BP / CA no.",   tone: "from-rose-500/20 to-rose-500/5 text-rose-500" },

  { key: "rent",           label: "Rent",             group: "Household",              icon: Home,       refPlaceholder: "Landlord ref",  tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-500" },
  { key: "society",        label: "Society / Maint.", group: "Household",              icon: Building2,  refPlaceholder: "Flat / unit",   tone: "from-teal-500/20 to-teal-500/5 text-teal-500" },
  { key: "property_tax",   label: "Property Tax",     group: "Household",              icon: Landmark,   refPlaceholder: "Property ID",   tone: "from-lime-500/20 to-lime-500/5 text-lime-500" },

  { key: "credit_card",    label: "Credit Card",      group: "Financial",              icon: CreditCard, refPlaceholder: "Last 4 digits", tone: "from-violet-500/20 to-violet-500/5 text-violet-500" },
  { key: "loan_emi",       label: "Loan EMI",         group: "Financial",              icon: Car,        refPlaceholder: "Loan account",  tone: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-500" },
  { key: "fastag",         label: "FASTag",           group: "Financial",              icon: Car,        refPlaceholder: "Vehicle Number", tone: "from-indigo-500/20 to-indigo-500/5 text-indigo-500" },

  { key: "ott",            label: "OTT / Streaming",  group: "Subscriptions",          icon: Film,       refPlaceholder: "Account email", tone: "from-pink-500/20 to-pink-500/5 text-pink-500" },
  { key: "music",          label: "Music",            group: "Subscriptions",          icon: Music,      refPlaceholder: "Account email", tone: "from-purple-500/20 to-purple-500/5 text-purple-500" },
  { key: "gaming",         label: "Gaming",           group: "Subscriptions",          icon: Gamepad2,   refPlaceholder: "Account email", tone: "from-red-500/20 to-red-500/5 text-red-500" },
  { key: "other_subscription", label: "Other Sub.",   group: "Subscriptions",          icon: Sparkles,   refPlaceholder: "Account ref",   tone: "from-yellow-500/20 to-yellow-500/5 text-yellow-500" },

  { key: "other",          label: "Other",            group: "Other",                  icon: HelpCircle, refPlaceholder: "Reference",     tone: "from-muted-foreground/20 to-muted-foreground/5 text-muted-foreground" },
];

export const CATEGORY_MAP: Record<BillCategoryKey, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c]),
) as Record<BillCategoryKey, CategoryMeta>;

export const GROUPS: CategoryMeta["group"][] = [
  "Mobile & Communication", "Utilities", "Household", "Financial", "Subscriptions", "Other",
];

/** Compute the next due date given today and a "due day of month" (1-31). */
export function nextDueDate(dueDay: number | null | undefined, from = new Date()): Date | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null;
  const y = from.getFullYear();
  const m = from.getMonth();
  // Last day of current month
  const lastThisMonth = new Date(y, m + 1, 0).getDate();
  const dayThisMonth = Math.min(dueDay, lastThisMonth);
  const candidate = new Date(y, m, dayThisMonth);
  if (candidate.getTime() >= new Date(y, m, from.getDate()).getTime()) return candidate;
  const lastNextMonth = new Date(y, m + 2, 0).getDate();
  return new Date(y, m + 1, Math.min(dueDay, lastNextMonth));
}

export function daysUntil(date: Date): number {
  const ms = date.getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
