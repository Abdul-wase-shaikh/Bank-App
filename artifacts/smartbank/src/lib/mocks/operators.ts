export const OPERATORS = [
  { id: "jio", name: "Jio", prefix: ["70", "79", "89", "99"] },
  { id: "airtel", name: "Airtel", prefix: ["98", "97", "88", "77"] },
  { id: "vi", name: "Vi", prefix: ["95", "96", "85", "86"] },
  { id: "bsnl", name: "BSNL", prefix: ["94", "84"] }
];

export const CIRCLES = [
  "Delhi NCR", "Mumbai", "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Kerala", "Gujarat"
];

export const getOperatorMock = (phone: string) => {
  if (phone.length < 2) return null;
  const pref = phone.substring(0, 2);
  const op = OPERATORS.find(o => o.prefix.includes(pref)) || OPERATORS[0];
  const circle = CIRCLES[Math.floor(Math.random() * CIRCLES.length)];
  return { operator: op.name, circle };
};
