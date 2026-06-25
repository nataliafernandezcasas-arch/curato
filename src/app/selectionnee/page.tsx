// /selectionnee — FR-default entry point for the première vague landing.
// All three language variants render the same SelectedClient; this one
// sets the initial language to FR.

import type { Metadata } from "next";
import SelectedClient from "./selected-client";

export const metadata: Metadata = {
  title: "Vous avez été sélectionné.e · Curato",
  description:
    "Notre première vague ne se postule pas, on la choisit. Si vous lisez ces mots, c'est que vous avez été choisi.e.",
  // No index — this page is meant to be reached only via personal invitation.
  // We don't want it surfacing in search results next to /candidature.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="fr" />;
}
