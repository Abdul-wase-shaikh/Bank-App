// ---------------------------------------------------------------------------
// Indian mobile operator detection
// ---------------------------------------------------------------------------
// The previous implementation only looked at the first 2 digits and silently
// fell back to OPERATORS[0] (Jio) for anything it didn't recognise, which is
// why every number looked like a Jio number.
//
// Indian mobile numbers always start with 6, 7, 8 or 9 and have 10 digits.
// We use a 4-digit prefix table for accuracy. Prefixes here are based on
// publicly documented MNP series allocations; with mobile-number portability
// they aren't 100% guaranteed, but they're the right answer the vast
// majority of the time and degrade to "Unknown" instead of "Jio" when we
// genuinely don't know.
// ---------------------------------------------------------------------------

export type OperatorName = "Jio" | "Airtel" | "Vi" | "BSNL";

export const OPERATORS: { id: string; name: OperatorName }[] = [
  { id: "jio", name: "Jio" },
  { id: "airtel", name: "Airtel" },
  { id: "vi", name: "Vi" },
  { id: "bsnl", name: "BSNL" },
];

export const CIRCLES = [
  "Delhi NCR",
  "Mumbai",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Kerala",
  "Gujarat",
  "Rajasthan",
  "West Bengal",
  "Uttar Pradesh",
  "Punjab",
];

// 4-digit prefix → operator. Mobile-number portability means these are
// best-guesses based on original allocations; each prefix gets exactly one
// owner here so detection is deterministic.
const PREFIX_4_TABLE: ReadonlyArray<[string, OperatorName]> = [
  // ---- Jio ----
  ["6000", "Jio"], ["6001", "Jio"], ["7000", "Jio"], ["7001", "Jio"],
  ["7002", "Jio"], ["7003", "Jio"], ["7004", "Jio"], ["7005", "Jio"],
  ["7006", "Jio"], ["7007", "Jio"], ["7008", "Jio"], ["7009", "Jio"],
  ["7010", "Jio"], ["7012", "Jio"], ["7400", "Jio"], ["7401", "Jio"],
  ["7405", "Jio"], ["7406", "Jio"], ["7410", "Jio"], ["8200", "Jio"],
  ["8201", "Jio"], ["8205", "Jio"], ["8210", "Jio"], ["8888", "Jio"],
  ["8900", "Jio"], ["8905", "Jio"], ["8910", "Jio"], ["9000", "Jio"],
  ["9001", "Jio"], ["9090", "Jio"], ["9099", "Jio"],
  // ---- Airtel ----
  ["7011", "Airtel"], ["7042", "Airtel"], ["7065", "Airtel"],
  ["7290", "Airtel"], ["7291", "Airtel"], ["7503", "Airtel"],
  ["7838", "Airtel"], ["8800", "Airtel"], ["8826", "Airtel"],
  ["8860", "Airtel"], ["8882", "Airtel"], ["9711", "Airtel"],
  ["9810", "Airtel"], ["9811", "Airtel"], ["9871", "Airtel"],
  ["9899", "Airtel"], ["9900", "Airtel"], ["9901", "Airtel"],
  ["9902", "Airtel"], ["9971", "Airtel"], ["9999", "Airtel"],
  // ---- Vi (Vodafone Idea) ----
  ["8810", "Vi"], ["9560", "Vi"], ["9650", "Vi"], ["9818", "Vi"],
  ["9821", "Vi"], ["9833", "Vi"], ["9869", "Vi"], ["9892", "Vi"],
  // ---- BSNL ----
  ["9434", "BSNL"], ["9435", "BSNL"], ["9436", "BSNL"], ["9437", "BSNL"],
  ["9438", "BSNL"], ["9439", "BSNL"], ["9440", "BSNL"], ["9441", "BSNL"],
  ["9442", "BSNL"], ["9443", "BSNL"], ["9444", "BSNL"], ["9445", "BSNL"],
  ["9446", "BSNL"], ["9447", "BSNL"], ["9448", "BSNL"], ["9449", "BSNL"],
  ["9450", "BSNL"], ["9451", "BSNL"], ["9452", "BSNL"], ["9453", "BSNL"],
  ["9454", "BSNL"], ["9455", "BSNL"], ["9456", "BSNL"], ["9457", "BSNL"],
  ["9458", "BSNL"], ["9459", "BSNL"], ["9460", "BSNL"], ["9461", "BSNL"],
  ["9462", "BSNL"], ["9463", "BSNL"], ["9464", "BSNL"], ["9465", "BSNL"],
  ["9466", "BSNL"], ["9467", "BSNL"], ["9468", "BSNL"], ["9469", "BSNL"],
  ["9470", "BSNL"], ["9471", "BSNL"], ["9472", "BSNL"], ["9473", "BSNL"],
];

const PREFIX_4 = new Map<string, OperatorName>(PREFIX_4_TABLE);

// 2-digit fallback for partial input. Each leading pair maps to a single
// best-guess operator (one key per pair — no duplicates).
const PREFIX_2_TABLE: ReadonlyArray<[string, OperatorName]> = [
  ["60", "Jio"],
  ["70", "Jio"],
  ["73", "BSNL"],
  ["74", "Jio"],
  ["75", "Vi"],
  ["77", "Airtel"],
  ["78", "Airtel"],
  ["80", "Airtel"],
  ["82", "Jio"],
  ["83", "Airtel"],
  ["84", "BSNL"],
  ["85", "Vi"],
  ["86", "Vi"],
  ["87", "Airtel"],
  ["88", "Airtel"],
  ["89", "Jio"],
  ["90", "Jio"],
  ["91", "Airtel"],
  ["94", "BSNL"],
  ["95", "Vi"],
  ["96", "Vi"],
  ["97", "Airtel"],
  ["98", "Airtel"],
  ["99", "Airtel"],
];

const PREFIX_2 = new Map<string, OperatorName>(PREFIX_2_TABLE);

function deterministicCircle(phone: string): string {
  let h = 0;
  for (let i = 0; i < phone.length; i++) {
    h = (h * 31 + phone.charCodeAt(i)) >>> 0;
  }
  return CIRCLES[h % CIRCLES.length];
}

export interface DetectedOperator {
  operator: OperatorName;
  circle: string;
}

/**
 * Detect operator + circle for an Indian mobile number prefix.
 *
 * Returns `null` (rather than defaulting to Jio) when:
 *   - input is empty / too short
 *   - the leading digit is not 6, 7, 8 or 9
 *   - we have no entry for the prefix
 *
 * The caller can then either ask the user to pick the operator manually or
 * keep waiting for more digits. Detection narrows from 4-digit prefix to
 * 2-digit prefix as the caller types.
 */
export const getOperatorMock = (phone: string): DetectedOperator | null => {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 2) return null;

  const first = digits[0];
  if (first !== "6" && first !== "7" && first !== "8" && first !== "9") return null;

  let op: OperatorName | undefined;

  if (digits.length >= 4) {
    op = PREFIX_4.get(digits.slice(0, 4));
  }
  if (!op) {
    op = PREFIX_2.get(digits.slice(0, 2));
  }
  if (!op) return null;

  return { operator: op, circle: deterministicCircle(digits) };
};
