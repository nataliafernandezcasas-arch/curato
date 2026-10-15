import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import GuiaClient from "./guia-client";

export const dynamic = "force-dynamic";

/**
 * /onboarding/guia: después de la encuesta, antes de las direcciones. Cómo se
 * usa la app, conectar Instagram y crear el perfil. /dashboard trae aquí a
 * quien aún no lo ha hecho; quien ya lo hizo (o lo saltó) sigue de largo.
 */
export default async function GuiaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth/sign-in");

  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id, instagram_connected")
    .or(`owner_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!creator) redirect("/dashboard");

  // Tolerante: sin la migración 050, la guía se puede ver igual.
  const { data: guia } = await admin.from("creators").select("guia_completada_at").eq("id", creator.id).maybeSingle();
  if (guia?.guia_completada_at) redirect("/dashboard/storyteller");

  return <GuiaClient instagram={Boolean(creator.instagram_connected)} />;
}
