"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";

export type Application = {
  id: string;
  type: string;
  name: string;
  email: string;
  instagram: string | null;
  website: string | null;
  message: string | null;
  status: string;
  created_at: string;
  followers?: number | null;
  cities?: string[] | null;
  /** Las cuatro primeras fotos de su portfolio, firmadas. */
  photos: string[];
};

// La lista de espera (migración 056) y los textos de las tarjetas.
const EXTRA: Record<"fr" | "en" | "es", { waitlist: string; followers: (n: string) => string; noPhotos: string }> = {
  fr: { waitlist: "Liste d'attente", followers: (n) => `${n} abonnés`, noPhotos: "Pas de photos" },
  en: { waitlist: "Waiting list", followers: (n) => `${n} followers`, noPhotos: "No photos" },
  es: { waitlist: "Lista de espera", followers: (n) => `${n} seguidores`, noPhotos: "Sin fotos" },
};

function StatusBadge({ status, t, espera }: { status: string; t: { [K in keyof typeof translations.fr.admin]: string }; espera: string }) {
  const styles: Record<string, string> = {
    pending: "text-amber-300 border-amber-400/40 bg-amber-400/10",
    approved: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    rejected: "text-red-400 border-red-400/40 bg-red-400/10",
    deleted: "text-white/25 border-white/10 bg-white/5",
    waitlist: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  };
  const labels: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
    deleted: t.statusDeleted,
    waitlist: espera,
  };
  return (
    <span className={`inline-block font-serif text-capitale tracking-[0.25em] uppercase border px-2.5 py-1 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function ApplicationsList({ initial }: { initial: Application[] }) {
  const [apps] = useState(initial);
  const [tab, setTab] = useState<"all" | "creator" | "business" | "waitlist" | "deleted">("all");
  const { lang } = useLang();
  const t = translations[lang].admin;
  const x = EXTRA[lang] ?? EXTRA.fr;

  const active = apps.filter((a) => a.status !== "deleted");
  const deleted = apps.filter((a) => a.status === "deleted");

  const filtered = (
    tab === "deleted" ? deleted :
    tab === "waitlist" ? active.filter((a) => a.status === "waitlist") :
    tab === "all" ? active :
    active.filter((a) => a.type === tab)
  ).sort((a, b) => {
    // Pending first
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    // Then the waiting list
    if (a.status === "waitlist" && b.status !== "waitlist") return -1;
    if (b.status === "waitlist" && a.status !== "waitlist") return 1;
    // Then most recent first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = {
    all: active.length,
    creator: active.filter((a) => a.type === "creator").length,
    business: active.filter((a) => a.type === "business").length,
    pending: active.filter((a) => a.status === "pending").length,
    approved: active.filter((a) => a.status === "approved").length,
    waitlist: active.filter((a) => a.status === "waitlist").length,
    deleted: deleted.length,
  };

  const tabs = [
    { key: "all", label: t.tabAll, count: counts.all },
    { key: "creator", label: t.tabCreators, count: counts.creator },
    { key: "business", label: t.tabHouses, count: counts.business },
    { key: "waitlist", label: x.waitlist, count: counts.waitlist },
    { key: "deleted", label: t.tabDeleted, count: counts.deleted },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <p className="font-serif text-capitale tracking-[0.35em] uppercase text-champagne/50 mb-4">
          {t.pageLabel}
        </p>
        <h1 className="font-serif text-grande sm:text-cifra font-light tracking-[0.2em] sm:tracking-[0.28em] uppercase text-white break-words">
          {t.pageTitle}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10">
        {[
          { key: "total", label: t.statTotal, value: counts.all },
          { key: "pending", label: t.statPending, value: counts.pending },
          { key: "approved", label: t.statApproved, value: counts.approved },
        ].map((s) => (
          <div key={s.key} className="min-w-0 bg-white/8 backdrop-blur-sm border border-white/10 px-3 py-4 sm:px-8 sm:py-6">
            {/* En el teléfono, menos espaciado entre letras: «PENDIENTES» se salía de la caja. */}
            <p className="font-serif text-capitale sm:text-capitale tracking-[0.12em] sm:tracking-[0.35em] uppercase text-champagne/50 mb-2 break-words">{s.label}</p>
            <p className="font-serif text-grande font-light text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap font-serif text-legende tracking-wider pb-3 transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-white border-champagne"
                : "text-white/35 border-transparent hover:text-white/60"
            }`}
          >
            {t.label}
            <span className="ml-2 text-capitale opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-corps font-light text-white/40">{t.empty}</p>
        </div>
      ) : (
        // Cada candidatura como una demanda en el lado de la casa: su foto,
        // su Instagram, sus seguidores, dónde está basada y sus fotos debajo.
        // Se toca para abrirla entera y decidir abajo (Natalia, 2026-10-22).
        <div className="space-y-4">
          {filtered.map((app) => {
            const handle = app.instagram ? app.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "") : null;
            return (
              <Link
                key={app.id}
                href={`/admin/applications/${app.id}`}
                className="block overflow-hidden rounded-[20px] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(245,239,228,0.10)] transition-colors hover:bg-white/[0.08]"
              >
                <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-5">
                  {app.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={app.photos[0]} alt="" className="aspect-[4/5] w-full rounded-[14px] object-cover" />
                  ) : (
                    <span className="flex aspect-[4/5] w-full items-center justify-center rounded-[14px] bg-white/5 font-serif text-sous-titre text-champagne">
                      {app.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={app.status} t={t} espera={x.waitlist} />
                      <span className="font-serif text-capitale uppercase tracking-[0.2em] text-white/40">
                        {app.type === "creator" ? t.typeCreator : t.typeHouse}
                      </span>
                    </div>
                    <p className="break-words font-titulo text-sous-titre text-white">{app.name}</p>
                    {handle && <p className="truncate text-legende text-champagne">@{handle}</p>}
                    {app.type !== "creator" && app.website && (
                      <p className="truncate text-legende text-champagne">{app.website.replace(/^https?:\/\//, "")}</p>
                    )}
                    <p className="text-legende text-white/60">
                      {[
                        app.followers != null ? x.followers(app.followers.toLocaleString(lang)) : null,
                        app.cities?.length ? app.cities.join(" · ") : null,
                      ]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                    <p className="text-capitale text-white/30">
                      {new Date(app.created_at).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {app.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5 px-4 pb-4 sm:px-5 sm:pb-5">
                    {app.photos.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
