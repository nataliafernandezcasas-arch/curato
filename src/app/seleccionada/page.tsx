// /seleccionada — ES-default entry point. Same landing as /selectionnee,
// pero abre en español para que la URL se lea natural cuando llega desde
// un DM en castellano.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "Formas parte de la selección · Curato",
  description:
    "A Curato no se postula. Si estás leyendo esto, es porque tu universo nos llega y formas parte de la primera ola.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="es" />;
}
