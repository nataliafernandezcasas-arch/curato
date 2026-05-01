export const MIDI_PASS = {
  MONTHLY_CREDIT_COP: 1_500_000,
  MIN_FOLLOWERS: 5_000,
  CONTENT_DEADLINE_HOURS: 48,
  QR_TOKEN_VALIDITY_HOURS: 24,
  MIN_CREDIT_USAGE_PERCENT: 60,
  CONTENT_USAGE_DAYS: 90,
} as const;

export const BUSINESS_CATEGORIES = [
  { value: "gastronomy", label: "Gastronomia" },
  { value: "beauty", label: "Beauty & Cuidado Personal" },
  { value: "wellness", label: "Wellness & Salud" },
  { value: "hospitality", label: "Hoteles & Hospedaje" },
] as const;

export const CONTENT_NICHES = [
  "Gastronomia",
  "Beauty",
  "Wellness",
  "Lifestyle",
  "Travel",
  "Fitness",
  "Moda",
  "Tech",
  "Entretenimiento",
] as const;

export const FOLLOWER_RANGES = [
  { value: "5k-10k", label: "5,000 - 10,000" },
  { value: "10k-50k", label: "10,000 - 50,000" },
  { value: "50k-100k", label: "50,000 - 100,000" },
  { value: "100k-500k", label: "100,000 - 500,000" },
  { value: "500k+", label: "500,000+" },
] as const;

/**
 * Countries supported by Midi: all LATAM (minus excluded), Central America, USA & Canada.
 * dialCode is the E.164 country calling code (without +).
 * flag is a plain emoji — renders on any platform that supports Unicode flags (all modern browsers).
 */
export const COUNTRIES = [
  // North America
  { code: "US", name: "Estados Unidos", dialCode: "1",   flag: "🇺🇸" },
  { code: "CA", name: "Canadá",         dialCode: "1",   flag: "🇨🇦" },

  // Mexico
  { code: "MX", name: "México",         dialCode: "52",  flag: "🇲🇽" },

  // Central America
  { code: "GT", name: "Guatemala",      dialCode: "502", flag: "🇬🇹" },
  { code: "BZ", name: "Belice",         dialCode: "501", flag: "🇧🇿" },
  { code: "SV", name: "El Salvador",    dialCode: "503", flag: "🇸🇻" },
  { code: "HN", name: "Honduras",       dialCode: "504", flag: "🇭🇳" },
  { code: "CR", name: "Costa Rica",     dialCode: "506", flag: "🇨🇷" },
  { code: "PA", name: "Panamá",         dialCode: "507", flag: "🇵🇦" },

  // Caribbean (LATAM-relevant, excluding restricted)
  { code: "DO", name: "República Dominicana", dialCode: "1809", flag: "🇩🇴" },
  { code: "PR", name: "Puerto Rico",    dialCode: "1787", flag: "🇵🇷" },

  // South America
  { code: "CO", name: "Colombia",       dialCode: "57",  flag: "🇨🇴" },
  { code: "EC", name: "Ecuador",        dialCode: "593", flag: "🇪🇨" },
  { code: "PE", name: "Perú",           dialCode: "51",  flag: "🇵🇪" },
  { code: "BR", name: "Brasil",         dialCode: "55",  flag: "🇧🇷" },
  { code: "AR", name: "Argentina",      dialCode: "54",  flag: "🇦🇷" },
  { code: "CL", name: "Chile",          dialCode: "56",  flag: "🇨🇱" },
  { code: "UY", name: "Uruguay",        dialCode: "598", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay",       dialCode: "595", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia",        dialCode: "591", flag: "🇧🇴" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
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
