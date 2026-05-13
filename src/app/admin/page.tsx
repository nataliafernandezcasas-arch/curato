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

      {error && (
        <div className="border border-red-200 bg-red-50 px-6 py-4 mb-8">
          <p className="font-serif text-[13px] font-light text-red-700">{error.message}</p>
        </div>
      )}

      <ApplicationsList initial={data ?? []} />
    </main>
  );
}
