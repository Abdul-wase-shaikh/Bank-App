import type { BillCategoryKey } from "@/lib/bills";

export const PROVIDERS: Record<BillCategoryKey, string[]> = {
  electricity: ["Adani Electricity", "Tata Power", "BESCOM", "BESCOM Rural", "CESC", "TNEB", "KSEB", "MSEDCL"],
  water: ["BWSSB", "Delhi Jal Board", "BMC", "Chennai Metro Water", "Kerala Water Authority"],
  lpg: ["Indane Gas", "HP Gas", "Bharat Gas"],
  dth: ["Tata Play", "Airtel Digital TV", "Dish TV", "Sun Direct", "D2H"],
  broadband: ["Airtel Xstream", "JioFiber", "ACT Fibernet", "Hathway", "Excitel", "BSNL Bharat Fiber"],
  landline: ["Airtel Landline", "BSNL Landline", "MTNL"],
  credit_card: ["HDFC Bank", "SBI Card", "ICICI Bank", "Axis Bank", "Citi Bank", "Amex"],
  loan_emi: ["Bajaj Finance", "Muthoot Finance", "HDFC Bank Loans", "SBI Loans"],
  rent: ["Nestaway", "NoBroker", "Zolo", "Stanza Living"],
  society: ["MyGate", "ApnaComplex", "NobrokerHood"],
  property_tax: ["BBMP", "MCGM", "NDMC"],
  mobile_prepaid: ["Jio", "Airtel", "Vi", "BSNL"],
  mobile_postpaid: ["Jio", "Airtel", "Vi", "BSNL"],
  piped_gas: ["Mahanagar Gas", "Indraprastha Gas", "Adani Gas", "Gujarat Gas"],
  fastag: ["Paytm FASTag", "ICICI FASTag", "HDFC FASTag", "Axis FASTag", "SBI FASTag", "IDFC FIRST FASTag"],
  ott: ["Netflix", "Amazon Prime", "Disney+ Hotstar", "SonyLIV", "Zee5"],
  music: ["Spotify", "Apple Music", "YouTube Music", "JioSaavn", "Gaana"],
  gaming: ["PlayStation Plus", "Xbox Game Pass", "Steam", "Nintendo", "Epic Games"],
  other_subscription: ["Google One", "Apple One", "Microsoft 365", "Dropbox"],
  other: ["Other Provider"]
};

export const MOCK_BILL_FETCH = () => {
  return new Promise<{ amount: number, dueDate: Date, billNo: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        amount: Math.floor(Math.random() * 2000) + 100,
        dueDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
        billNo: `INV-${Math.floor(Math.random() * 100000)}`
      });
    }, 1500);
  });
};