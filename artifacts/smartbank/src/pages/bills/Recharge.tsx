import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Smartphone, Contact, ArrowLeft, Search, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { detectOperator, filterPlans } from "@/lib/recharge";
import { CIRCLES } from "@/lib/mocks/operators";
import { OperatorBadge } from "@/components/bills/OperatorBadge";
import { cn } from "@/lib/utils";
import { PlanCard } from "@/components/bills/PlanCard";
import { ReviewSheet } from "@/components/bills/ReviewSheet";
import { SuccessScreen } from "@/components/bills/SuccessScreen";
import { TxnPinConfirmDialog } from "@/components/TxnPinConfirmDialog";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { processBanking } from "@/lib/localBanking";

export default function Recharge() {
  useGsapPage();
  const { user } = useAuth();
  const nav = useNavigate();

  const [step, setStep] = useState<"number" | "plans" | "success">("number");
  const [phone, setPhone] = useState("");
  const [operatorInfo, setOperatorInfo] = useState<{operator: string, circle: string} | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [activeTab, setActiveTab] = useState("For You");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [askPin, setAskPin] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (manualOverride) return;
    if (phone.length >= 4) {
      const info = detectOperator(phone);
      setOperatorInfo(info);
    } else {
      setOperatorInfo(null);
    }
  }, [phone, manualOverride]);

  const SIM_OPTIONS = [
    { name: "Jio",    accent: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/40" },
    { name: "Airtel", accent: "from-red-500/20 to-red-500/5 text-red-500 border-red-500/40" },
    { name: "Vi",     accent: "from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/40" },
    { name: "BSNL",   accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/40" },
  ];

  const pickOperator = (name: string) => {
    setManualOverride(true);
    setOperatorInfo({
      operator: name,
      circle: operatorInfo?.circle ?? CIRCLES[0],
    });
  };

  useEffect(() => {
    if (operatorInfo && step === "plans") {
      setPlans(filterPlans(operatorInfo.operator, activeTab, ""));
    }
  }, [operatorInfo, step, activeTab]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setStep("plans");
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setReviewOpen(true);
  };

  const handleReviewConfirm = () => {
    setReviewOpen(false);
    setAskPin(true);
  };

  const processPayment = async (proof: any) => {
    if (!user || !selectedPlan) return;
    setWorking(true);

    const { data, error } = await processBanking({
      action: "withdraw",
      amount: selectedPlan.price,
      description: `Recharge: ${phone}`,
      txn_pin: proof.txnPin,
      biometric_credential_id: proof.biometricCredentialId,
    });

    if (error || !data) {
      toast.error(error?.message || "Payment failed");
      setWorking(false);
      return;
    }

    await supabase.from("bill_payments").insert({
      user_id: user.id,
      category: "mobile_prepaid",
      biller_name: `Mobile ${phone}`,
      amount: selectedPlan.price,
      status: "completed",
      period_label: selectedPlan.validity,
    });

    setWorking(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <SuccessScreen
          title="Recharge Successful"
          amount={selectedPlan?.price || 0}
          billerName={`Mobile ${phone}`}
          refNumber={`TXN${Math.floor(Math.random() * 1000000000)}`}
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
        <h1 className="text-2xl font-display font-bold">Mobile Recharge</h1>
      </div>

      {step === "number" && (
        <div className="max-w-md mx-auto" data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <Label className="text-muted-foreground mb-3 block">Enter Mobile Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="tel"
                    className="pl-10 pr-12 h-14 text-lg rounded-2xl bg-secondary/30 border-border/60"
                    placeholder="99999 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
                      <Contact className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-muted-foreground">Choose SIM / Operator</Label>
                  {operatorInfo && !manualOverride && (
                    <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                      Auto-detected
                    </span>
                  )}
                  {manualOverride && (
                    <button
                      type="button"
                      onClick={() => { setManualOverride(false); }}
                      className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SIM_OPTIONS.map((sim) => {
                    const active = operatorInfo?.operator === sim.name;
                    return (
                      <button
                        type="button"
                        key={sim.name}
                        onClick={() => pickOperator(sim.name)}
                        className={cn(
                          "h-16 rounded-2xl border bg-gradient-to-br flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                          active
                            ? `${sim.accent} shadow-sm`
                            : "border-border/60 from-secondary/40 to-secondary/10 text-foreground hover:border-primary/40",
                        )}
                      >
                        <span className="text-sm font-bold tracking-tight">{sim.name}</span>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-current" : "bg-muted-foreground/40",
                        )} />
                      </button>
                    );
                  })}
                </div>
                {operatorInfo && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Circle: <span className="text-foreground font-medium">{operatorInfo.circle}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl text-lg"
                disabled={phone.length < 10 || !operatorInfo}
              >
                Continue
              </Button>
            </form>
          </div>
        </div>
      )}

      {step === "plans" && (
        <div data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-5 mb-6 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-lg font-bold">{phone}</div>
              {operatorInfo && (
                <div className="text-sm text-muted-foreground mt-0.5">
                  {operatorInfo.operator} - {operatorInfo.circle}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep("number")} className="rounded-full h-8">
              Change
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="w-full justify-start h-auto p-1 bg-secondary/50 rounded-xl overflow-x-auto flex-nowrap hide-scrollbar">
              {["For You", "Unlimited", "Data", "Validity", "Top-Up"].map(tab => (
                <TabsTrigger key={tab} value={tab} className="rounded-lg px-4 py-2 whitespace-nowrap">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSelect={handlePlanSelect} />
            ))}
            {plans.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No plans found for this category.
              </div>
            )}
          </div>
        </div>
      )}

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        amount={selectedPlan?.price || 0}
        billerName={`Mobile Recharge - ${phone}`}
        details={[
          { label: "Mobile Number", value: phone },
          { label: "Operator", value: operatorInfo?.operator || "Unknown" },
          { label: "Circle", value: operatorInfo?.circle || "Unknown" },
          { label: "Validity", value: selectedPlan?.validity || "-" },
          { label: "Data", value: selectedPlan?.data || "-" },
        ]}
        onConfirm={handleReviewConfirm}
        loading={working}
      />

      <TxnPinConfirmDialog
        open={askPin}
        onOpenChange={setAskPin}
        title={`Recharge ₹${selectedPlan?.price || 0}`}
        description="Enter your 6-digit transaction PIN to confirm."
        onConfirmed={(proof) => { setAskPin(false); processPayment(proof); }}
      />
    </div>
  );
}