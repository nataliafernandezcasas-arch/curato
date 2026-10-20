import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import AccionesDeCuenta from "../../acciones-de-cuenta";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = {
  pending_review: "En attente",
  confirmed: "Confirmée",
  completed: "Complétée",
  declined: "Refusée",
  cancelled: "Annulée",
  no_show: "No-show",
};

// tarjeta-casa es de cliente: aquí, en el servidor, la etiqueta va escrita.
const CATEGORIA: Record<string, string> = {
  "00000000-0000-0000-0000-0000000ca701": "Hôtel",
  "00000000-0000-0000-0000-0000000ca702": "Gastronomie",
  "00000000-0000-0000-0000-0000000ca703": "Bien-être",
  "00000000-0000-0000-0000-0000000ca704": "Beauté",
};

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : "—";

/**
 * La fiche de una casa en el admin (Natalia, 2026-10-15): su ficha tal como la
 * ven los storytellers, en qué punto está de la entrada, sus cifras, sus
 * visitas con la nota que dejó cada storyteller, y reiniciar o suprimir.
 */
export default async function MaisonAdmin({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return notFound();
  const { id } = await params;
  const admin = createAdminClient();

  // select("*"): la ficha sigue saliendo aunque falte alguna columna nueva.
  const { data: m } = await admin.from("comercios").select("*").eq("id", id).maybeSingle();
  if (!m) return notFound();
  const casa = m as Record<string, unknown>;

  const [{ data: visitas }, usuario, avisos] = await Promise.all([
    admin
      .from("reservations")
      .select("*")
      .eq("venue_id", id)
      .order("slot_start", { ascending: false }),
    casa.owner_id ? admin.auth.admin.getUserById(casa.owner_id as string) : Promise.resolve(null),
    casa.owner_id
      ? admin.from("device_tokens").select("platform", { count: "exact" }).eq("user_id", casa.owner_id as string)
      : Promise.resolve({ count: 0 }),
  ]);
  const res = (visitas ?? []) as Record<string, unknown>[];
  const creatorIds = [...new Set(res.map((r) => r.creator_id as string))];
  const { data: creadores } = creatorIds.length
    ? await admin.from("creators").select("id, full_name, handle, email").in("id", creatorIds)
    : { data: [] };
  const quien = new Map((creadores ?? []).map((c) => [c.id as string, c]));

  const fotos = ((casa.photos as string[] | null) ?? []).filter(Boolean);
  const descripcion = ((casa.description as string | null) ?? "").trim();
  const ultimaEntrada = usuario && "data" in usuario ? usuario.data.user?.last_sign_in_at ?? null : null;
  const telefonos = (avisos as { count: number | null }).count ?? 0;
  const etapas: { label: string; hecho: boolean; detalle?: string }[] = [
    { label: "Compte de connexion", hecho: Boolean(casa.owner_id), detalle: ultimaEntrada ? `dernière connexion ${fmtDate(ultimaEntrada)}` : undefined },
    { label: "Engagement signé", hecho: Boolean(casa.commitment_accepted_at), detalle: fmtDate(casa.commitment_accepted_at as string | null) },
    { label: "5 photos", hecho: fotos.length >= 5, detalle: `${fotos.length} photo${fotos.length > 1 ? "s" : ""}` },
    { label: "Description (200 caractères)", hecho: descripcion.length >= 200, detalle: `${descripcion.length} caractères` },
    { label: "Offre", hecho: Boolean(casa.offer_eur), detalle: casa.offer_eur ? `${casa.offer_eur} €` : undefined },
    { label: "Carte / documents", hecho: ((casa.menu_urls as string[] | null) ?? []).length > 0 },
    { label: "Visible pour les storytellers", hecho: casa.is_reservable === true },
    { label: "Notifications du téléphone", hecho: telefonos > 0, detalle: telefonos > 0 ? `${telefonos} appareil${telefonos > 1 ? "s" : ""}` : undefined },
  ];

  const hechas = res.filter((r) => r.status === "completed");
  const notas = res.map((r) => r.rating as number | null).filter((n): n is number => typeof n === "number");
  const cifras = [
    { label: "Demandes reçues", value: res.length },
    { label: "Visites faites", value: hechas.length },
    { label: "Storytellers reçus", value: new Set(hechas.map((r) => r.creator_id)).size },
    { label: "No-shows", value: res.filter((r) => r.status === "no_show").length },
    { label: "Note moyenne reçue", value: notas.length ? `${(notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)} ★` : "—" },
    { label: "Crédits dépensés chez elle", value: `€${hechas.reduce((n, r) => n + ((r.credits_cost as number | null) ?? 0), 0)}` },
  ];

  return (
    <main className="mx-auto max-w-[900px] px-5 py-14">
      <Link href="/admin/maisons" className="mb-10 inline-flex items-center gap-2 font-serif text-capitale uppercase tracking-[0.25em] text-white/30 transition-colors hover:text-white">
        ← Maisons
      </Link>

      <div className="mb-8 border border-white/10 bg-white/5 p-8 md:p-10">
        <p className="mb-3 font-serif text-capitale uppercase tracking-[0.35em] text-champagne/50">
          Maison · {CATEGORIA[(casa.category_id as string | null) ?? ""] ?? "—"}
        </p>
        <h1 className="mb-2 font-serif text-grande font-light uppercase tracking-[0.2em] text-white">{(casa.name as string) || "—"}</h1>
        <p className="font-serif text-legende text-white/40">
          {[casa.arrondissement ? `Paris ${casa.arrondissement}` : null, casa.address].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 font-serif text-legende text-white/30">{(casa.email as string) || "—"}</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3">
        {cifras.map((c) => (
          <div key={c.label} className="bg-white/5 px-6 py-5">
            <p className="mb-2 font-serif text-capitale uppercase tracking-[0.3em] text-white/30">{c.label}</p>
            <p className="font-serif text-grande font-light text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="mb-5 font-serif text-capitale uppercase tracking-[0.35em] text-champagne/40">Parcours et fiche</p>
        <ul className="divide-y divide-white/8">
          {etapas.map((e) => (
            <li key={e.label} className="flex items-center justify-between gap-4 py-3">
              <span className="font-serif text-corps text-white/80">{e.label}</span>
              <span className={`text-right font-serif text-legende ${e.hecho ? "text-emerald-400" : "text-white/35"}`}>
                {e.hecho ? `✓ ${e.detalle && e.detalle !== "—" ? e.detalle : "Fait"}` : e.detalle && e.detalle !== "—" ? e.detalle : "Pas encore"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(fotos.length > 0 || descripcion) && (
        <div className="mb-10">
          <p className="mb-5 font-serif text-capitale uppercase tracking-[0.35em] text-champagne/40">Fiche · ce que voient les storytellers</p>
          {fotos.length > 0 && (
            <div className="mb-5 grid grid-cols-3 gap-1">
              {fotos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-white/5">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {descripcion && <p className="whitespace-pre-line font-serif text-corps leading-relaxed text-white/70">{descripcion}</p>}
        </div>
      )}

      <div>
        <p className="mb-6 font-serif text-capitale uppercase tracking-[0.35em] text-champagne/40">Visites {res.length > 0 && `(${res.length})`}</p>
        {res.length === 0 ? (
          <p className="border border-white/8 py-12 text-center font-serif text-corps font-light text-white/30">Aucune demande pour le moment.</p>
        ) : (
          <div className="divide-y divide-white/8">
            {res.map((r) => {
              const c = quien.get(r.creator_id as string);
              return (
                <div key={r.id as string} className="flex flex-wrap items-start justify-between gap-4 py-5">
                  <div>
                    <p className="font-serif text-capitale uppercase tracking-[0.2em] text-champagne/60">{ESTADO[r.status as string] ?? (r.status as string)}</p>
                    {c?.email ? (
                      <Link href={`/admin/creators/${encodeURIComponent(c.email as string)}`} className="mt-1 block font-serif text-sous-titre font-light text-white hover:text-champagne">
                        {(c.full_name as string) || (c.handle as string) || c.email}
                      </Link>
                    ) : (
                      <p className="mt-1 font-serif text-sous-titre font-light text-white">—</p>
                    )}
                    {typeof r.rating === "number" && (
                      <p className="mt-1 font-serif text-legende text-champagne">
                        {"★".repeat(r.rating as number)}
                        <span className="text-white/20">{"★".repeat(5 - (r.rating as number))}</span>
                      </p>
                    )}
                    {r.rating_note ? <p className="mt-1 max-w-[52ch] font-serif text-legende text-white/60">« {r.rating_note as string} »</p> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {(r.credits_cost as number) > 0 && <p className="font-serif text-sous-titre font-light text-champagne">€{r.credits_cost as number}</p>}
                    <p className="mt-1 font-serif text-legende text-white/30">{fmtDate(r.slot_start as string)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AccionesDeCuenta tipo="maison" id={id} nombre={(casa.name as string) || "la maison"} />
    </main>
  );
}
