import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_MAP, nextDueDate, daysUntil, type BillCategoryKey } from "@/lib/bills";

interface Item {
  id: string;
  name: string;
  category: BillCategoryKey;
  due: Date;
  daysLeft: number;
}

export const NotificationsBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("billers")
        .select("id,name,category,due_day")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const list: Item[] = [];
      for (const b of data) {
        const due = nextDueDate(b.due_day ?? null);
        if (!due) continue;
        const dl = daysUntil(due);
        if (dl <= 7) list.push({ id: b.id, name: b.name, category: b.category as BillCategoryKey, due, daysLeft: dl });
      }
      list.sort((a, b) => a.due.getTime() - b.due.getTime());
      setItems(list);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-[1.1rem] w-[1.1rem]" />
          {count > 0 && (
            <span className="absolute top-1 right-1 grid place-items-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="font-medium">Reminders</div>
          <div className="text-xs text-muted-foreground">Bills due in the next 7 days</div>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-sm text-center text-muted-foreground">
            You're all caught up 🎉
          </div>
        ) : (
          <ul className="divide-y divide-border/60 max-h-80 overflow-auto">
            {items.map(it => {
              const meta = CATEGORY_MAP[it.category];
              const tone = it.daysLeft <= 1 ? "text-destructive" : it.daysLeft <= 3 ? "text-amber-500" : "text-muted-foreground";
              return (
                <li key={it.id}>
                  <Link to="/bills" className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/40">
                    <span className={`grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br ${meta.tone}`}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{meta.label}</div>
                    </div>
                    <div className={`text-xs ${tone} text-right whitespace-nowrap`}>
                      {it.daysLeft === 0 ? "Today" : it.daysLeft < 0 ? `Overdue ${Math.abs(it.daysLeft)}d` : `In ${it.daysLeft}d`}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link to="/bills" className="block px-4 py-2 text-center text-xs text-primary hover:underline border-t border-border/60">
          Open Bills
        </Link>
      </PopoverContent>
    </Popover>
  );
};
