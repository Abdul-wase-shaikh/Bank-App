export const formatCurrency = (n: number | string, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(n) || 0);

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
