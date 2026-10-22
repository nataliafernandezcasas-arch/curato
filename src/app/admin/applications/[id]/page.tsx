import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin/auth";
import ApplicationActions from "./actions";
import { PORTFOLIO_BUCKET, PORTFOLIO_SIGNED_URL_SECONDS } from "@/lib/candidature-portfolio";

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
  const handle = app.instagram ? String(app.instagram).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "") : null;

  // If approved, fetch creator profile
  let creator: {
    full_name: string | null;
    handle: string | null;
    monthly_credit_cop: number | null;
    credit_used_cop: number | null;
    followers: number | null;
    stage: string | null;
  } | null = null;

  // The bucket is private, so the review page mints short-lived URLs each time
  // it renders. Nothing linkable is written down, and a stale tab simply stops
  // showing the images rather than leaving them reachable.
  let portfolio: string[] = [];
  const paths: string[] = app.portfolio_paths ?? [];
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .createSignedUrls(paths, PORTFOLIO_SIGNED_URL_SECONDS);
    portfolio = (signed ?? [])
      .map((entry) => entry.signedUrl)
      .filter((url): url is string => Boolean(url));
  }

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
      <Link href="/admin" className="inline-flex items-center gap-2 font-serif text-capitale tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors mb-10">
        ← Candidaturas
      </Link>

      {/* Su perfil, como lo ve una casa: foto, Instagram, seguidores y dónde
          está basado; debajo, todas sus fotos (Natalia, 2026-10-22). */}
      <div className="mb-10 grid grid-cols-[96px_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
        {portfolio[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portfolio[0]} alt="" className="aspect-[4/5] w-full rounded-[16px] object-cover" />
        ) : (
          <span className="flex aspect-[4/5] w-full items-center justify-center rounded-[16px] bg-white/5 font-serif text-grande text-champagne">
            {String(app.name).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <StatusPill status={app.status} />
          <h1 className="mt-3 break-words font-titulo text-grande font-light text-white">{app.name}</h1>
          {handle && (
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-corps text-champagne hover:text-white"
            >
              @{handle}
            </a>
          )}
          {app.followers != null && (
            <p className="mt-3 text-corps text-white">
              <span className="text-sous-titre tabular-nums">{Number(app.followers).toLocaleString("fr-FR")}</span>
              <span className="text-white/50"> abonnés</span>
            </p>
          )}
          {Array.isArray(app.cities) && app.cities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(app.cities as string[]).map((c) => (
                <span key={c} className="rounded-full border border-champagne/40 px-3 py-1 text-legende text-white/80">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {portfolio.length > 0 && (
        <div className="mb-10">
          <p className="font-serif text-capitale tracking-[0.3em] uppercase text-champagne/40 mb-4">
            Portfolio · {portfolio.length} {portfolio.length === 1 ? "photo" : "photos"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {portfolio.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-[4/5] overflow-hidden rounded-[10px] border border-white/10 hover:border-champagne/40 transition-colors"
              >
                {/* Signed, short-lived, one-off URLs: next/image would try to cache
                    and optimise something that stops existing within the hour. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {app.type === "creator" && portfolio.length === 0 && (
        <p className="font-serif text-legende font-light text-white/25 mb-10 border-l border-white/10 pl-4">
          Sin portfolio. Candidatura enviada antes de que el formulario lo pidiera.
        </p>
      )}

      {/* Le regard */}
      {app.photo_style && (
        <div className="border border-white/10 bg-white/5 p-8 mb-10">
          <p className="font-serif text-capitale tracking-[0.3em] uppercase text-champagne/40 mb-4">Su mirada</p>
          <p className="font-serif text-corps font-light text-white/70 leading-relaxed">{app.photo_style}</p>
        </div>
      )}

      {/* Message */}
      {app.message && (
        <div className="border border-white/10 bg-white/5 p-8 mb-10">
          <p className="font-serif text-capitale tracking-[0.3em] uppercase text-champagne/40 mb-4">Mensaje</p>
          <p className="font-serif text-corps font-light text-white/70 leading-relaxed italic">&ldquo;{app.message}&rdquo;</p>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 mb-10">
        <InfoBlock label="Type" value={app.type === "creator" ? "Créateur · Creador" : "Maison · Casa"} />
        <InfoBlock label="Email" value={app.email} href={`mailto:${app.email}`} />
        {app.website && (
          <InfoBlock label="Sitio web" value={app.website.replace(/^https?:\/\//, "")} href={app.website} external />
        )}
        <InfoBlock
          label="Fecha"
          value={new Date(app.created_at).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        />
      </div>

      {/* Actions */}
      <ApplicationActions
        app={app}
        creatorEmail={app.status === "approved" && creator ? app.email : undefined}
        initialCredit={creator?.monthly_credit_cop ?? 0}
      />

      {/* Creator profile link */}
      {app.status === "approved" && creator && (
        <div className="mt-8 border border-white/10 bg-white/5 p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-serif text-capitale tracking-[0.3em] uppercase text-white/30 mb-2">Perfil activo</p>
            <p className="font-serif text-corps font-light text-white">@{creator.handle || app.instagram?.replace("@", "")}</p>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {creator.followers != null && creator.followers > 0 && (
                <p className="font-serif text-legende text-white/30">
                  {creator.followers >= 1000 ? `${(creator.followers / 1000).toFixed(1)}K` : creator.followers} seguidores
                </p>
              )}
              <p className="font-serif text-legende text-white/25">
                €{(creator.monthly_credit_cop ?? 0) - (creator.credit_used_cop ?? 0)} disponibles · €{creator.credit_used_cop ?? 0} usado
              </p>
            </div>
          </div>
          <Link
            href={`/admin/creators/${encodeURIComponent(app.email)}`}
            className="font-serif text-legende tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300"
          >
            Ver dashboard →
          </Link>
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
    waitlist: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  };
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aceptada",
    rejected: "Rechazada",
    deleted: "Borrada",
    waitlist: "Lista de espera",
  };
  return (
    <span className={`inline-block font-serif text-capitale tracking-[0.25em] uppercase border px-3 py-1.5 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function InfoBlock({ label, value, href, external }: { label: string; value: string; href?: string; external?: boolean }) {
  return (
    <div className="bg-white/5 px-6 py-5">
      <p className="font-serif text-capitale tracking-[0.3em] uppercase text-white/30 mb-2">{label}</p>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="font-serif text-corps font-light text-champagne/80 hover:text-champagne transition-colors"
        >
          {value}
        </a>
      ) : (
        <p className="font-serif text-corps font-light text-white/80">{value}</p>
      )}
    </div>
  );
}
