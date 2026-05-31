// /seleccionada — ES-default entry point. Same landing as /selectionnee,
// pero abre en español para que la URL se lea natural cuando llega desde
// un DM en castellano.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "Has sido seleccionado.a · Curato",
  description:
    "A Curato no se postula. Si estás leyendo esto, es porque fuiste elegido.a para la primera ola.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="es" />;
}
