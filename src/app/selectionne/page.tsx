// /selectionne — FR-default entry point (masculine canonical URL).
// La page rend exactement le même SelectedClient que /selectionnee (qui
// reste accessible comme alias féminin pour ne pas casser les DM/QR déjà
// envoyés). À partir de maintenant, /selectionne est l'URL canonique
// pour les nouveaux DM et QR codes.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "Vous avez été sélectionné.e · Curato",
  description:
    "Curato ne se postule pas. Si vous lisez ces mots, c'est que vous avez été choisi.e pour la première vague.",
  // No index — this page is meant to be reached only via personal invitation.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="fr" />;
}
