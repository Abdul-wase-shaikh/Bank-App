import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

export const ReviewSheet = ({
  open,
  onOpenChange,
  amount,
  billerName,
  details,
  onConfirm,
  loading
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  billerName: string;
  details: { label: string; value: string }[];
  onConfirm: () => void;
  loading: boolean;
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md mx-auto h-[85vh] flex flex-col px-6">
        <SheetHeader className="text-left mt-2 mb-6">
          <SheetTitle className="text-2xl">Review Payment</SheetTitle>
          <SheetDescription>Please review the details before paying.</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-6 mb-6">
            <span className="text-sm text-muted-foreground mb-1">Paying</span>
            <span className="text-lg font-semibold mb-3">{billerName}</span>
            <span className="text-5xl font-bold tracking-tight">{formatCurrency(amount)}</span>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-4 space-y-4 border border-border/50">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="mt-auto py-6 sm:justify-center">
          <Button 
            className="w-full h-14 text-lg rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Pay Now"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
