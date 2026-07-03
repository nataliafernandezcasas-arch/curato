import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = {
  monthly_299: "299 €/mois",
  yearly_2990: "2 990 €/an",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

type Comercio = {
  id: string;
  name: string | null;
  email: string | null;
  arrondissement: string | null;
  subscription_plan: string | null;
  commitment_accepted_at?: string | null;
  commitment_signatory?: string | null;
};

export default async function AdminMaisonsPage() {
  const admin = createAdminClient();

  // select("*") so the page keeps working even if the commitment columns don't
  // exist yet (migration pending) — the fields just come back undefined.
  const { data } = await admin
    .from("comercios")
    .select("*")
    .eq("stage", "activo")
    .order("name", { ascending: true });

  const list = (data ?? []) as Comercio[];
  const signed = list.filter((m) => m.commitment_accepted_at);

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/70 mb-3">
        {list.length} maisons · {signed.length} signées
      </p>
      <h1 className="font-serif text-[32px] font-light tracking-[0.15em] uppercase text-white mb-10">Maisons</h1>

      {list.length === 0 ? (
        <div className="text-center py-20 border border-white/10">
          <p className="font-serif text-[14px] font-light text-white/65">Aucune maison pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((m) => {
            const isSigned = Boolean(m.commitment_accepted_at);
            return (
              <div key={m.id} className="border border-white/10 bg-black/40 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  {/* Identity */}
                  <div>
                    <p className="font-serif text-[18px] font-light text-white">{m.name || "—"}</p>
                    <p className="font-serif text-[13px] text-white/65 mt-1">
                      {m.email || ""}
                      {m.arrondissement ? ` · Paris ${m.arrondissement}` : ""}
                    </p>
                  </div>

                  {/* Commitment */}
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Formule</p>
                      <p className="font-serif text-[14px] text-champagne">
                        {m.subscription_plan ? PLAN_LABEL[m.subscription_plan] ?? m.subscription_plan : "—"}
                      </p>
                    </div>
                    <div className="min-w-[120px]">
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Engagement</p>
                      <p className={`font-serif text-[14px] ${isSigned ? "text-emerald-400" : "text-white/45"}`}>
                        {isSigned ? "Signé" : "Non signé"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signature detail */}
                {isSigned && (
                  <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap gap-x-10 gap-y-2">
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-1">Signé par</p>
                      <p className="font-serif text-[15px] text-white/85">{m.commitment_signatory || "—"}</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-1">Date</p>
                      <p className="font-serif text-[15px] text-white/85">{fmtDate(m.commitment_accepted_at ?? null)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
