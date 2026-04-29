import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { mockFastagBalance } from "@/lib/mocks/fastag";
import { ReviewSheet } from "@/components/bills/ReviewSheet";
import { SuccessScreen } from "@/components/bills/SuccessScreen";
import { TxnPinConfirmDialog } from "@/components/TxnPinConfirmDialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export default function Fastag() {
  useGsapPage();
  const { user } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState<"vehicle" | "balance" | "recharge" | "success">("vehicle");
  const [vehicleNo, setVehicleNo] = useState("");
  const [fastagData, setFastagData] = useState<any>(null);
  const [amount, setAmount] = useState("500");
  
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [askPin, setAskPin] = useState(false);
  const [working, setWorking] = useState(false);

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicleNo.length < 6) {
      toast.error("Enter a valid vehicle number");
      return;
    }
    setLoading(true);
    try {
      const data = await mockFastagBalance(vehicleNo);
      setFastagData(data);
      setStep("balance");
    } catch (e) {
      toast.error("Could not fetch FASTag details");
    }
    setLoading(false);
  };

  const handleReviewConfirm = () => {
    setReviewOpen(false);
    setAskPin(true);
  };

  const processPayment = async (proof: any) => {
    if (!user || !fastagData) return;
    setWorking(true);

    const amt = Number(amount);
    const { data, error } = await supabase.functions.invoke("banking", {
      body: {
        action: "withdraw",
        amount: amt,
        description: `FASTag Recharge: ${vehicleNo}`,
        txn_pin: proof.txnPin,
        biometric_credential_id: proof.biometricCredentialId,
      },
    });

    if (error || (data && (data as any).error)) {
      toast.error((data as any)?.error || error?.message || "Payment failed");
      setWorking(false);
      return;
    }

    await supabase.from("bill_payments").insert({
      user_id: user.id,
      category: "other",
      biller_name: `FASTag - ${fastagData.bank}`,
      amount: amt,
      status: "completed",
      period_label: "Recharge",
    });

    setWorking(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <SuccessScreen
          title="FASTag Recharge Successful"
          amount={Number(amount)}
          billerName={`FASTag - ${fastagData.bank}`}
          refNumber={`FTG${Math.floor(Math.random() * 1000000000)}`}
          date={new Date()}
          onDone={() => nav("/bills")}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8" data-anim>
        <Link to="/bills" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-500">
            <Car className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-display font-bold">FASTag Recharge</h1>
        </div>
      </div>

      {step === "vehicle" && (
        <div className="max-w-md mx-auto" data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <form onSubmit={handleVehicleSubmit}>
              <div className="mb-6">
                <Label className="text-muted-foreground mb-3 block">Vehicle Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    className="pl-10 h-14 text-lg rounded-2xl bg-secondary/30 border-border/60 uppercase"
                    placeholder="e.g. MH 01 AB 1234"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg" disabled={vehicleNo.length < 6 || loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check Balance"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {step === "balance" && fastagData && (
        <div className="max-w-md mx-auto" data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Vehicle</div>
                <div className="text-2xl font-bold tracking-tight uppercase">{vehicleNo}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Bank</div>
                <div className="font-semibold">{fastagData.bank}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-center mb-6">
              <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
              <div className={`text-3xl font-bold tracking-tight ${fastagData.balance < 200 ? 'text-destructive' : 'text-emerald-500'}`}>
                {formatCurrency(fastagData.balance)}
              </div>
              {fastagData.status === "LOW_BALANCE" && (
                <div className="text-xs text-destructive font-medium mt-2 bg-destructive/10 inline-block px-2 py-1 rounded-full">
                  Low balance. Please recharge.
                </div>
              )}
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg" onClick={() => setStep("recharge")}>
              Recharge Now
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => setStep("vehicle")}>
              Different Vehicle
            </Button>
          </div>
        </div>
      )}

      {step === "recharge" && (
        <div className="max-w-md mx-auto" data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 mb-6">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div className="font-medium uppercase">{vehicleNo}</div>
            </div>

            <div className="mb-6">
              <Label className="text-muted-foreground mb-3 block">Amount to Recharge</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-xl font-medium text-foreground">₹</span>
                </div>
                <Input
                  type="number"
                  className="pl-8 h-16 text-2xl font-bold rounded-2xl bg-secondary/30 border-border/60"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-3">
                {["500", "1000", "2000"].map(amt => (
                  <Button 
                    key={amt} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setAmount(amt)}
                    className="flex-1 rounded-full"
                  >
                    +₹{amt}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg bg-gradient-primary text-primary-foreground shadow-glow" 
              onClick={() => setReviewOpen(true)}
              disabled={!amount || Number(amount) < 100}
            >
              Recharge FASTag
            </Button>
          </div>
        </div>
      )}

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        amount={Number(amount)}
        billerName={`FASTag - ${fastagData?.bank}`}
        details={[
          { label: "Vehicle Number", value: vehicleNo.toUpperCase() },
          { label: "Bank", value: fastagData?.bank || "-" },
          { label: "Current Balance", value: fastagData ? formatCurrency(fastagData.balance) : "-" },
        ]}
        onConfirm={handleReviewConfirm}
        loading={working}
      />

      <TxnPinConfirmDialog
        open={askPin}
        onOpenChange={setAskPin}
        title={`Recharge FASTag ₹${amount}`}
        description="Enter your 6-digit transaction PIN to confirm."
        onConfirmed={(proof) => { setAskPin(false); processPayment(proof); }}
      />
    </div>
  );
}