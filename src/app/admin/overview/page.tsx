import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = (q: any) => any;

// Count helper: returns a number, or null if the query errored (e.g. a table
// whose grants/migration aren't applied yet) so the page never crashes.
async function main() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = async (table: string, filter?: Q): Promise<number | null> => {
    try {
      let q = admin.from(table).select("id", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c, error } = await q;
      return error ? null : c ?? 0;
    } catch {
      return null;
    }
  };

  const [
    stActive, stConnected,
    maActivo, maSigned, maSoon,
    recCount, recPending, recTotal,
    appPending, appTotal,
    resTotal, resTodo,
    sugTotal,
  ] = await Promise.all([
    count("creators", (q) => q.eq("stage", "active")),
    count("creators", (q) => q.eq("stage", "active").eq("instagram_connected", true)),
    count("comercios", (q) => q.eq("stage", "activo")),
    count("comercios", (q) => q.not("commitment_accepted_at", "is", null)),
    count("comercios", (q) => q.eq("coming_soon", true)),
    count("recruiters"),
    count("recruiter_prospects", (q) => q.eq("status", "pending")),
    count("recruiter_prospects"),
    count("applications", (q) => q.eq("status", "pending")),
    count("applications", (q) => q.neq("status", "deleted")),
    count("reservations"),
    count("reservations", (q) => q.in("status", ["pending", "proposed"])),
    count("venue_suggestions"),
  ]);

  return {
    stActive, stConnected, maActivo, maSigned, maSoon,
    recCount, recPending, recTotal, appPending, appTotal, resTotal, resTodo, sugTotal,
  };
}

const fmt = (n: number | null) => (n === null ? "—" : String(n));

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-black/25 px-5 py-5">
      <p className="font-serif text-[9px] tracking-[0.3em] uppercase text-white/35 mb-3">{label}</p>
      <p className={`font-serif text-[26px] font-light ${accent ? "text-copper" : "text-champagne"}`}>{value}</p>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-[13px] tracking-[0.25em] uppercase text-white/55">{title}</h2>
        <Link href={href} className="font-serif text-[11px] tracking-[0.15em] uppercase text-champagne/70 hover:text-champagne transition-colors">
          Ouvrir
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">{children}</div>
    </section>
  );
}

export default async function AdminOverviewPage() {
  const d = await main();

  return (
    <main className="max-w-[1000px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-3">Curato · Admin</p>
      <h1 className="font-serif text-4xl font-light tracking-[0.12em] uppercase text-white mb-12">Vue d&apos;ensemble</h1>

      <Section title="Storytellers" href="/admin/creators">
        <Tile label="Actifs" value={fmt(d.stActive)} />
        <Tile label="Instagram connecté" value={fmt(d.stConnected)} />
        <Tile label="À connecter" value={fmt(d.stActive !== null && d.stConnected !== null ? d.stActive - d.stConnected : null)} accent />
        <Tile label="" value="" />
      </Section>

      <Section title="Maisons" href="/admin/maisons">
        <Tile label="Dans le pipeline" value={fmt(d.maActivo)} />
        <Tile label="Signées" value={fmt(d.maSigned)} accent />
        <Tile label="Prochainement" value={fmt(d.maSoon)} />
        <Tile label="" value="" />
      </Section>

      <Section title="Recruiters" href="/admin/recruiters">
        <Tile label="Recruiters" value={fmt(d.recCount)} />
        <Tile label="Prospects à valider" value={fmt(d.recPending)} accent />
        <Tile label="Prospects (total)" value={fmt(d.recTotal)} />
        <Tile label="" value="" />
      </Section>

      <Section title="Candidatures" href="/admin">
        <Tile label="À traiter" value={fmt(d.appPending)} accent />
        <Tile label="Total" value={fmt(d.appTotal)} />
        <Tile label="" value="" />
        <Tile label="" value="" />
      </Section>

      <Section title="Réservations" href="/admin/reservations">
        <Tile label="À traiter" value={fmt(d.resTodo)} accent />
        <Tile label="Total" value={fmt(d.resTotal)} />
        <Tile label="" value="" />
        <Tile label="" value="" />
      </Section>

      <Section title="Suggestions de lieux" href="/admin/suggestions">
        <Tile label="Total" value={fmt(d.sugTotal)} />
        <Tile label="" value="" />
        <Tile label="" value="" />
        <Tile label="" value="" />
      </Section>
    </main>
  );
}
