export const APP_NAME = "Sales Career Tracker";
export const APP_TAGLINE = "Track your sales career. Prove your performance.";

export const SEGMENTS = [
  { value: "smb", label: "SMB" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "enterprise", label: "Enterprise" },
] as const;

export const TARGET_ROLES = [
  { value: "enterprise_ae", label: "Enterprise Account Executive" },
  { value: "mid_market_ae", label: "Mid-Market Account Executive" },
  { value: "smb_ae", label: "SMB Account Executive" },
] as const;

export const EMPHASES = [
  { value: "new_business", label: "New business and revenue generation" },
  { value: "complex_deals", label: "Complex deals and strategic selling" },
  { value: "expansion", label: "Expansion and account growth" },
] as const;

export const ACHIEVEMENT_KINDS = [
  { value: "award", label: "Award" },
  { value: "deal", label: "Deal win" },
  { value: "promotion", label: "Promotion" },
  { value: "milestone", label: "Milestone" },
] as const;

export const COMMON_METHODOLOGIES = [
  "MEDDPICC",
  "MEDDIC",
  "Challenger",
  "SPIN",
  "Sandler",
  "Command of the Message",
  "Value Selling",
  "Solution Selling",
];
