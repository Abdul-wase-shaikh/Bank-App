export const mockFastagBalance = (vehicleNo: string) => {
  return new Promise<{ balance: number, bank: string, status: "ACTIVE" | "LOW_BALANCE" | "BLACKLISTED" }>((resolve) => {
    setTimeout(() => {
      const balance = Math.floor(Math.random() * 1500);
      const banks = ["ICICI Bank", "HDFC Bank", "IDFC FIRST Bank", "SBI", "Axis Bank", "Paytm Payments Bank"];
      resolve({
        balance,
        bank: banks[Math.floor(Math.random() * banks.length)],
        status: balance < 200 ? "LOW_BALANCE" : (Math.random() > 0.95 ? "BLACKLISTED" : "ACTIVE")
      });
    }, 1000);
  });
};