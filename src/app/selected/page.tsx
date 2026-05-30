// /selected — EN-default entry point. Same landing as /selectionnee, but
// lands in English so the URL reads naturally for English-speaking
// storytellers who clicked through from an EN DM.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "You have been selected · Curato",
  description:
    "Curato isn't something you apply to. If you're reading this, it's because you were chosen for the first wave.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="en" />;
}
