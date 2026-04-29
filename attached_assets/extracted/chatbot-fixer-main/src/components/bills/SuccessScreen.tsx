import { CheckCircle2, ChevronRight, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "@/lib/format";

export const SuccessScreen = ({
  title,
  amount,
  refNumber,
  billerName,
  date,
  onDone
}: {
  title: string;
  amount: number;
  refNumber: string;
  billerName: string;
  date: Date;
  onDone: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in zoom-in-95 duration-500">
      <div className="h-24 w-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <div className="text-4xl font-bold tracking-tight text-foreground mb-8">
        {formatCurrency(amount)}
      </div>
      
      <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl p-5 mb-8 space-y-4 text-left shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Paid to</span>
          <span className="font-medium">{billerName}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Reference No</span>
          <span className="font-medium">{refNumber}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Date & Time</span>
          <span className="font-medium">{formatDate(date)}</span>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-3">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => {}}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" /> Receipt
          </Button>
        </div>
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
};
