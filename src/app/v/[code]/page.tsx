import { redirect } from "next/navigation";

// Ver src/app/v/page.tsx: los códigos de casa ya no registran visitas.
export default function VConCodigo() {
  redirect("/dashboard/storyteller/visits");
}
