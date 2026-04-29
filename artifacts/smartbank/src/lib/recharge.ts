import { getOperatorMock } from "./mocks/operators";
import { RECHARGE_PLANS, type Plan } from "./mocks/rechargePlans";

export const detectOperator = (phone: string) => {
  return getOperatorMock(phone);
};

export const filterPlans = (operator: string, tab: string, sort: string): Plan[] => {
  const plans = RECHARGE_PLANS[operator] || [];
  let filtered = plans.filter(p => p.tab === tab);
  
  if (sort === "price_asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered.sort((a, b) => b.price - a.price);
  // Add more sorting if needed
  
  return filtered;
};