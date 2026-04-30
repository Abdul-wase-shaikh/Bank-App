import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TxnPinConfirmDialog } from "@/components/TxnPinConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { processBanking } from "@/lib/localBanking";
import { CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";

export interface PayBillBiller {
  id: string;
  name: string;
  category: BillCategoryKey;
  provider: string | null;
  account_ref: string | null;
  default_amount: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  biller: PayBillBiller | null;
  onPaid?: () => void;
}

export const PayBillDialog = ({ open, onOpenChange, biller, onPaid }: Props) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [askPin, setAskPin] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (open && biller) {
      setAmount(biller.default_amount ? String(biller.default_amount) : "");
      const now = new Date();
      setPeriod(`${now.toLocaleString("en-IN", { month: "short" })} ${now.getFullYear()}`);
    }
  }, [open, biller]);

  if (!biller) return null;
  const meta = CATEGORY_MAP[biller.category];

  async function payNow(proof: { txnPin?: string; biometricCredentialId?: string }) {
    if (!user || !biller) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setWorking(true);

    // 1) Move money via local banking handler (withdraw with txn PIN)
    const desc = `Bill: ${biller.name}${period ? ` (${period})` : ""}`;
    const { data, error } = await processBanking({
      action: "withdraw",
      amount: amt,
      description: desc,
      txn_pin: proof.txnPin,
      biometric_credential_id: proof.biometricCredentialId,
    });

    if (error || !data) {
      toast.error(error?.message || "Payment failed");
      setWorking(false);
      return;
    }

    // 2) Find the matching transaction id (most recent withdraw for this user)
    const { data: tx } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "withdraw")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3) Record the bill payment
    const { error: bpError } = await supabase.from("bill_payments").insert({
      user_id: user.id,
      biller_id: biller.id,
      category: biller.category,
      biller_name: biller.name,
      amount: amt,
      status: "completed",
      period_label: period || null,
      transaction_id: tx?.id ?? null,
    } as never);

    setWorking(false);
    if (bpError) {
      toast.warning("Payment processed but logging failed: " + bpError.message);
    } else {
      toast.success(`Paid ₹${amt.toLocaleString("en-IN")} to ${biller.name}`);
    }
    onOpenChange(false);
    onPaid?.();
  }

  return (
    <>
      <Dialog open={open && !askPin} onOpenChange={(v) => { if (!working) onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={`grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br ${meta.tone}`}>
                <meta.icon className="h-4 w-4" />
              </span>
              Pay {biller.name}
            </DialogTitle>
            <DialogDescription>
              {meta.label}{biller.provider ? ` · ${biller.provider}` : ""}
              {biller.account_ref ? ` · ${biller.account_ref}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number" min={1} step="0.01" autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label>Billing period</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. Apr 2026"
                maxLength={40}
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" />
              Funds will be debited from your linked account after PIN authorization.
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={working}>Cancel</Button>
            <Button
              onClick={() => {
                const amt = Number(amount);
                if (!Number.isFinite(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
                setAskPin(true);
              }}
              disabled={working || !amount}
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TxnPinConfirmDialog
        open={askPin}
        onOpenChange={(v) => { setAskPin(v); }}
        title={`Authorize ₹${Number(amount || 0).toLocaleString("en-IN")} to ${biller.name}`}
        description="Enter your 6-digit transaction PIN to pay this bill."
        onConfirmed={(proof) => { setAskPin(false); payNow(proof); }}
      />
    </>
  );
};
