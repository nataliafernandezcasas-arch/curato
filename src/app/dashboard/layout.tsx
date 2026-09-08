import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabBarSpacer } from "@/components/member/tab-bar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");
  return (
    <>
      {children}
      {/* La barra de abajo flota sobre el contenido, así que la última fila de
          cualquier pantalla necesita sitio para no quedar debajo. */}
      <TabBarSpacer />
    </>
  );
}
