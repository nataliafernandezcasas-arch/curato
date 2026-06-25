// /selected — EN-default entry point. Same landing as /selectionnee, but
// lands in English so the URL reads naturally for English-speaking
// storytellers who clicked through from an EN DM.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "You have been selected · Curato",
  description:
    "You don't apply to our first wave, we choose it. If you're reading this, you've been chosen.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="en" />;
}
