// Suggested monthly budget (in EUR) derived from a creator's follower count.
// These are pre-fill defaults shown when accepting an applicant; the admin
// overrides them by hand for Mid (1000 to 1500) and for the first 7 Nano of
// the launch cohort (1500 instead of 750).
//
// Tier thresholds match influencer_tiers in migration 009.
// NB: the column that stores this is named `monthly_credit_cop` for legacy
// reasons, but the value is euros.
export function suggestedBudgetEUR(followers: number): number {
  if (followers >= 500000) return 3000; // Macro
  if (followers >= 50000) return 1000;  // Mid (adjust 1000 to 1500 by hand)
  if (followers >= 10000) return 750;   // Nano (1500 for the first 7)
  if (followers >= 5000) return 500;    // Micro
  return 0;                             // below threshold
}
