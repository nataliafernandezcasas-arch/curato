"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Rise, Photo } from "@/components/member/motion";
import { Viewer } from "@/components/member/viewer";
import { Retrato } from "@/components/member/retrato";
import { CaretLeft, CaretRight, DownloadSimple } from "@/components/member/iconos";

type Foto = { url: string; download: string };
type Storyteller = {
  id: string;
  name: string;
  handle: string | null;
  portrait: string | null;
  followers: number | null;
  date: string;
  accounts: number | null;
  views: number | null;
  interactions: number | null;
  engagement: number | null;
  rightsExpiresAt: string | null;
  photos: Foto[];
};
type Informe = {
  month: string;
  visits: number;
  guaranteed: number;
  belowMinimum: boolean;
  reach: { accounts: number; views: number; interactions: number; engagement: number | null; declared: number };
  value: {
    equivalent: number;
    cpm: number;
    subscription: number;
    offered: number;
    cost: number;
    perVisit: number | null;
    perThousandViews: number | null;
  };
  evolution: { month: string; visits: number; accounts: number; views: number }[];
  storytellers: Storyteller[];
  gallery: (Foto & { name: string; until: string | null })[];
};

const TEXTOS: Record<
  Lang,
  {
    kicker: string;
    visitsOf: (n: number) => string;
    below: (n: number) => string;
    pending: (n: number) => string;
    empty: string;
    previous: string;
    next: string;
    valueCap: string;
    valueLead: (cost: string, sub: string, offered: string) => string;
    valueNote: (cpm: number) => string;
    accounts: string;
    views: string;
    interactions: string;
    engagement: string;
    perVisit: string;
    perThousand: string;
    evolution: string;
    evolutionHint: string;
    storytellers: string;
    followers: (x: string) => string;
    exclusiveUntil: (d: string) => string;
    photos: string;
    photosHint: string;
    download: string;
    rate: string;
  }
> = {
  fr: {
    kicker: "Rapport mensuel",
    visitsOf: (n) => `visites sur les ${n} garanties`,
    below: (n) => `Ce mois-ci est en dessous des ${n} visites garanties : le mois suivant vous est offert.`,
    pending: (n) => (n > 1 ? `${n} visites n'ont pas encore déclaré leurs chiffres.` : "Une visite n'a pas encore déclaré ses chiffres."),
    empty: "Aucune visite ce mois-ci.",
    previous: "Mois précédent",
    next: "Mois suivant",
    valueCap: "Équivalent publicitaire estimé",
    valueLead: (cost, sub, offered) => `Pour ${cost} ce mois-ci : votre abonnement (${sub}) et ce que vous avez offert sur votre carte (${offered}).`,
    valueNote: (cpm) => `Estimation sur la base de ${cpm} € les 1 000 vues, le prix d'une publicité Instagram ciblée à Paris. Les vues viennent des statistiques que chaque storyteller déclare.`,
    accounts: "Comptes atteints",
    views: "Vues",
    interactions: "Interactions",
    engagement: "Taux d'interaction",
    perVisit: "Coût par visite",
    perThousand: "Coût pour 1 000 vues",
    evolution: "Les six derniers mois",
    evolutionHint: "Comptes atteints chaque mois, et le nombre de visites.",
    storytellers: "Les storytellers reçus",
    followers: (x) => `${x} abonnés`,
    exclusiveUntil: (d) => `Photos en exclusivité jusqu'au ${d}`,
    photos: "Vos photos",
    photosHint: "En haute définition, pour vos réseaux, votre site ou votre presse. Elles restent exclusives 90 jours après la visite.",
    download: "Télécharger",
    rate: "Voir la visite et donner votre avis",
  },
  en: {
    kicker: "Monthly report",
    visitsOf: (n) => `visits of the ${n} guaranteed`,
    below: (n) => `This month is below the ${n} guaranteed visits: the next one is on us.`,
    pending: (n) => (n > 1 ? `${n} visits haven't declared their figures yet.` : "One visit hasn't declared its figures yet."),
    empty: "No visits this month.",
    previous: "Previous month",
    next: "Next month",
    valueCap: "Estimated advertising equivalent",
    valueLead: (cost, sub, offered) => `For ${cost} this month: your subscription (${sub}) and what you offered on your menu (${offered}).`,
    valueNote: (cpm) => `Estimated at ${cpm} € per 1,000 views, the price of an Instagram ad targeted at Paris. Views come from the insights each storyteller declares.`,
    accounts: "Accounts reached",
    views: "Views",
    interactions: "Interactions",
    engagement: "Engagement rate",
    perVisit: "Cost per visit",
    perThousand: "Cost per 1,000 views",
    evolution: "The last six months",
    evolutionHint: "Accounts reached each month, and the number of visits.",
    storytellers: "Storytellers you hosted",
    followers: (x) => `${x} followers`,
    exclusiveUntil: (d) => `Photos exclusive until ${d}`,
    photos: "Your photos",
    photosHint: "In high definition, for your social media, website or press. They stay exclusive for 90 days after the visit.",
    download: "Download",
    rate: "See the visit and leave a review",
  },
  es: {
    kicker: "Informe mensual",
    visitsOf: (n) => `visitas de las ${n} garantizadas`,
    below: (n) => `Este mes está por debajo de las ${n} visitas garantizadas: el siguiente es gratis.`,
    pending: (n) => (n > 1 ? `${n} visitas todavía no han declarado sus cifras.` : "Una visita todavía no ha declarado sus cifras."),
    empty: "Ninguna visita este mes.",
    previous: "Mes anterior",
    next: "Mes siguiente",
    valueCap: "Equivalente publicitario estimado",
    valueLead: (cost, sub, offered) => `Por ${cost} este mes: tu suscripción (${sub}) y lo que ofreciste en tu carta (${offered}).`,
    valueNote: (cpm) => `Estimación a ${cpm} € las 1.000 vistas, el precio de un anuncio de Instagram dirigido a París. Las vistas salen de las estadísticas que declara cada storyteller.`,
    accounts: "Cuentas alcanzadas",
    views: "Vistas",
    interactions: "Interacciones",
    engagement: "Tasa de interacción",
    perVisit: "Coste por visita",
    perThousand: "Coste por 1.000 vistas",
    evolution: "Los últimos seis meses",
    evolutionHint: "Cuentas alcanzadas cada mes, y el número de visitas.",
    storytellers: "Los storytellers recibidos",
    followers: (x) => `${x} seguidores`,
    exclusiveUntil: (d) => `Fotos en exclusiva hasta el ${d}`,
    photos: "Tus fotos",
    photosHint: "En alta definición, para tus redes, tu web o tu prensa. Son exclusivas durante 90 días tras la visita.",
    download: "Descargar",
    rate: "Ver la visita y dar tu opinión",
  },
};

const etiqueta = "text-capitale uppercase tracking-capitale text-text-secondary";

/**
 * El informe mensual de la maison: lo que la casa obtuvo y lo que le costó.
 *
 * Responde a «¿me compensa?» (Natalia, 2026-10-20). Arriba, las visitas contra
 * el mínimo garantizado; después, el equivalente publicitario de lo publicado
 * frente al coste del mes; la evolución de seis meses; cada storyteller con
 * sus cifras, y las fotos para descargar en alta definición.
 */
export default function MaisonReport() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [mes, setMes] = useState<string | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [visor, setVisor] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/maison/report${mes ? `?month=${mes}` : ""}`)
      .then((r) => r.json())
      .then((d) => setInforme(d.error ? null : d))
      .catch(() => setInforme(null))
      .finally(() => setCargando(false));
  }, [mes]);

  if (cargando) return <div className="h-64 animate-pulse bg-border [animation-duration:1.6s]" />;
  if (!informe) return null;

  const eur = (n: number) => `${n.toLocaleString(lang)} €`;
  const cifra = (n: number | null) => (n == null ? "—" : n.toLocaleString(lang));
  const fecha = (iso: string) => new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const [anio, num] = informe.month.split("-").map(Number);
  const nombreMes = new Date(anio, num - 1, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  const mover = (delta: number) => {
    const d = new Date(Date.UTC(anio, num - 1 + delta, 1));
    setCargando(true);
    setMes(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const esEsteMes = informe.month === new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
  const pendientes = informe.visits - informe.reach.declared;
  const maxCuentas = Math.max(1, ...informe.evolution.map((e) => e.accounts));
  const v = informe.value;

  return (
    <div>
      <Rise>
        <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
        <div className="mt-bloque flex items-center gap-bloque">
          <button type="button" onClick={() => mover(-1)} aria-label={t.previous} className="-ml-3 flex h-11 w-11 items-center justify-center text-text-secondary hover:text-accent">
            <CaretLeft size={18} />
          </button>
          <p className="text-corps text-text-primary first-letter:uppercase">{nombreMes}</p>
          {!esEsteMes && (
            <button type="button" onClick={() => mover(1)} aria-label={t.next} className="flex h-11 w-11 items-center justify-center text-text-secondary hover:text-accent">
              <CaretRight size={18} />
            </button>
          )}
        </div>

        {/* La cifra que justifica la suscripción. */}
        <p className="mt-fila flex items-baseline gap-bloque">
          <span className={`text-cifra font-light leading-none tabular-nums ${informe.belowMinimum ? "text-copper-vif" : "text-accent"}`}>
            {informe.visits}
          </span>
          <span className="text-legende text-text-secondary">{t.visitsOf(informe.guaranteed)}</span>
        </p>
        {informe.belowMinimum && <p className="mt-fila max-w-[46ch] text-corps text-copper-vif">{t.below(informe.guaranteed)}</p>}
      </Rise>

      {informe.visits === 0 ? (
        <p className="py-respiro text-center text-corps text-text-secondary">{t.empty}</p>
      ) : (
        <>
          {/* Lo que vale y lo que costó, en su propio marco: es la respuesta a
              «¿me compensa?». */}
          <Rise index={1} className="mt-seccion">
            <section className="rounded-[20px] border border-accent/45 bg-accent/[0.07] p-5 sm:p-6">
              <p className="text-capitale uppercase tracking-capitale text-accent">{t.valueCap}</p>
              <p className="mt-bloque text-cifra font-light leading-none tabular-nums text-text-primary">{eur(v.equivalent)}</p>
              <p className="mt-fila text-legende text-text-secondary">{t.valueLead(eur(v.cost), eur(v.subscription), eur(v.offered))}</p>
              <div className="mt-fila border-t border-accent/25 pt-bloque">
                <Row label={<span className={etiqueta}>{t.accounts}</span>} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(informe.reach.accounts)}</span>} />
                <Row label={<span className={etiqueta}>{t.views}</span>} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(informe.reach.views)}</span>} />
                <Row label={<span className={etiqueta}>{t.interactions}</span>} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(informe.reach.interactions)}</span>} />
                <Row
                  label={<span className={etiqueta}>{t.engagement}</span>}
                  value={<span className="text-sous-titre tabular-nums text-text-primary">{informe.reach.engagement == null ? "—" : `${informe.reach.engagement.toLocaleString(lang)} %`}</span>}
                />
                <Row label={<span className={etiqueta}>{t.perVisit}</span>} value={<span className="text-sous-titre tabular-nums text-text-primary">{v.perVisit == null ? "—" : eur(v.perVisit)}</span>} />
                <Row
                  label={<span className={etiqueta}>{t.perThousand}</span>}
                  value={<span className="text-sous-titre tabular-nums text-text-primary">{v.perThousandViews == null ? "—" : eur(v.perThousandViews)}</span>}
                />
              </div>
              {pendientes > 0 && <p className="mt-bloque text-legende text-copper-vif">{t.pending(pendientes)}</p>}
              <p className="mt-fila text-legende text-text-muted">{t.valueNote(v.cpm)}</p>
            </section>
          </Rise>
        </>
      )}

      {/* La evolución: barras de cuentas alcanzadas, con las visitas encima. */}
      <Section title={t.evolution} hint={t.evolutionHint} className="mt-seccion">
        <div className="flex h-40 items-end gap-bloque">
          {informe.evolution.map((e) => {
            const actual = e.month === informe.month;
            return (
              <div key={e.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-etiqueta">
                <span className="text-legende tabular-nums text-text-secondary">{e.visits}</span>
                <div
                  className={`w-full rounded-t-[6px] ${actual ? "bg-accent" : "bg-accent/35"}`}
                  style={{ height: `${Math.max(4, (e.accounts / maxCuentas) * 100)}%` }}
                  title={`${e.accounts.toLocaleString(lang)}`}
                />
                <span className={`text-capitale uppercase ${actual ? "text-accent" : "text-text-muted"}`}>
                  {new Date(`${e.month}-01T12:00:00Z`).toLocaleDateString(lang, { month: "short" }).replace(".", "")}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {informe.storytellers.length > 0 && (
        <Section title={t.storytellers} className="mt-seccion">
          <div className="space-y-fila">
            {informe.storytellers.map((s) => (
              <div key={s.id} className="caja-cristal p-fila">
                <div className="flex items-center gap-fila">
                  <Retrato src={s.portrait} nombre={s.name} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-titulo text-sous-titre text-text-primary">{s.name}</p>
                    <p className="truncate text-legende text-text-secondary">
                      {[s.handle ? `@${s.handle}` : null, s.followers != null ? t.followers(s.followers.toLocaleString(lang)) : null, fecha(s.date)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="mt-fila grid grid-cols-2 gap-x-fila gap-y-bloque">
                  {[
                    [t.accounts, cifra(s.accounts)],
                    [t.views, cifra(s.views)],
                    [t.interactions, cifra(s.interactions)],
                    [t.engagement, s.engagement == null ? "—" : `${s.engagement.toLocaleString(lang)} %`],
                  ].map(([k, val]) => (
                    <div key={k} className="min-w-0">
                      <p className="text-sous-titre tabular-nums text-text-primary">{val}</p>
                      <p className="mt-etiqueta break-words text-capitale uppercase leading-tight tracking-[0.1em] text-text-muted">{k}</p>
                    </div>
                  ))}
                </div>
                {s.rightsExpiresAt && s.photos.length > 0 && (
                  <p className="mt-fila text-legende text-sauge-vif">{t.exclusiveUntil(fecha(s.rightsExpiresAt))}</p>
                )}
                <Link
                  href={`/dashboard/business/calendrier/${s.id}`}
                  className="mt-bloque inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4"
                >
                  {t.rate}
                </Link>
              </div>
            ))}
          </div>
        </Section>
      )}

      {informe.gallery.length > 0 && (
        <Section title={t.photos} hint={t.photosHint} className="mt-seccion">
          <div className="grid grid-cols-2 gap-bloque sm:grid-cols-3">
            {informe.gallery.map((f, i) => (
              <div key={f.url} className="relative">
                <button type="button" onClick={() => setVisor(i)} className="block w-full">
                  <Photo src={f.url} className="aspect-square" />
                </button>
                {/* Un enlace de verdad: en la app abre la foto original para
                    guardarla en el teléfono. */}
                <a
                  href={f.download}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${t.download} · ${f.name}`}
                  className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                >
                  <DownloadSimple size={18} />
                </a>
              </div>
            ))}
          </div>
          <Viewer photos={informe.gallery.map((f) => f.url)} index={visor} onClose={() => setVisor(null)} />
        </Section>
      )}
    </div>
  );
}
