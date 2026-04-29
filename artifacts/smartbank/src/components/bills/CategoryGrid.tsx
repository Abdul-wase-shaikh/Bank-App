import { CATEGORIES, CATEGORY_MAP, GROUPS } from "@/lib/bills";
import { Link } from "react-router-dom";

export const CategoryGrid = () => {
  return (
    <div className="space-y-6">
      {GROUPS.map(group => {
        const groupCats = CATEGORIES.filter(c => c.group === group);
        if (groupCats.length === 0) return null;
        return (
          <div key={group} className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight text-foreground/80 pl-1">{group}</h3>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {groupCats.map(c => (
                <Link 
                  key={c.key} 
                  to={
                    c.key === "mobile_prepaid" ? "/bills/recharge" :
                    c.key === "mobile_postpaid" ? "/bills/recharge" :
                    c.key === "ott" || c.key === "music" || c.key === "gaming" ? "/bills/subscriptions" :
                    `/bills/pay/${c.key}`
                  }
                  className="flex flex-col items-center gap-2 group text-center"
                >
                  <div className={`h-14 w-14 rounded-[1.25rem] flex items-center justify-center bg-gradient-to-br transition-transform group-hover:scale-105 group-active:scale-95 ${c.tone}`}>
                    <c.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] leading-tight font-medium text-muted-foreground group-hover:text-foreground line-clamp-2 px-1">
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
