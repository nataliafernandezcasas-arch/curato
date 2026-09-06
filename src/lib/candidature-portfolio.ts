// Shared rules for the portfolio a creator attaches to their application.
// The form, the API and the admin review all read these, so the limits can
// only ever disagree if someone edits this file.

export const PORTFOLIO_BUCKET = "candidature-portfolios";

/** Fewer than this and there is not enough to judge an eye by. */
export const PORTFOLIO_MIN = 3;
/** More than this and reviewing turns into scrolling. */
export const PORTFOLIO_MAX = 6;

export const PORTFOLIO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

/** After the browser downscales. Generous: a 1800px JPEG lands well under it. */
export const PORTFOLIO_MAX_BYTES = 3 * 1024 * 1024;

export function isAllowedImage(type: string): boolean {
  return ALLOWED.has(type.toLowerCase());
}

/** How long the admin's view of a portfolio image stays valid. Minutes, not months. */
export const PORTFOLIO_SIGNED_URL_SECONDS = 60 * 60;
