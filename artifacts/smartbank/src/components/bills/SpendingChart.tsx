import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";
import { formatCurrency } from "@/lib/format";
import { PieChart as PieChartIcon } from "lucide-react";

export const SpendingChart = ({ data }: { data: { category: BillCategoryKey, amount: number }[] }) => {
  const chartData = data.map(d => ({
    name: CATEGORY_MAP[d.category]?.label || d.category,
    value: d.amount,
    color: `hsl(var(--primary))`
  })).sort((a,b) => b.value - a.value).slice(0, 5);

  const COLORS = ['hsl(var(--primary))', 'hsl(210 90% 60%)', 'hsl(280 80% 60%)', 'hsl(340 80% 60%)', 'hsl(40 90% 50%)'];

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Spending Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No spending data yet.
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
