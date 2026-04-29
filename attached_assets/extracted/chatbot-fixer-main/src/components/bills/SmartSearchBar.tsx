import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SmartSearchBar = () => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <Input
        className="pl-10 h-12 rounded-2xl bg-card border-border/60 shadow-sm focus-visible:ring-primary/50 text-base"
        placeholder="Search for billers, mobile numbers, or categories..."
      />
    </div>
  );
};
