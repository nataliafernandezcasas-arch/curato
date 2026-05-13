import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const PROFILE_LABEL: Record<string, string> = {
  creator: "Créateur",
  merchant: "Maison",
  curious: "Invité",
};

const SOURCE_LABEL: Record<string, string> = {
  ig: "Instagram",
  instagram: "Instagram",
  wa: "WhatsApp",
  whatsapp: "WhatsApp",
  email: "Email",
  direct: "Direct",
};

type Signup = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  profile: string;
  instagram_handle: string | null;
  source: string | null;
  created_at: string;
};

function tally(items: Signup[], key: keyof Pick<Signup, "profile" | "source">) {
  const map = new Map<string, number>();
  for (const it of items) {
    const raw = (it[key] || "—") as string;
    map.set(raw, (map.get(raw) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function AdminLanzamientoPage() {
  const ok = await isAdmin();
  if (!ok) return notFound();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("launch_event_signups")
    .select("id, full_name, email, whatsapp, profile, instagram_handle, source, created_at")
    .order("created_at", { ascending: false });

  const signups = (data ?? []) as Signup[];

  const byProfile = tally(signups, "profile");
  const bySource = tally(signups, "source");

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-10">

      {/* Header */}
      <div className="mb-10">
        <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/40 mb-3">
          Admin · Lancement · 22 juillet · Paris
        </p>
        <h1 className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-white">
          {signups.length}{" "}
          <span className="text-white/40">
            {signups.length === 1 ? "inscription" : "inscriptions"}
          </span>
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-400/20 bg-red-400/5 text-red-400 font-serif text-[13px] px-4 py-3 mb-6">
          No se pudo cargar la lista: {error.message}
        </div>
      )}

      {/* Breakdown cards */}
      {signups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 mb-10">
          <BreakdownCard
            title="Par profil · By profile"
            rows={byProfile.map(([k, n]) => [PROFILE_LABEL[k] || k, n])}
          />
          <BreakdownCard
            title="Par canal · By source"
            rows={bySource.map(([k, n]) => [SOURCE_LABEL[k] || k, n])}
          />
        </div>
      )}

      {/* Empty state */}
      {signups.length === 0 ? (
        <div className="border border-white/10 bg-white/5 py-16 text-center">
          <p className="font-serif text-[13px] font-light text-white/30 italic">
            Aucune inscription pour le moment.
          </p>
          <p className="font-serif text-[11px] text-white/20 mt-3 tracking-wide">
            curatocollective.com/lanzamiento?from=ig
          </p>
        </div>
      ) : (
        /* Table */
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Nom
                </th>
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Profil
                </th>
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Instagram
                </th>
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Canal
                </th>
                <th className="px-4 py-3 text-left font-serif font-normal text-[10px] tracking-[0.25em] uppercase text-white/30">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-serif font-light text-white">
                    {s.full_name}
                  </td>
                  <td className="px-4 py-3 font-serif font-light text-white/50">
                    <div>{s.email}</div>
                    {s.whatsapp && (
                      <div className="text-[11px] text-white/25">{s.whatsapp}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-serif font-light text-champagne/70">
                    {PROFILE_LABEL[s.profile] || s.profile}
                  </td>
                  <td className="px-4 py-3">
                    {s.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${s.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif font-light text-champagne/60 hover:text-champagne transition-colors"
                      >
                        @{s.instagram_handle}
                      </a>
                    ) : (
                      <span className="font-serif text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-serif font-light text-white/40">
                    {SOURCE_LABEL[s.source || "direct"] || s.source}
                  </td>
                  <td className="px-4 py-3 font-serif text-[11px] text-white/25">
                    {new Date(s.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="bg-white/5 px-6 py-5">
      <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map(([label, n]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="font-serif font-light text-[13px] text-white/60">{label}</span>
            <span className="font-serif text-[18px] font-light text-champagne tabular-nums">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
