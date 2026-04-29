export const deriveLocalInsights = (payments: any[]) => {
  if (!payments || payments.length === 0) {
    return { empty: true, summary: "Not enough data to generate insights. Start paying bills to see analytics here." };
  }
  
  const total = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const subs = payments.filter(p => ["ott", "music", "gaming", "other_subscription"].includes(p.category));
  
  const subFindings = subs.map(s => ({
    biller_name: s.biller_name,
    monthly_amount: s.amount,
    note: "Detected recurring subscription"
  }));
  
  return {
    summary: `You have spent ₹${total.toLocaleString("en-IN")} across ${payments.length} transactions.`,
    predictions: [],
    subscriptionFindings: subFindings,
    tips: [
      "Review your subscriptions regularly.",
      "Enable auto-pay for utilities to avoid late fees."
    ]
  };
};