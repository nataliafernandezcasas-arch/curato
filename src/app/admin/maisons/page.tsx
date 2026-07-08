import { createAdminClient } from "@/lib/supabase/admin";
import MaisonsList, { MaisonItem } from "./maisons-list";

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
  coming_soon?: boolean | null;
};

export default async function AdminMaisonsPage() {
  const admin = createAdminClient();

  // select("*") so the page keeps working even if newer columns don't exist yet.
  const { data } = await admin
    .from("comercios")
    .select("*")
    .eq("stage", "activo")
    .order("name", { ascending: true });

  const rows = (data ?? []) as Comercio[];

  // Account / connection status keyed by email.
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const lastSignInByEmail = new Map<string, string | null>();
  for (const u of users?.users ?? []) {
    if (u.email) lastSignInByEmail.set(u.email.toLowerCase(), u.last_sign_in_at ?? null);
  }

  const maisons: MaisonItem[] = rows.map((m) => {
    const email = (m.email || "").toLowerCase();
    const hasAccount = Boolean(m.email && lastSignInByEmail.has(email));
    const lastSignIn = m.email ? lastSignInByEmail.get(email) : null;
    return {
      id: m.id,
      name: m.name || "",
      email: m.email || "",
      place: m.arrondissement ? `Paris ${m.arrondissement}` : "",
      planLabel: m.subscription_plan ? PLAN_LABEL[m.subscription_plan] ?? m.subscription_plan : "—",
      isSigned: Boolean(m.commitment_accepted_at),
      signatory: m.commitment_signatory || "",
      signedDate: fmtDate(m.commitment_accepted_at ?? null),
      comingSoon: Boolean(m.coming_soon),
      account: lastSignIn ? "connected" : hasAccount ? "never" : "none",
      lastSignIn: lastSignIn ? fmtDate(lastSignIn) : "",
    };
  });

  const signedCount = maisons.filter((m) => m.isSigned).length;
  const connectedCount = maisons.filter((m) => m.account === "connected").length;

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/70 mb-3">
        {maisons.length} maisons · {signedCount} signées · {connectedCount} connectées
      </p>
      <h1 className="font-serif text-[32px] font-light tracking-[0.15em] uppercase text-white mb-10">Maisons</h1>

      <MaisonsList maisons={maisons} />
    </div>
  );
}
