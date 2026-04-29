import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const PlanCard = ({ plan, onSelect }: { plan: any, onSelect: (p: any) => void }) => {
  return (
    <div 
      className="bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      onClick={() => onSelect(plan)}
    >
      <div className="absolute top-0 right-0 p-3">
        <Button variant="outline" size="sm" className="h-8 rounded-full bg-primary/5 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
          Select
        </Button>
      </div>
      
      {plan.tags && plan.tags.length > 0 && (
        <div className="flex gap-2 mb-3">
          {plan.tags.map((t: string) => (
            <Badge key={t} variant="secondary" className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-semibold">
              {t}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-1 mb-4">
        <span className="text-3xl font-bold tracking-tight">{formatCurrency(plan.price).replace(".00", "")}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 divide-x divide-border/60 mb-4">
        <div className="px-2 first:pl-0 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Validity</div>
          <div className="text-sm font-semibold">{plan.validity}</div>
        </div>
        <div className="px-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Data</div>
          <div className="text-sm font-semibold">{plan.data}</div>
        </div>
        <div className="px-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Calls</div>
          <div className="text-sm font-semibold truncate" title={plan.calls}>{plan.calls}</div>
        </div>
      </div>

      {plan.perks && plan.perks.length > 0 && (
        <div className="pt-3 border-t border-border/40">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Included Perks</div>
          <div className="flex flex-wrap gap-2">
            {plan.perks.map((p: string) => (
              <span key={p} className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
