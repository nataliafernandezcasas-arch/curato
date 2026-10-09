"use client";

import { Medio } from "@/components/member/medio";
import { VIDEO_MAX_S } from "@/lib/medio";
import { TarjetaCasa, type CasaTarjeta } from "@/components/member/tarjeta-casa";
import { useState, useEffect, useRef } from "react";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Button, ButtonLink, LabelButton } from "@/components/member/button";
import { PullToRefresh } from "@/components/member/pull-to-refresh";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";

const ERROR_SUBIDA: Record<Lang, Record<"fallo" | "pronto" | "peso" | "largo", string>> = {
  fr: {
    fallo: "L'envoi n'a pas abouti. Vérifiez la connexion et réessayez.",
    pronto: "Vous pourrez ajouter les photos après l'heure de la visite.",
    peso: "Un fichier est trop lourd : 25 Mo par photo, 200 Mo par vidéo.",
    largo: `Une vidéo dure plus de ${VIDEO_MAX_S} secondes. Raccourcissez-la avant de l'ajouter.`,
  },
  en: {
    fallo: "The upload didn't go through. Check your connection and try again.",
    pronto: "You can add the photos after the time of the visit.",
    peso: "A file is too large: 25 MB per photo, 200 MB per video.",
    largo: `A video is longer than ${VIDEO_MAX_S} seconds. Trim it before adding it.`,
  },
  es: {
    fallo: "No se pudo enviar. Revisa la conexión y vuelve a intentarlo.",
    pronto: "Podrás añadir las fotos después de la hora de la visita.",
    peso: "Un archivo pesa demasiado: 25 MB por foto, 200 MB por vídeo.",
    largo: `Un vídeo dura más de ${VIDEO_MAX_S} segundos. Recórtalo antes de añadirlo.`,
  },
};

/** Cuánto dura un vídeo elegido, leyendo solo su cabecera. */
function duracion(file: File): Promise<number> {
  return new Promise((listo) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      listo(v.duration);
    };
    // Si el teléfono no sabe leerlo, no se bloquea: el servidor limita el peso.
    v.onerror = () => {
      URL.revokeObjectURL(url);
      listo(0);
    };
    v.src = url;
  });
}

type Reach = { views: number | null; accounts: number | null; interactions: number | null };

type Visit = {
  id: string;
  maison: string;
  slotStart: string;
  status: string;
  today: boolean;
  visitedAt: string | null;
  partySize?: number;
  calendar?: { google: string; ics: string } | null;
  photos: string[];
  rightsExpiresAt: string | null;
  reach: Reach | null;
  media?: { url: string; path: string }[];
  stories?: { path: string; views: number | null; accounts: number | null; interactions: number | null }[];
  pending?: boolean;
  casa?: CasaTarjeta | null;
  cost?: number;
  lateCancel?: boolean;
  mustConfirm?: boolean;
  canCancel?: boolean;
};

type Credito = { mensual: number; usado: number; restante: number };

// La portée de cada story, y si la visita ya está validada.
const PORTEE: Record<Lang, { story: (n: number) => string; pending: string; done: string; saved: string }> = {
  fr: {
    story: (n) => `Story ${n}`,
    pending: "Ajoutez les chiffres de chaque story : tant qu'ils manquent, la visite n'est pas validée et vous ne pouvez pas réserver d'autre maison.",
    done: "Visite validée.",
    saved: "Chiffres enregistrés.",
  },
  en: {
    story: (n) => `Story ${n}`,
    pending: "Add the figures for each story: until they're all in, the visit isn't validated and you can't book another house.",
    done: "Visit validated.",
    saved: "Figures saved.",
  },
  es: {
    story: (n) => `Story ${n}`,
    pending: "Añade las cifras de cada story: mientras falten, la visita no queda validada y no puedes reservar otra casa.",
    done: "Visita validada.",
    saved: "Cifras guardadas.",
  },
};

// El crédito y lo que cuesta cada visita, y confirmar o cancelar.
const VISITA: Record<
  Lang,
  {
    credit: string;
    left: (n: number, de: number) => string;
    cost: (n: number) => string;
    lost: string;
    confirm: string;
    cancel: string;
  }
> = {
  fr: {
    credit: "Votre crédit ce mois-ci",
    left: (n, de) => `${n} € restants sur ${de} €`,
    cost: (n) => `${n} € de crédit`,
    lost: "Annulée moins de 24 h avant : crédit perdu",
    confirm: "Confirmer ma venue",
    cancel: "Annuler la visite",
  },
  en: {
    credit: "Your credit this month",
    left: (n, de) => `${n} € left of ${de} €`,
    cost: (n) => `${n} € of credit`,
    lost: "Cancelled less than 24 h before: credit lost",
    confirm: "Confirm I'm coming",
    cancel: "Cancel the visit",
  },
  es: {
    credit: "Tu crédito este mes",
    left: (n, de) => `${n} € de ${de} € disponibles`,
    cost: (n) => `${n} € de crédito`,
    lost: "Cancelada con menos de 24 h: crédito perdido",
    confirm: "Confirmar que voy",
    cancel: "Cancelar la visita",
  },
};

// El código de la visita (migración 040): el storyteller lo enseña y la casa
// lo escanea.
const CODIGO: Record<Lang, { show: string; done: string }> = {
  fr: { show: "Mon code de visite", done: "Visite enregistrée par la maison" },
  en: { show: "My visit code", done: "Visit recorded by the maison" },
  es: { show: "Mi código de visita", done: "Visita registrada por la maison" },
};

// Apuntar la visita en el calendario del teléfono, una a una. Los dos enlaces
// se abren fuera de la app: Google en su web o su app, el .ics en Safari, que
// es quien sabe añadirlo al calendario de Apple.
const CALENDARIO: Record<Lang, { add: string; google: string; apple: string; party: (n: number) => string }> = {
  fr: { add: "Ajouter à mon calendrier", google: "Google", apple: "Apple", party: (n) => (n > 1 ? `${n} personnes` : "1 personne") },
  en: { add: "Add to my calendar", google: "Google", apple: "Apple", party: (n) => (n > 1 ? `${n} people` : "1 person") },
  es: { add: "Añadir a mi calendario", google: "Google", apple: "Apple", party: (n) => (n > 1 ? `${n} personas` : "1 persona") },
};

/** Las horas que quedan del plazo de 24 h para publicar las dos stories. */
function horasRestantes(slotStart: string): number | null {
  const limite = new Date(slotStart).getTime() + 24 * 60 * 60 * 1000;
  const quedan = Math.ceil((limite - Date.now()) / (60 * 60 * 1000));
  return quedan > 0 ? quedan : null;
}

type StatusKey = "confirmed" | "pending" | "visited" | "declined" | "cancelled" | "noShow";

const STATUS_KEY: Record<string, StatusKey> = {
  confirmed: "confirmed",
  pending_review: "pending",
  completed: "visited",
  declined: "declined",
  cancelled: "cancelled",
  // Un plantón no es un rechazo. Se pintaban igual, y son cosas distintas:
  // esta lleva strike y la casa la sufrió.
  no_show: "noShow",
};

// Sauge lo cumplido, copper lo que tiene plazo, burgundy lo que se cayó.
const STATUS_TONE: Record<StatusKey, string> = {
  confirmed: "text-sauge-vif",
  visited: "text-sauge-vif",
  pending: "text-copper-vif",
  declined: "text-burgundy-vif",
  noShow: "text-burgundy-vif",
  cancelled: "text-text-muted",
};

/** Se ordena por lo que toca hacer, no por fecha. */
function groupOf(v: Visit): "todo" | "upcoming" | "past" {
  // Con fotos pero sin todas las cifras sigue por hacer: bloquea las reservas.
  if (v.photos.length > 0) return v.pending ? "todo" : "past";
  if (v.status === "declined" || v.status === "cancelled" || v.status === "no_show") return "past";
  const yaPasó = new Date(v.slotStart).getTime() < Date.now();
  if (!yaPasó) return "upcoming";
  return v.status === "confirmed" || v.status === "completed" ? "todo" : "upcoming";
}

function VisitCard({
  visit,
  t,
  lang,
  onChanged,
}: {
  visit: Visit;
  t: Record<string, string>;
  lang: Lang;
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // El único error es el de las fotos que faltan: se guarda el hecho, no el
  // texto, para que siga al idioma.
  // Qué falló, para decirlo: antes una subida fallida no decía nada.
  const [error, setError] = useState<false | "min" | "fallo" | "pronto" | "peso" | "largo">(false);
  // Las cifras de cada story (migración 048), por la ruta de su captura.
  type Cifras = { views: string; accounts: string; interactions: string };
  const [cifras, setCifras] = useState<Record<string, Cifras>>(() =>
    Object.fromEntries(
      (visit.stories ?? []).map((c) => [
        c.path,
        {
          views: c.views == null ? "" : String(c.views),
          accounts: c.accounts == null ? "" : String(c.accounts),
          interactions: c.interactions == null ? "" : String(c.interactions),
        },
      ])
    )
  );
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const cifrasDe = (path: string): Cifras => cifras[path] ?? { views: "", accounts: "", interactions: "" };
  const completas = (visit.media ?? []).every((m) => {
    const c = cifrasDe(m.path);
    return c.views !== "" && c.accounts !== "" && c.interactions !== "";
  });

  // Se guardan todas a la vez. Se puede volver más tarde a completarlas: la
  // portée de una story se ve en Instagram al cabo de unas horas.
  async function guardarPortee() {
    setGuardando(true);
    setGuardado(false);
    try {
      const res = await fetch("/api/reservations/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: visit.id,
          stories: (visit.media ?? []).map((m) => ({ path: m.path, ...cifrasDe(m.path) })),
        }),
      });
      if (res.ok) {
        setGuardado(true);
        onChanged();
      }
    } finally {
      setGuardando(false);
    }
  }

  const statusKey = STATUS_KEY[visit.status] ?? "pending";
  const canUpload = visit.status === "confirmed" || visit.status === "completed";

  const dateLabel = new Date(visit.slotStart).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  const rightsLabel = visit.rightsExpiresAt
    ? new Date(visit.rightsExpiresAt).toLocaleDateString(lang, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : null;

  // Las fotos van directas del teléfono al almacenamiento, con un permiso
  // firmado por foto. Antes pasaban por el servidor, y Vercel corta cualquier
  // petición de más de 4,5 MB: dos fotos de iPhone ya no llegaban.
  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const lista = Array.from(files);
    if (fileRef.current) fileRef.current.value = "";
    // At least 2 photos required to log a visit (only on the first upload).
    if (visit.photos.length === 0 && lista.length < 2) {
      setError("min");
      return;
    }
    // Los vídeos, de 30 segundos como mucho (migración 047).
    for (const f of lista) {
      if (f.type.startsWith("video/") && (await duracion(f)) > VIDEO_MAX_S + 0.5) {
        setError("largo");
        return;
      }
    }
    setBusy(true);
    setError(false);
    try {
      const pedir = await fetch("/api/reservations/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: visit.id,
          subir: lista.map((f) => ({ type: f.type || "image/jpeg", size: f.size })),
        }),
      });
      const d = await pedir.json().catch(() => ({}));
      if (!pedir.ok) {
        setError(d.error === "size" ? "peso" : pedir.status === 409 ? "pronto" : "fallo");
        return;
      }
      const almacen = createClient().storage.from("content-proofs");
      const subidas: string[] = [];
      for (let i = 0; i < lista.length; i++) {
        const { path, token } = d.permisos[i] as { path: string; token: string };
        const { error: e } = await almacen.uploadToSignedUrl(path, token, lista[i], {
          contentType: lista[i].type || "image/jpeg",
        });
        if (!e) subidas.push(path);
      }
      if (subidas.length === 0 || (visit.photos.length === 0 && subidas.length < 2)) {
        setError("fallo");
        return;
      }
      const fin = await fetch("/api/reservations/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: visit.id, paths: subidas }),
      });
      if (fin.ok) onChanged();
      else setError("fallo");
    } catch {
      setError("fallo");
    } finally {
      setBusy(false);
    }
  }

  // El input vive en el documento y se esconde con tamaño y opacidad, nunca con
  // `display:none`: dentro del WebView de iOS, lo que no se pinta tampoco abre
  // el selector, y el botón parece muerto sin dar ningún error.
  const fileInput = (
    <input
      ref={fileRef}
      id={`fotos-${visit.id}`}
      type="file"
      accept="image/*,video/*"
      multiple
      className="absolute h-px w-px overflow-hidden opacity-0"
      style={{ clip: "rect(0 0 0 0)" }}
      onChange={(e) => upload(e.target.files)}
    />
  );

  // ── Visited: feed-style large photos, place + date below ──────────────────
  if (visit.photos.length > 0) {
    return (
      // Cada visita en su burbuja de cristal, como los demás bloques.
      <div className="caja-cristal p-5">
        {/* La casa y la fecha arriba, antes de las fotos. */}
        <div className="mb-fila">
          <Row
            name
            label={<span className="text-sous-titre text-text-primary">{visit.maison}</span>}
            value={<span className="text-legende tabular-nums text-brume">{dateLabel}</span>}
          />
          {/* Lo que gastó en esta casa. */}
          {visit.cost ? (
            <p className="mt-bloque text-sous-titre tabular-nums text-accent">{VISITA[lang].cost(visit.cost)}</p>
          ) : null}
          {rightsLabel && (
            <p className="mt-etiqueta text-legende text-text-muted">
              {t.rightsUntil.replace("{date}", rightsLabel)}
            </p>
          )}
        </div>

        {/* Cada story con sus cifras debajo: son dos stories (o más), y cada
            una tiene su portée en Instagram. */}
        <div className="grid grid-cols-2 gap-x-fila gap-y-rango">
          {(visit.media ?? visit.photos.map((url) => ({ url, path: url }))).map((m, i) => (
            <div key={m.path}>
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-[10px] bg-surface-raised">
                <Medio url={m.url} className="hover:scale-105 transition-transform duration-500" />
              </a>
              <p className="mt-bloque text-capitale uppercase tracking-capitale text-accent">
                {PORTEE[lang].story(i + 1)}
              </p>
              {(["views", "accounts", "interactions"] as const).map((campo) => (
                <label key={campo} className="mt-bloque block">
                  <span className="block text-capitale uppercase tracking-capitale text-text-secondary">
                    {campo === "views" ? t.reachViews : campo === "accounts" ? t.reachAccounts : t.reachInteractions}
                  </span>
                  <input
                    inputMode="numeric"
                    value={cifrasDe(m.path)[campo]}
                    onChange={(e) =>
                      setCifras((x) => ({ ...x, [m.path]: { ...cifrasDe(m.path), [campo]: e.target.value.replace(/\D/g, "") } }))
                    }
                    className="w-full min-w-0 border-0 border-b border-border bg-transparent py-etiqueta text-sous-titre tabular-nums text-text-primary transition-colors duration-200 ease-curato outline-none focus:border-accent"
                  />
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Hasta tener todas las cifras, la visita no queda validada y no se
            puede pedir otra (src/lib/validacion.ts). */}
        <div className="mt-fila">
          <p className={`text-legende ${visit.pending ? "text-copper-vif" : "text-sauge-vif"}`}>
            {visit.pending ? PORTEE[lang].pending : PORTEE[lang].done}
          </p>
          <div className="mt-fila">
            <Button onClick={guardarPortee} disabled={guardando || !completas}>
              {guardando ? t.sending : t.reachSave}
            </Button>
          </div>
          {guardado && !visit.pending && <p className="mt-bloque text-legende text-sauge-vif">{PORTEE[lang].saved}</p>}
        </div>

        <div className="mt-fila">
          {canUpload && (
            <div className="mt-fila">
              {fileInput}
              <label
                htmlFor={`fotos-${visit.id}`}
                className={`inline-flex min-h-11 items-center text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-accent ${busy ? "pointer-events-none opacity-45" : "cursor-pointer"}`}
              >
                {busy ? t.sending : t.addMore}
              </label>
              {error && <p className="text-legende text-copper-vif">{error === "min" ? t.minPhotos : ERROR_SUBIDA[lang][error]}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Not yet uploaded: prompt to mark visited + upload ─────────────────────
  const tv = VISITA[lang] ?? VISITA.fr;
  return (
    <div className="caja-cristal p-5">
      {/* La casa, con la misma tarjeta que en Adresses. */}
      {visit.casa && (
        <div className="mb-fila">
          <TarjetaCasa casa={visit.casa} lang={lang} href={`/dashboard/storyteller/maison/${visit.casa.id}`} />
        </div>
      )}
      {/* La fecha y el estado, cada uno con su sitio. Antes era una fila que se
          deslizaba: el cuadro oscuro de la acción asomaba y el texto se cortaba. */}
      {visit.casa ? (
        <p className="text-corps tabular-nums text-text-primary first-letter:uppercase">{dateLabel}</p>
      ) : (
        <p className="text-sous-titre text-text-primary">{visit.maison}</p>
      )}
      <p className={`mt-etiqueta text-capitale uppercase tracking-capitale ${STATUS_TONE[statusKey]}`}>
        {visit.casa ? t[statusKey] : `${dateLabel} · ${t[statusKey]}`}
      </p>
      {canUpload && visit.photos.length === 0 && horasRestantes(visit.slotStart) !== null && (
        <p className="mt-bloque text-legende tabular-nums text-copper-vif">
          {t.reachCountdown.replace("{h}", String(horasRestantes(visit.slotStart)))}
        </p>
      )}

      {/* Lo que la visita gasta del crédito, bien visible. */}
      {visit.cost ? (
        <p
          className={`mt-fila tabular-nums ${visit.lateCancel ? "text-legende text-rouge-vif" : "text-sous-titre text-accent"}`}
        >
          {visit.lateCancel ? tv.lost : tv.cost(visit.cost)}
        </p>
      ) : null}

      {/* Confirmar (verde) o anular (rojo). Los dos llevan a la página que
          enseña las reglas del crédito antes de decidir. */}
      {(visit.mustConfirm || visit.canCancel) && (
        <div className="mt-fila flex flex-wrap gap-fila">
          {visit.mustConfirm && (
            <ButtonLink href={`/dashboard/storyteller/visits/${visit.id}/confirmer`} className="text-sauge-vif">
              {tv.confirm}
            </ButtonLink>
          )}
          {visit.canCancel && (
            <ButtonLink href={`/dashboard/storyteller/visits/${visit.id}/confirmer?annuler=1`} className="text-rouge-vif">
              {tv.cancel}
            </ButtonLink>
          )}
        </div>
      )}

      {visit.calendar && (
        <div className="mt-bloque">
          <p className="text-legende tabular-nums text-text-secondary">
            {new Date(visit.slotStart).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
            {" · "}
            {CALENDARIO[lang].party(visit.partySize ?? 1)}
          </p>
          <p className="mt-fila text-capitale uppercase tracking-capitale text-text-secondary">{CALENDARIO[lang].add}</p>
          <div className="flex gap-rango">
            {[
              { href: visit.calendar.google, label: CALENDARIO[lang].google },
              { href: visit.calendar.ics, label: CALENDARIO[lang].apple },
            ].map((enlace) => (
              <a
                key={enlace.label}
                href={enlace.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-legende text-accent underline underline-offset-4 transition-colors hover:text-text-primary"
              >
                {enlace.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* El día de la visita, lo primero es el código: se enseña al llegar. */}
      {visit.status === "confirmed" && visit.today && (
        <div className="mt-fila">
          {visit.visitedAt ? (
            <p className="text-capitale uppercase tracking-capitale text-sauge-vif">{CODIGO[lang].done}</p>
          ) : (
            <ButtonLink href={`/dashboard/storyteller/visits/${visit.id}/code`}>{CODIGO[lang].show}</ButtonLink>
          )}
        </div>
      )}

      {canUpload && (
        <div className="mt-fila">
          {fileInput}
          <LabelButton htmlFor={`fotos-${visit.id}`} disabled={busy}>
            {busy ? t.sending : t.markVisited}
          </LabelButton>
          <p className="mt-bloque text-legende text-text-secondary">{t.minPhotos}</p>
          {error && <p className="mt-bloque text-legende text-copper-vif">{error === "min" ? t.minPhotos : ERROR_SUBIDA[lang][error]}</p>}
        </div>
      )}
    </div>
  );
}

export default function MesVisites() {
  const { lang } = useLang();
  const t = translations[lang].visits;
  const td = translations[lang].dashboard;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [credito, setCredito] = useState<Credito | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/reservations/visit");
      const data = await res.json();
      setVisits(data.visits ?? []);
      setCredito(data.credito ?? null);
    } catch {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);


  return (
    <div className="min-h-[100dvh]">
      {/* Nav */}
      <DashboardNav
        links={STORYTELLER_LINKS(td, "visits")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={td.navSettings}
      />

      <PullToRefresh onRefresh={load}>
      <div className="mx-auto max-w-[920px] px-pagina py-seccion">
        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
          <h1 className="mt-bloque mb-seccion text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
            {t.title}
          </h1>
        </Rise>

        {/* Cuánto crédito le queda este mes, antes de las visitas. */}
        {credito && credito.mensual > 0 && (
          <Section title={(VISITA[lang] ?? VISITA.fr).credit}>
            <p className="text-sous-titre tabular-nums text-accent">
              {(VISITA[lang] ?? VISITA.fr).left(credito.restante, credito.mensual)}
            </p>
            <div className="mt-fila h-px bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-700 ease-curato"
                style={{ width: `${Math.min((credito.usado / credito.mensual) * 100, 100)}%` }}
              />
            </div>
          </Section>
        )}

        {loading ? (
          <div className="space-y-fila">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-border animate-pulse [animation-duration:1.6s]" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="py-respiro text-center">
            <p className="text-corps text-text-secondary">{t.empty}</p>
          </div>
        ) : (
          <>
            {([
              ["todo", t.groupTodo],
              ["upcoming", t.groupUpcoming],
              ["past", t.groupPast],
            ] as const).map(([grupo, titulo]) => {
              const delGrupo = visits.filter((v) => groupOf(v) === grupo);
              if (delGrupo.length === 0) return null;
              return (
                <Section key={grupo} title={titulo}>
                  <div className="space-y-seccion">
                    {delGrupo.map((v, i) => (
                      <Rise key={v.id} index={i}>
                        <VisitCard visit={v} t={t} lang={lang} onChanged={load} />
                      </Rise>
                    ))}
                  </div>
                </Section>
              );
            })}
          </>
        )}
      </div>
      </PullToRefresh>
    </div>
  );
}
