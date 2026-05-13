import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import ApplicationActions from "./actions";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await isAdmin();
  if (!ok) return notFound();

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!app) return notFound();

  // If approved, fetch creator profile
  let creator: {
    full_name: string | null;
    handle: string | null;
    monthly_credit_cop: number | null;
    credit_used_cop: number | null;
    followers: number | null;
    stage: string | null;
  } | null = null;

  if (app.status === "approved" && app.type === "creator") {
    const { data } = await supabase
      .from("creators")
      .select("full_name, handle, monthly_credit_cop, credit_used_cop, followers, stage")
      .eq("email", app.email.toLowerCase())
      .maybeSingle();
    creator = data;
  }

  return (
    <main className="max-w-[800px] mx-auto px-5 py-14">

      {/* Back */}
      <Link href="/admin" className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
        ← Candidaturas
      </Link>

      {/* Header */}
      <div className="mb-10">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-4">
          Curato · Admin · Candidature
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-white">
            {app.name}
          </h1>
          <StatusPill status={app.status} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 mb-10">
        <InfoBlock label="Type" value={app.type === "creator" ? "Créateur · Creador" : "Maison · Casa"} />
        <InfoBlock label="Email" value={app.email} href={`mailto:${app.email}`} />
        {app.instagram && (
          <InfoBlock
            label="Instagram"
            value={app.instagram.startsWith("@") ? app.instagram : `@${app.instagram}`}
            href={`https://instagram.com/${app.instagram.replace("@", "")}`}
            external
          />
        )}
        {app.website && (
          <InfoBlock
            label="Sitio web"
            value={app.website.replace(/^https?:\/\//, "")}
            href={app.website}
            external
          />
        )}
        <InfoBlock
          label="Fecha"
          value={new Date(app.created_at).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        />
      </div>

      {/* Message */}
      {app.message && (
        <div className="border border-white/10 bg-white/5 p-8 mb-10">
          <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/40 mb-4">Mensaje</p>
          <p className="font-serif text-[16px] font-light text-white/70 leading-relaxed italic">
            "{app.message}"
          </p>
        </div>
      )}

      {/* Actions */}
      <ApplicationActions app={app} />

      {/* Creator profile link */}
      {app.status === "approved" && creator && (
        <div className="mt-10 border border-champagne/20 bg-champagne/5 p-8">
          <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-champagne/60 mb-4">Perfil activo</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-serif text-[17px] font-light text-white">@{creator.handle || app.instagram?.replace("@", "")}</p>
              <p className="font-serif text-[13px] text-white/40 mt-1">
                {creator.followers != null && creator.followers > 0
                  ? `${creator.followers >= 1000 ? `${(creator.followers / 1000).toFixed(1)}K` : creator.followers} seguidores`
                  : "Seguidores no registrados"}
                {" · "}
                €{(creator.monthly_credit_cop ?? 0) - (creator.credit_used_cop ?? 0)} disponibles de €{creator.monthly_credit_cop ?? 0}
              </p>
            </div>
            <Link
              href={`/admin/creators/${encodeURIComponent(app.email)}`}
              className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300"
            >
              Ver dashboard →
            </Link>
          </div>
        </div>
      )}

    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-amber-300 border-amber-400/40 bg-amber-400/10",
    approved: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    rejected: "text-red-400 border-red-400/40 bg-red-400/10",
    deleted: "text-white/25 border-white/10 bg-white/5",
  };
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aceptada",
    rejected: "Rechazada",
    deleted: "Borrada",
  };
  return (
    <span className={`font-serif text-[11px] tracking-[0.25em] uppercase border px-3 py-1.5 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function InfoBlock({ label, value, href, external }: { label: string; value: string; href?: string; external?: boolean }) {
  return (
    <div className="bg-white/5 px-6 py-5">
      <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">{label}</p>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="font-serif text-[15px] font-light text-champagne/80 hover:text-champagne transition-colors"
        >
          {value}
        </a>
      ) : (
        <p className="font-serif text-[15px] font-light text-white/80">{value}</p>
      )}
    </div>
  );
}
