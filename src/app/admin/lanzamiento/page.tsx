import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PROFILE_LABEL: Record<string, string> = {
  creator: "Creador",
  merchant: "Comercio",
  curious: "Curioso",
};

const SOURCE_LABEL: Record<string, string> = {
  ig: "Instagram",
  instagram: "Instagram",
  wa: "WhatsApp",
  whatsapp: "WhatsApp",
  email: "Email",
  direct: "Directo",
};

type Signup = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
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
      <div className="mb-10">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-text-muted mb-2">
          Lanzamiento · 13 de mayo · Bogotá
        </p>
        <h1 className="text-3xl font-extralight tracking-tighter text-text-primary">
          {signups.length} {signups.length === 1 ? "registro" : "registros"}
        </h1>
      </div>

      {error && (
        <div className="bg-midi-orange/8 border border-midi-orange/20 text-midi-orange text-sm px-4 py-3 rounded-lg mb-6">
          No se pudo cargar la lista: {error.message}
        </div>
      )}

      {signups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <BreakdownCard title="Por perfil" rows={byProfile.map(([k, n]) => [PROFILE_LABEL[k] || k, n])} />
          <BreakdownCard title="Por canal" rows={bySource.map(([k, n]) => [SOURCE_LABEL[k] || k, n])} />
        </div>
      )}

      {signups.length === 0 ? (
        <div className="border border-border rounded-xl py-16 text-center">
          <p className="text-sm text-text-muted">Aún no hay registros. Comparte el link en bio de Instagram o por WhatsApp.</p>
          <p className="text-[12px] text-text-muted mt-2">
            <code className="text-accent">pass.midi.io/lanzamiento?from=ig</code>
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-hover">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">Nombre</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Contacto</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Perfil</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Instagram</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Canal</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{s.full_name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    <div>{s.email}</div>
                    <div className="text-[11px] text-text-muted">{s.whatsapp}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{PROFILE_LABEL[s.profile] || s.profile}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {s.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${s.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        @{s.instagram_handle}
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {SOURCE_LABEL[s.source || "direct"] || s.source}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-[12px]">
                    {new Date(s.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
    <div className="border border-border rounded-xl p-5">
      <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-text-muted mb-3">{title}</p>
      <div className="space-y-1.5">
        {rows.map(([label, n]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[13px] text-text-primary">{label}</span>
            <span className="text-[13px] font-semibold text-text-primary tabular-nums">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
