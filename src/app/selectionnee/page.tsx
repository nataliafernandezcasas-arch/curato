// /selectionnee — FR-default entry point for the première vague landing.
// All three language variants render the same SelectedClient; this one
// sets the initial language to FR.

import type { Metadata } from "next";
import SelectedClient from "./selected-client";

export const metadata: Metadata = {
  title: "Vous faites partie de la sélection · Curato",
  description:
    "Curato ne se postule pas. Si vous lisez ces mots, c'est que votre univers nous parle et que vous faites partie de la première vague.",
  // No index — this page is meant to be reached only via personal invitation.
  // We don't want it surfacing in search results next to /candidature.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="fr" />;
}
