import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export const QuickActionTile = ({ icon: Icon, label, to }: { icon: LucideIcon, label: string, to: string }) => {
  return (
    <Link to={to} className="flex flex-col items-center gap-3 group">
      <div className="h-16 w-16 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-md transition-all group-active:scale-95 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
        <Icon className="h-7 w-7 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
};