import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGsapPage } from "@/hooks/useGsapPage";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { CATEGORY_MAP, type BillCategoryKey } from "@/lib/bills";
import { PROVIDERS, MOCK_BILL_FETCH } from "@/lib/mocks/providers";
import { ReviewSheet } from "@/components/bills/ReviewSheet";
import { SuccessScreen } from "@/components/bills/SuccessScreen";
import { TxnPinConfirmDialog } from "@/components/TxnPinConfirmDialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { processBanking } from "@/lib/localBanking";

export default function PayBill() {
  useGsapPage();
  const { category } = useParams<{ category: BillCategoryKey }>();
  const [searchParams] = useSearchParams();
  const billerId = searchParams.get("biller");
  const { user } = useAuth();
  const nav = useNavigate();

  const meta = CATEGORY_MAP[category as BillCategoryKey] || CATEGORY_MAP["other"];
  const providers = PROVIDERS[category as BillCategoryKey] || PROVIDERS["other"];

  const [step, setStep] = useState<"provider" | "details" | "bill" | "success">("provider");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [consumerNo, setConsumerNo] = useState("");
  const [billData, setBillData] = useState<any>(null);
  
  const [loadingBill, setLoadingBill] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [askPin, setAskPin] = useState(false);
  const [working, setWorking] = useState(false);

  // If a biller ID is passed, we could fetch it and pre-fill. For now, mock a direct jump to bill.
  useEffect(() => {
    if (billerId && user) {
      // Mocking fetch existing biller logic for speed
      setSelectedProvider(providers[0]);
      setConsumerNo("1234567890");
      fetchBill();
    }
  }, [billerId, user]);

  const handleProviderSelect = (p: string) => {
    setSelectedProvider(p);
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerNo) return;
    fetchBill();
  };

  const fetchBill = async () => {
    setLoadingBill(true);
    setStep("bill");
    try {
      const data = await MOCK_BILL_FETCH();
      setBillData(data);
    } catch (e) {
      toast.error("Failed to fetch bill");
      setStep("details");
    }
    setLoadingBill(false);
  };

  const handleReviewConfirm = () => {
    setReviewOpen(false);
    setAskPin(true);
  };

  const processPayment = async (proof: any) => {
    if (!user || !billData) return;
    setWorking(true);

    const { data, error } = await processBanking({
      action: "withdraw",
      amount: billData.amount,
      description: `${meta.label} Bill: ${selectedProvider}`,
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
      category: category as BillCategoryKey,
      biller_name: selectedProvider,
      amount: billData.amount,
      status: "completed",
      period_label: "Current Bill",
    } as never);

    setWorking(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <SuccessScreen
          title="Payment Successful"
          amount={billData?.amount || 0}
          billerName={selectedProvider}
          refNumber={billData?.billNo || "TXN123456"}
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
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.tone}`}>
            <meta.icon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-display font-bold">Pay {meta.label}</h1>
        </div>
      </div>

      {step === "provider" && (
        <div data-anim>
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              className="pl-10 h-14 rounded-2xl bg-card border-border/60 text-base shadow-sm"
              placeholder={`Search ${meta.label} provider...`}
            />
          </div>
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-secondary/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              All Providers
            </div>
            <div className="divide-y divide-border/60">
              {providers.map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderSelect(p)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-sm">{p}</span>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="max-w-md mx-auto" data-anim>
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedProvider.charAt(0)}
              </div>
              <div className="font-medium">{selectedProvider}</div>
            </div>
            
            <form onSubmit={handleDetailsSubmit}>
              <div className="mb-6">
                <Label className="text-muted-foreground mb-3 block">{meta.refPlaceholder}</Label>
                <Input
                  className="h-14 text-lg rounded-2xl bg-secondary/30 border-border/60"
                  placeholder="Enter details"
                  value={consumerNo}
                  onChange={(e) => setConsumerNo(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg" disabled={!consumerNo}>
                Fetch Bill
              </Button>
              <Button type="button" variant="ghost" className="w-full mt-3" onClick={() => setStep("provider")}>
                Change Provider
              </Button>
            </form>
          </div>
        </div>
      )}

      {step === "bill" && (
        <div className="max-w-md mx-auto" data-anim>
          {loadingBill ? (
            <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="font-medium mb-1">Fetching your bill...</h3>
              <p className="text-sm text-muted-foreground">Connecting to {selectedProvider}</p>
            </div>
          ) : billData ? (
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedProvider.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{selectedProvider}</div>
                    <div className="text-xs text-muted-foreground">{consumerNo}</div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="text-sm text-muted-foreground mb-2">Total Due</div>
                <div className="text-4xl font-bold tracking-tight mb-2">{formatCurrency(billData.amount)}</div>
                <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${new Date() > billData.dueDate ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  Due on {billData.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 mb-6 border border-border/40">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bill Number</span>
                  <span className="font-medium">{billData.billNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumer Name</span>
                  <span className="font-medium">{user?.user_metadata?.full_name || "User"}</span>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-lg bg-gradient-primary text-primary-foreground shadow-glow" onClick={() => setReviewOpen(true)}>
                Pay {formatCurrency(billData.amount)}
              </Button>
            </div>
          ) : (
             <div className="text-center py-12">Failed to load bill.</div>
          )}
        </div>
      )}

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        amount={billData?.amount || 0}
        billerName={selectedProvider}
        details={[
          { label: "Category", value: meta.label },
          { label: meta.refPlaceholder, value: consumerNo },
          { label: "Bill No", value: billData?.billNo || "-" },
        ]}
        onConfirm={handleReviewConfirm}
        loading={working}
      />

      <TxnPinConfirmDialog
        open={askPin}
        onOpenChange={setAskPin}
        title={`Pay ₹${billData?.amount || 0}`}
        description="Enter your 6-digit transaction PIN to confirm."
        onConfirmed={(proof) => { setAskPin(false); processPayment(proof); }}
      />
    </div>
  );
}