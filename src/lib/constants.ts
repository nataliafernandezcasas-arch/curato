export const CURATO = {
  CONTENT_DEADLINE_HOURS: 72,
  CONTENT_USAGE_DAYS: 90,
  MIN_FOLLOWERS: 5_000,
} as const;

export const OFFER_CATEGORIES = [
  { value: "gastronomy", label: "Gastronomie" },
  { value: "beauty", label: "Beauté & Soins" },
  { value: "wellness", label: "Wellness & Bien-être" },
  { value: "hospitality", label: "Hôtellerie" },
  { value: "fashion", label: "Mode & Joaillerie" },
  { value: "art", label: "Art & Culture" },
] as const;

// Kept for any legacy forms that reference these
export const BUSINESS_CATEGORIES = OFFER_CATEGORIES;

export const CONTENT_NICHES = [
  "Gastronomie",
  "Beauté",
  "Wellness",
  "Lifestyle",
  "Voyage",
  "Mode",
  "Art",
  "Hôtellerie",
] as const;

export const FOLLOWER_RANGES = [
  { value: "5k-10k", label: "5 000 – 10 000" },
  { value: "10k-50k", label: "10 000 – 50 000" },
  { value: "50k-100k", label: "50 000 – 100 000" },
  { value: "100k-500k", label: "100 000 – 500 000" },
  { value: "500k+", label: "500 000+" },
] as const;

export const COUNTRIES = [
  // Europe
  { code: "FR", name: "France",           dialCode: "33",  flag: "🇫🇷" },
  { code: "BE", name: "Belgique",         dialCode: "32",  flag: "🇧🇪" },
  { code: "CH", name: "Suisse",           dialCode: "41",  flag: "🇨🇭" },
  { code: "LU", name: "Luxembourg",       dialCode: "352", flag: "🇱🇺" },
  { code: "MC", name: "Monaco",           dialCode: "377", flag: "🇲🇨" },
  { code: "GB", name: "United Kingdom",   dialCode: "44",  flag: "🇬🇧" },
  { code: "DE", name: "Deutschland",      dialCode: "49",  flag: "🇩🇪" },
  { code: "IT", name: "Italia",           dialCode: "39",  flag: "🇮🇹" },
  { code: "ES", name: "España",           dialCode: "34",  flag: "🇪🇸" },
  { code: "PT", name: "Portugal",         dialCode: "351", flag: "🇵🇹" },
  { code: "NL", name: "Nederland",        dialCode: "31",  flag: "🇳🇱" },
  { code: "SE", name: "Sverige",          dialCode: "46",  flag: "🇸🇪" },
  { code: "DK", name: "Danmark",          dialCode: "45",  flag: "🇩🇰" },
  { code: "NO", name: "Norge",            dialCode: "47",  flag: "🇳🇴" },
  { code: "US", name: "United States",    dialCode: "1",   flag: "🇺🇸" },
  // LATAM
  { code: "MX", name: "México",           dialCode: "52",  flag: "🇲🇽" },
  { code: "CO", name: "Colombia",         dialCode: "57",  flag: "🇨🇴" },
  { code: "AR", name: "Argentina",        dialCode: "54",  flag: "🇦🇷" },
  { code: "BR", name: "Brasil",           dialCode: "55",  flag: "🇧🇷" },
  { code: "CL", name: "Chile",            dialCode: "56",  flag: "🇨🇱" },
  { code: "PE", name: "Perú",             dialCode: "51",  flag: "🇵🇪" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "approved",
  REJECTED: "rejected",
} as const;

export const VISIT_STATUS = {
  RESERVED: "reserved",
  CHECKED_IN: "checked_in",
  CONTENT_PENDING: "content_pending",
  CONTENT_SUBMITTED: "content_submitted",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;
