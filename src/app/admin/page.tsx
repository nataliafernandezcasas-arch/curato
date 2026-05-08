import { createAdminClient } from "@/lib/supabase/admin";
import ApplicationsList from "./applications-list";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, type, name, email, instagram, website, message, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-14">
      <div className="mb-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-4">
          Curato · Admin
        </p>
        <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-text-primary">
          Candidaturas
        </h1>
      </div>

      {error && (
        <div className="border border-copper/20 bg-copper/5 px-6 py-4 mb-8">
          <p className="font-serif text-[13px] font-light text-copper/80">{error.message}</p>
        </div>
      )}

      <ApplicationsList initial={data ?? []} />
    </main>
  );
}
