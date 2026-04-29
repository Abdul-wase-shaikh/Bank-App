export interface Plan {
  id: string;
  price: number;
  validity: string;
  data: string;
  calls: string;
  sms: string;
  perks: string[];
  tags: string[];
  tab: "For You" | "Unlimited" | "Data" | "Validity" | "Top-Up";
}

type PlanSeed = Omit<Plan, "id">;

const OPERATOR_PERKS: Record<string, { ott: string[]; misc: string[] }> = {
  Jio:    { ott: ["JioCinema Premium", "JioSaavn Pro", "Disney+ Hotstar"], misc: ["JioCloud 50GB", "JioTV"] },
  Airtel: { ott: ["Disney+ Hotstar", "Wynk Music", "Amazon Prime"],        misc: ["Airtel Xstream Play", "Apollo 24/7"] },
  Vi:     { ott: ["Vi Movies & TV", "SonyLIV Premium", "Netflix Mobile"],  misc: ["Vi Hero Unlimited Nights", "Weekend Data Rollover"] },
  BSNL:   { ott: ["BSNL Tunes", "Eros Now"],                                misc: ["Free PRBT", "Free National Roaming"] },
};

const PRICE_NUDGE: Record<string, number> = { Jio: 0, Airtel: 10, Vi: -10, BSNL: -40 };

const baseSeeds = (operator: string): PlanSeed[] => {
  const ott = OPERATOR_PERKS[operator]?.ott ?? [];
  const misc = OPERATOR_PERKS[operator]?.misc ?? [];
  const nudge = PRICE_NUDGE[operator] ?? 0;
  const px = (p: number) => Math.max(9, p + nudge);

  return [
    // ---- For You / Popular unlimited ---------------------------------------
    { price: px(155), validity: "24 Days",  data: "1GB",        calls: "Unlimited", sms: "300 total",  perks: [],                        tags: ["Popular"],     tab: "For You" },
    { price: px(199), validity: "28 Days",  data: "1GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: [],                        tags: [],              tab: "For You" },
    { price: px(239), validity: "28 Days",  data: "1.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: [misc[0]].filter(Boolean), tags: ["Recommended"], tab: "For You" },
    { price: px(299), validity: "28 Days",  data: "1.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 2),           tags: ["Best Value"],  tab: "For You" },
    { price: px(349), validity: "28 Days",  data: "2GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 1),           tags: [],              tab: "For You" },
    { price: px(399), validity: "28 Days",  data: "2.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 2),           tags: ["New"],         tab: "For You" },

    // ---- Unlimited (long validity) -----------------------------------------
    { price: px(479), validity: "56 Days",  data: "1.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: [misc[1]].filter(Boolean), tags: [],              tab: "Unlimited" },
    { price: px(533), validity: "56 Days",  data: "1.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 1),           tags: [],              tab: "Unlimited" },
    { price: px(666), validity: "84 Days",  data: "1.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: [],                        tags: [],              tab: "Unlimited" },
    { price: px(719), validity: "84 Days",  data: "2GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 1),           tags: ["Recommended"], tab: "Unlimited" },
    { price: px(799), validity: "84 Days",  data: "2GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 2),           tags: [],              tab: "Unlimited" },
    { price: px(859), validity: "84 Days",  data: "2GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 2).concat(misc.slice(0, 1)), tags: ["Premium"], tab: "Unlimited" },
    { price: px(999), validity: "84 Days",  data: "3GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 1),           tags: ["Power User"],  tab: "Unlimited" },
    { price: px(1559), validity: "252 Days",data: "2GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 1),           tags: [],              tab: "Unlimited" },
    { price: px(2999), validity: "365 Days",data: "2.5GB/Day",  calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 3),           tags: ["Best Value"],  tab: "Unlimited" },
    { price: px(3499), validity: "365 Days",data: "3GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: ott.slice(0, 3).concat(misc.slice(0, 1)), tags: ["Annual"], tab: "Unlimited" },

    // ---- Data add-ons ------------------------------------------------------
    { price: px(15),  validity: "Existing", data: "1GB",        calls: "NA",        sms: "NA",         perks: [],                        tags: [],              tab: "Data" },
    { price: px(19),  validity: "1 Day",    data: "2GB",        calls: "NA",        sms: "NA",         perks: [],                        tags: [],              tab: "Data" },
    { price: px(29),  validity: "Existing", data: "6GB",        calls: "NA",        sms: "NA",         perks: [],                        tags: ["Booster"],     tab: "Data" },
    { price: px(61),  validity: "Existing", data: "6GB",        calls: "NA",        sms: "NA",         perks: [],                        tags: [],              tab: "Data" },
    { price: px(101), validity: "Existing", data: "10GB",       calls: "NA",        sms: "NA",         perks: [],                        tags: [],              tab: "Data" },
    { price: px(121), validity: "Existing", data: "12GB",       calls: "NA",        sms: "NA",         perks: [],                        tags: ["Popular"],     tab: "Data" },
    { price: px(181), validity: "Existing", data: "20GB",       calls: "NA",        sms: "NA",         perks: [],                        tags: [],              tab: "Data" },
    { price: px(301), validity: "Existing", data: "50GB",       calls: "NA",        sms: "NA",         perks: [],                        tags: ["Heavy User"],  tab: "Data" },

    // ---- Validity / minimum recharge --------------------------------------
    { price: px(75),  validity: "30 Days",  data: "Pay as use", calls: "10p/sec",   sms: "1.50/SMS",   perks: [],                        tags: ["Talktime"],    tab: "Validity" },
    { price: px(99),  validity: "28 Days",  data: "200MB",      calls: "Unlimited", sms: "100 total",  perks: [],                        tags: [],              tab: "Validity" },
    { price: px(179), validity: "28 Days",  data: "2GB",        calls: "Unlimited", sms: "300 total",  perks: [],                        tags: [],              tab: "Validity" },
    { price: px(209), validity: "22 Days",  data: "1GB/Day",    calls: "Unlimited", sms: "100/Day",    perks: [],                        tags: [],              tab: "Validity" },
    { price: px(395), validity: "70 Days",  data: "6GB",        calls: "Unlimited", sms: "1000 total", perks: [],                        tags: [],              tab: "Validity" },
    { price: px(449), validity: "98 Days",  data: "6GB",        calls: "Unlimited", sms: "1000 total", perks: [],                        tags: [],              tab: "Validity" },

    // ---- Top-Up (pure talktime) --------------------------------------------
    { price: px(10),  validity: "Existing", data: "NA",         calls: "₹7.47 Talktime",   sms: "NA",  perks: [],                        tags: [],              tab: "Top-Up" },
    { price: px(20),  validity: "Existing", data: "NA",         calls: "₹14.95 Talktime",  sms: "NA",  perks: [],                        tags: [],              tab: "Top-Up" },
    { price: px(50),  validity: "Existing", data: "NA",         calls: "₹39.37 Talktime",  sms: "NA",  perks: [],                        tags: [],              tab: "Top-Up" },
    { price: px(100), validity: "Existing", data: "NA",         calls: "₹81.75 Talktime",  sms: "NA",  perks: [],                        tags: [],              tab: "Top-Up" },
    { price: px(250), validity: "Existing", data: "NA",         calls: "₹211.65 Talktime", sms: "NA",  perks: [],                        tags: ["Best Value"],  tab: "Top-Up" },
    { price: px(500), validity: "Existing", data: "NA",         calls: "₹423.73 Talktime", sms: "NA",  perks: [],                        tags: [],              tab: "Top-Up" },
    { price: px(1000),validity: "Existing", data: "NA",         calls: "₹847.46 Talktime", sms: "NA",  perks: [],                        tags: ["Bulk"],        tab: "Top-Up" },
  ];
};

const generatePlans = (operator: string): Plan[] =>
  baseSeeds(operator).map((seed, i) => ({
    ...seed,
    id: `${operator.toLowerCase()}-${i + 1}-${seed.price}`,
  }));

export const RECHARGE_PLANS: Record<string, Plan[]> = {
  Jio:    generatePlans("Jio"),
  Airtel: generatePlans("Airtel"),
  Vi:     generatePlans("Vi"),
  BSNL:   generatePlans("BSNL"),
};
