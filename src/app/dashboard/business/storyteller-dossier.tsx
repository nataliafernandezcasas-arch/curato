"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dossier } from "@/lib/storyteller-dossier";
import type { Lang } from "@/lib/i18n/translations";
import { Section } from "@/components/member/section";
import { SlideIn } from "@/components/member/slide-in";
import { StateMark } from "@/components/member/state-mark";
import { Viewer } from "@/components/member/viewer";
import { compacto, enLetra, nombrePila, porcentaje } from "./demandes-format";

const TEXTOS = {
  fr: {
    back: "Retour",
    style: "Sa façon de photographier",
    shownStrip: (n: number) =>
      `${enLetra(n, "fr", true)} photographies, montrées avec son accord. Elles restent les siennes : à regarder, pas à reprendre.`,
    shownGrid: (n: number) =>
      `${enLetra(n, "fr", true)} photographies remises avec sa candidature. Elles restent les siennes : à regarder, pas à reprendre.`,
    viewerCaption: "À regarder, pas à reprendre.",
    recent: "Ses dernières publications",
    beforePortfolio: (p: string) => `${p} a rejoint Curato avant que nous demandions un portfolio. Voici son compte.`,
    club: "Son parcours dans le club",
    visits: "Visites réalisées",
    avgReachVisit: "Portée moyenne par visite",
    clubNote: "Nous ne disons pas chez quelles maisons : ce qui se passe chez un membre reste entre nous.",
    first: "Sa première visite dans le club",
    firstText: (p: string) =>
      `Vous seriez la première maison à recevoir ${p}. Les deux stories sont dues, comme pour tout le monde.`,
    audience: "Son audience",
    followers: "Abonnés",
    avgReach: "Portée moyenne",
    engagement: "Engagement",
    noIg: (p: string, fotos: boolean) =>
      `${p} n'a pas relié son compte Instagram, nous n'avons donc pas ses chiffres.${fotos ? " Ses photographies disent le reste." : ""}`,
    igUnavailable: "Ses chiffres Instagram ne se sont pas chargés. Ils reviendront à la prochaine ouverture.",
    allWeKnow: (p: string) => `C'est tout ce que nous savons de ${p} pour l'instant.`,
    note: "Son mot",
    failedCap: "Profil indisponible",
    failed: "Ce profil ne s'est pas chargé. Réessayez dans un instant.",
    quote: (s: string) => `« ${s} »`,
  },
  en: {
    back: "Back",
    style: "How they photograph",
    shownStrip: (n: number) =>
      `${enLetra(n, "en", true)} photographs, shown with their agreement. They remain theirs: to look at, not to take.`,
    shownGrid: (n: number) =>
      `${enLetra(n, "en", true)} photographs sent with their application. They remain theirs: to look at, not to take.`,
    viewerCaption: "To look at, not to take.",
    recent: "Latest posts",
    beforePortfolio: (p: string) => `${p} joined Curato before we asked for a portfolio. Here is their account.`,
    club: "Their record in the club",
    visits: "Visits made",
    avgReachVisit: "Average reach per visit",
    clubNote: "We don't say at which houses: what happens at a member's stays between us.",
    first: "Their first visit in the club",
    firstText: (p: string) => `You would be the first house to welcome ${p}. The two stories are owed, as for everyone.`,
    audience: "Their audience",
    followers: "Followers",
    avgReach: "Average reach",
    engagement: "Engagement",
    noIg: (p: string, fotos: boolean) =>
      `${p} hasn't connected their Instagram account, so we don't have their figures.${fotos ? " Their photographs say the rest." : ""}`,
    igUnavailable: "Their Instagram figures didn't load. They'll be back next time you open this.",
    allWeKnow: (p: string) => `That's all we know about ${p} for now.`,
    note: "Their note",
    failedCap: "Profile unavailable",
    failed: "This profile didn't load. Try again in a moment.",
    quote: (s: string) => `“${s}”`,
  },
  es: {
    back: "Volver",
    style: "Su manera de fotografiar",
    shownStrip: (n: number) =>
      `${enLetra(n, "es", true)} fotografías, mostradas con su acuerdo. Siguen siendo suyas: para mirar, no para llevárselas.`,
    shownGrid: (n: number) =>
      `${enLetra(n, "es", true)} fotografías enviadas con su candidatura. Siguen siendo suyas: para mirar, no para llevárselas.`,
    viewerCaption: "Para mirar, no para llevárselas.",
    recent: "Sus últimas publicaciones",
    beforePortfolio: (p: string) => `${p} entró en Curato antes de que pidiéramos un portafolio. Esta es su cuenta.`,
    club: "Su recorrido en el club",
    visits: "Visitas realizadas",
    avgReachVisit: "Alcance medio por visita",
    clubNote: "No decimos en qué maisons: lo que pasa en casa de un miembro queda entre nosotros.",
    first: "Su primera visita en el club",
    firstText: (p: string) => `Serías la primera maison en recibir a ${p}. Las dos stories se deben, como para todos.`,
    audience: "Su audiencia",
    followers: "Seguidores",
    avgReach: "Alcance medio",
    engagement: "Engagement",
    noIg: (p: string, fotos: boolean) =>
      `${p} no ha conectado su cuenta de Instagram, así que no tenemos sus cifras.${fotos ? " Sus fotografías dicen el resto." : ""}`,
    igUnavailable: "Sus cifras de Instagram no se cargaron. Volverán la próxima vez que lo abras.",
    allWeKnow: (p: string) => `Es todo lo que sabemos de ${p} por ahora.`,
    note: "Su nota",
    failedCap: "Perfil no disponible",
    failed: "Este perfil no se cargó. Vuelve a intentarlo en un momento.",
    quote: (s: string) => `«${s}»`,
  },
};

type Textos = (typeof TEXTOS)["fr"];

/** Lo que enseña cómo mira: sus fotos de perfil y después las de la candidatura. */
export function fotosDe(d: Dossier): string[] {
  return [...(d.estilo ?? []), ...d.portfolio].slice(0, 6);
}

function iniciales(name: string): string {
  const parts = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * El dossier de un storyteller, a pantalla completa.
 *
 * Es una sola pieza para dos sitios (entrega 4, 10 duodecies): con una demanda
 * delante lleva la fecha arriba y la decisión abajo; desde el roster, ni una ni
 * otra. Lo de en medio es idéntico, porque responde a la misma pregunta.
 *
 * El orden es la tesis: retrato, nombre, su frase, sus fotos, lo que hizo en
 * otras casas y, solo al final, las cifras. Las cifras son lo que menos dice
 * sobre si esta persona fotografiará bien la casa.
 */
export function DossierPane({
  dossier,
  loading = false,
  failed = false,
  lang,
  onClose,
  header,
  footer,
  note,
}: {
  dossier: Dossier | null;
  loading?: boolean;
  failed?: boolean;
  lang: Lang;
  onClose: () => void;
  /** Lo que va fijo arriba, bajo "Retour": la fecha pedida, en una demanda. */
  header?: React.ReactNode;
  /** Lo que va fijo abajo: la consecuencia y la decisión, en una demanda. */
  footer?: React.ReactNode;
  /** La nota libre que el creador dejó con su demanda. */
  note?: string | null;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [visor, setVisor] = useState<number | null>(null);
  const cerrarVisor = useCallback(() => setVisor(null), []);

  // Escape cierra, y la página de debajo deja de moverse mientras esto está encima.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && visor === null && onClose();
    window.addEventListener("keydown", alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose, visor]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-surface">
      <SlideIn>
        <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col">
          {/* La cabecera se queda arriba mientras se baja por el dossier: una
              casa llena mira la fecha y sale, una que duda sigue bajando. */}
          <header
            className="sticky top-0 z-10 px-pagina pb-fila backdrop-blur-md"
            style={{ backgroundColor: "rgba(25,24,23,0.92)", paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[52px] items-center text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
            >
              {t.back}
            </button>
            {header}
          </header>

          <div className="flex-1 px-pagina pb-seccion pt-rango">
            {loading ? (
              <div aria-hidden className="space-y-fila">
                <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-surface-raised [animation-duration:1.6s]" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-[20px] bg-surface-raised [animation-duration:1.6s]" />
                ))}
              </div>
            ) : failed || !dossier ? (
              <StateMark tono="caido" capital={t.failedCap}>
                {t.failed}
              </StateMark>
            ) : (
              <Cuerpo d={dossier} t={t} lang={lang} note={note ?? null} onOpen={setVisor} />
            )}
          </div>

          {footer && (
            <footer
              className="sticky bottom-0 z-10 px-pagina pt-fila backdrop-blur-md"
              style={{
                backgroundColor: "rgba(20,20,20,0.92)",
                paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {footer}
            </footer>
          )}
        </div>
      </SlideIn>

      {dossier && (
        <Viewer photos={fotosDe(dossier)} index={visor} onClose={cerrarVisor} caption={t.viewerCaption} protect />
      )}
    </div>
  );
}

function Cifra({ label, value, fuerte = false }: { label: string; value: string; fuerte?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-fila">
      <span className="text-corps text-text-secondary">{label}</span>
      <span
        className={`whitespace-nowrap tabular-nums ${fuerte ? "text-titre text-accent" : "text-sous-titre text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Cuerpo({
  d,
  t,
  lang,
  note,
  onOpen,
}: {
  d: Dossier;
  t: Textos;
  lang: Lang;
  note: string | null;
  onOpen: (i: number) => void;
}) {
  const p = nombrePila(d.name);
  const conIg = d.audience !== null;
  // Las que sube a su perfil primero, después las de la candidatura. Seis.
  const fotos = fotosDe(d);
  const conPortafolio = fotos.length > 0;
  const conVisitas = d.club.visits > 0;
  const posts = d.recentPosts.filter((x) => x.thumbnail);
  const [primero, ...resto] = d.name.split(/\s+/);

  const cifras = d.audience
    ? [
        d.audience.followers != null && { label: t.followers, value: compacto(d.audience.followers, lang) },
        d.audience.avgReach != null && { label: t.avgReach, value: compacto(d.audience.avgReach, lang) },
        d.audience.engagement != null && { label: t.engagement, value: porcentaje(d.audience.engagement, lang) },
      ].filter((c): c is { label: string; value: string } => Boolean(c))
    : [];

  // Mirar, no guardar: sin el menú de "guardar imagen" al mantener pulsado.
  const foto = "h-full w-full select-none object-cover [-webkit-touch-callout:none]";
  const sinMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <>
      {d.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.portrait} alt="" className="aspect-[4/5] w-full rounded-[20px] object-cover" />
      ) : (
        <div className="flex aspect-[4/5] w-24 items-center justify-center rounded-[14px] bg-surface-raised text-sous-titre text-accent">
          {iniciales(d.name)}
        </div>
      )}

      <div className="mt-fila">
        <h2 className="break-words text-titre uppercase tracking-titre text-text-primary">
          <span className="block">{primero}</span>
          {resto.length > 0 && <span className="block">{resto.join(" ")}</span>}
        </h2>
        {(d.handle || d.categories.length > 0) && (
          <p className="mt-bloque text-legende text-text-secondary">
            {d.handle && (
              <a
                href={`https://instagram.com/${d.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
              >
                @{d.handle}
              </a>
            )}
            {d.handle && d.categories.length > 0 && " · "}
            {d.categories.join(", ")}
          </p>
        )}
      </div>

      {/* La frase va encima de las fotos: enseña cómo mirarlas. */}
      {d.phrase && <p className="mt-rango text-champ italic text-text-primary">{t.quote(d.phrase)}</p>}

      <div className="mt-seccion">
        {conPortafolio && (
          <Section title={t.style}>
            {conIg ? (
              <div className="-mx-pagina flex snap-x gap-bloque overflow-x-auto px-pagina pb-bloque [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {fotos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpen(i)}
                    className="aspect-[4/5] w-[152px] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" draggable={false} onContextMenu={sinMenu} className={foto} />
                  </button>
                ))}
              </div>
            ) : (
              // Sin cifras, el portafolio crece y ocupa su sitio: es lo que más
              // se acerca a lo que se quería enseñar.
              <div className="grid grid-cols-2 gap-bloque">
                {fotos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpen(i)}
                    className="aspect-[4/5] overflow-hidden rounded-2xl bg-surface-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" draggable={false} onContextMenu={sinMenu} className={foto} />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-bloque max-w-[46ch] text-legende text-text-secondary">
              {t.shownStrip(fotos.length)}
            </p>
          </Section>
        )}

        {/* Sus seis últimas publicaciones, siempre que haya: también dicen
            cómo fotografía, y son lo que la casa verá después de la visita. */}
        {posts.length > 0 && (
          <Section title={t.recent}>
            <div className="grid grid-cols-3 gap-1.5">
              {posts.slice(0, 6).map((post, i) => (
                <a
                  key={i}
                  href={post.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg bg-surface-raised"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.thumbnail ?? ""} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
            {!conPortafolio && (
              <p className="mt-bloque max-w-[46ch] text-legende text-text-secondary">{t.beforePortfolio(p)}</p>
            )}
          </Section>
        )}

        {conVisitas ? (
          <Section title={t.club}>
            <div className="space-y-fila">
              <Cifra label={t.visits} value={String(d.club.visits)} fuerte />
              {d.club.avgReach != null && (
                <Cifra label={t.avgReachVisit} value={compacto(d.club.avgReach, lang)} fuerte />
              )}
            </div>
            <p className="mt-fila max-w-[46ch] text-legende text-text-secondary">{t.clubNote}</p>
          </Section>
        ) : (
          // La primera visita se dice como un privilegio, no como un riesgo.
          <section className="mb-seccion">
            <p className="mb-bloque text-capitale uppercase tracking-capitale text-sauge-vif">{t.first}</p>
            <p className="max-w-[46ch] text-corps text-text-primary">{t.firstText(p)}</p>
          </section>
        )}

        <Section title={t.audience}>
          {!conIg ? (
            // La ausencia se dice con palabras y sin culpar: es una casilla sin
            // rellenar, no un fallo. Por eso no va en copper.
            <p className="max-w-[46ch] text-corps text-text-secondary">{t.noIg(p, conPortafolio)}</p>
          ) : cifras.length > 0 ? (
            <div className="space-y-fila">
              {cifras.map((c) => (
                <Cifra key={c.label} label={c.label} value={c.value} />
              ))}
            </div>
          ) : (
            <p className="max-w-[46ch] text-corps text-text-secondary">{t.igUnavailable}</p>
          )}
        </Section>

        {note && (
          <Section title={t.note}>
            <p className="max-w-[46ch] text-corps text-text-primary">{note}</p>
          </Section>
        )}

        {!conIg && !conPortafolio && !conVisitas && (
          <p className="max-w-[46ch] text-corps text-text-secondary">{t.allWeKnow(p)}</p>
        )}
      </div>
    </>
  );
}
