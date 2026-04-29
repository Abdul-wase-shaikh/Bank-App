import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InsightsPanel = ({ insights }: { insights: any }) => {
  if (!insights) return null;

  return (
    <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-24 w-24" />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-lg">Smart Insights</h3>
        </div>
        
        <p className="text-sm text-foreground/80 mb-6 leading-relaxed max-w-2xl">
          {insights.summary}
        </p>

        {insights.tips && insights.tips.length > 0 && (
          <div className="space-y-3 mb-6">
            {insights.tips.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-background/50 rounded-xl p-3 border border-border/40 backdrop-blur-sm">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-foreground/90">{tip}</p>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="rounded-full bg-background/50 hover:bg-background border-border/60">
          View full analysis <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
