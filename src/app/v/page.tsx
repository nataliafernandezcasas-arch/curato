import { redirect } from "next/navigation";

// Aquí escaneaba el storyteller el QR de la casa. Desde la migración 040 es al
// revés: el storyteller enseña el código de su visita. Un cartón viejo que
// alguien escanee lleva a sus visitas, donde está ese código.
export default function V() {
  redirect("/dashboard/storyteller/visits");
}
