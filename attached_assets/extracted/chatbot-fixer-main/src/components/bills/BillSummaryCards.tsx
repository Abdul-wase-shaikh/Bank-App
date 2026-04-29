import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Receipt, TrendingUp } from "lucide-react";

export const BillSummaryCards = ({ spent, lastMonthSpent }: { spent: number, lastMonthSpent: number, upcomingCount?: number }) => {
  const trend = lastMonthSpent ? ((spent - lastMonthSpent) / lastMonthSpent) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass-card border-none bg-primary/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Spent this month</p>
            <h4 className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(spent)}</h4>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-card">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${trend > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
            <TrendingUp className={`h-6 w-6 ${trend > 0 ? '' : 'rotate-180 scale-y-[-1]'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">vs Last Month</p>
            <h4 className="text-xl font-bold tracking-tight text-foreground">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </h4>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
