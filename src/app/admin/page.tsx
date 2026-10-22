import { createAdminClient } from "@/lib/supabase/admin";
import { PORTFOLIO_BUCKET, PORTFOLIO_SIGNED_URL_SECONDS } from "@/lib/candidature-portfolio";
import ApplicationsList, { type Application } from "./applications-list";

export const dynamic = "force-dynamic";

const BASE = "id, type, name, email, instagram, website, message, status, created_at, portfolio_paths";

export default async function AdminPage() {
  const supabase = createAdminClient();
  // Los seguidores y las ciudades (migración 056), tolerante: sin la
  // migración la lista sale igual, sin esos datos.
  let res = await supabase.from("applications").select(`${BASE}, followers, cities`).order("created_at", { ascending: false });
  if (res.error) res = (await supabase.from("applications").select(BASE).order("created_at", { ascending: false })) as typeof res;
  const filas = (res.data ?? []) as (Omit<Application, "photos"> & { portfolio_paths: string[] | null })[];

  // Las cuatro primeras fotos de cada candidatura, firmadas de una vez: el
  // almacenamiento es privado.
  const rutas = filas.flatMap((f) => (f.portfolio_paths ?? []).slice(0, 4));
  const firmadas = new Map<string, string>();
  if (rutas.length) {
    const { data } = await supabase.storage.from(PORTFOLIO_BUCKET).createSignedUrls(rutas, PORTFOLIO_SIGNED_URL_SECONDS);
    for (const d of data ?? []) if (d.path && d.signedUrl) firmadas.set(d.path, d.signedUrl);
  }
  const apps: Application[] = filas.map(({ portfolio_paths, ...f }) => ({
    ...f,
    photos: (portfolio_paths ?? []).slice(0, 4).map((p) => firmadas.get(p)).filter((u): u is string => Boolean(u)),
  }));

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-14">
      {res.error && (
        <div className="border border-red-200 bg-red-50 px-6 py-4 mb-8">
          <p className="font-serif text-legende font-light text-red-700">{res.error.message}</p>
        </div>
      )}
      <ApplicationsList initial={apps} />
    </main>
  );
}
