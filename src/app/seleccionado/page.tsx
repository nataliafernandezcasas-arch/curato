// /seleccionado — ES-default entry point (URL canónica en masculino).
// Renderiza el mismo SelectedClient que /seleccionada (que sigue
// funcionando como alias femenino para no romper DMs/QRs ya enviados).
// A partir de ahora, /seleccionado es la URL canónica para DMs y QR codes
// nuevos.

import type { Metadata } from "next";
import SelectedClient from "../selectionnee/selected-client";

export const metadata: Metadata = {
  title: "Has sido seleccionado.a · Curato",
  description:
    "A nuestra primera ola no se postula, la elegimos nosotros. Si estás leyendo esto, es porque fuiste elegido.a.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SelectedClient initialLang="es" />;
}
