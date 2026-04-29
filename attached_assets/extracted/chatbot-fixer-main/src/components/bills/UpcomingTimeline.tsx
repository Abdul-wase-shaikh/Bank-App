import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface UpcomingItem {
  id: string;
  name: string;
  category: BillCategoryKey;
  dueDate: Date;
  amount: number | null;
  daysLeft: number;
}

export const UpcomingTimeline = ({ items }: { items: UpcomingItem[] }) => {
  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No upcoming bills found.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item, idx) => {
              const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP["other"];
              const isUrgent = item.daysLeft <= 3;
              
              return (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.tone} shrink-0`}>
                    <meta.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{meta.label}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">
                      {item.amount ? formatCurrency(item.amount) : "Varies"}
                    </div>
                    <div className={`text-[11px] font-medium mt-0.5 ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {item.daysLeft === 0 ? "Due Today" : item.daysLeft < 0 ? `Overdue by ${Math.abs(item.daysLeft)} days` : `Due in ${item.daysLeft} days`}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/bills/pay/${item.category}?biller=${item.id}`}
                    className="shrink-0 h-8 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors ml-2"
                  >
                    Pay
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
