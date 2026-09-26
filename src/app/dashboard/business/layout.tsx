import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import FloralBackdrop from "../floral-backdrop";
import { filtroDeUsuario } from "@/lib/identidad";

// The flower sits behind the maison dashboard, matching the storyteller one,
// darkened enough that the text and cards stay readable. FloralBackdrop owns
// the motion.
//
// Y aquí se exige la firma del compromiso. Antes solo la pedía /dashboard, así
// que una casa sin firmar llegaba al tablero entero escribiendo la dirección o
// con un enlace guardado, y todos sus endpoints le respondían.
export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const { data: maison } = await admin
    .from("comercios")
    .select("id, commitment_accepted_at")
    .or(filtroDeUsuario(user))
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!maison) redirect("/dashboard");
  if (!maison.commitment_accepted_at) redirect("/onboarding/maison");

  return (
    <div className="relative">
      <FloralBackdrop />
      {children}
    </div>
  );
}
