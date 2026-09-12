"use client";

import { useState, useEffect, useRef } from "react";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Button, LabelButton } from "@/components/member/button";
import { PullToRefresh } from "@/components/member/pull-to-refresh";
import { SwipeAction } from "@/components/member/swipe-action";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

type Reach = { views: number | null; accounts: number | null; interactions: number | null };

type Visit = {
  id: string;
  maison: string;
  slotStart: string;
  status: string;
  photos: string[];
  rightsExpiresAt: string | null;
  reach: Reach | null;
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
  if (v.photos.length > 0) return "past";
  if (v.status === "declined" || v.status === "cancelled" || v.status === "no_show") return "past";
  const yaPasó = new Date(v.slotStart).getTime() < Date.now();
  if (!yaPasó) return "upcoming";
  return v.status === "confirmed" || v.status === "completed" ? "todo" : "upcoming";
}

function Envoltura({
  deslizable,
  action,
  onAction,
  children,
}: {
  deslizable: boolean;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  if (!deslizable) return <>{children}</>;
  return (
    <SwipeAction action={action} onAction={onAction}>
      {children}
    </SwipeAction>
  );
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
  const [error, setError] = useState("");
  const [vues, setVues] = useState("");
  const [comptes, setComptes] = useState("");
  const [interactions, setInteractions] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Las cifras se envían solas, sin fotos: quien ya subió las capturas puede
  // volver un día después a poner la portée, que es cuando Instagram la tiene.
  async function guardarPortee() {
    setGuardando(true);
    const form = new FormData();
    form.append("reservationId", visit.id);
    if (vues) form.append("reachViews", vues);
    if (comptes) form.append("reachAccounts", comptes);
    if (interactions) form.append("reachInteractions", interactions);
    try {
      const res = await fetch("/api/reservations/visit", { method: "POST", body: form });
      if (res.ok) onChanged();
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

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    // At least 2 photos required to log a visit (only on the first upload).
    if (visit.photos.length === 0 && files.length < 2) {
      setError(t.minPhotos);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("reservationId", visit.id);
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/reservations/visit", { method: "POST", body: form });
      if (res.ok) onChanged();
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
      accept="image/*"
      multiple
      className="absolute h-px w-px overflow-hidden opacity-0"
      style={{ clip: "rect(0 0 0 0)" }}
      onChange={(e) => upload(e.target.files)}
    />
  );

  // ── Visited: feed-style large photos, place + date below ──────────────────
  if (visit.photos.length > 0) {
    return (
      <div>
        {/* Large photos, side by side */}
        <div className="grid grid-cols-2 gap-1.5">
          {visit.photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-surface-raised">
              <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </a>
          ))}
        </div>

        {/* Caption: place + date */}
        <div className="mt-fila">
          <Row
            name
            label={<span className="text-sous-titre text-text-primary">{visit.maison}</span>}
            value={<span className="text-legende tabular-nums text-brume">{dateLabel}</span>}
          />
          {rightsLabel && (
            <p className="mt-etiqueta text-legende text-text-muted">
              {t.rightsUntil.replace("{date}", rightsLabel)}
            </p>
          )}
          {canUpload && (
            <div className="mt-fila">
              {fileInput}
              <label
                htmlFor={`fotos-${visit.id}`}
                className={`inline-flex min-h-11 items-center text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-accent ${busy ? "pointer-events-none opacity-45" : "cursor-pointer"}`}
              >
                {busy ? t.sending : t.addMore}
              </label>
              {error && <p className="text-legende text-copper-vif">{error}</p>}
            </div>
          )}

          {/* La portée. Es el dato del que vive el informe de la maison, y
              hasta ahora no se guardaba en ninguna parte. */}
          {visit.reach ? (
            <div className="mt-rango">
              <p className="mb-bloque text-capitale uppercase tracking-capitale text-sauge-vif">
                {t.reachDeclared}
              </p>
              <Row
                label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.reachAccounts}</span>}
                value={<span className="text-sous-titre tabular-nums text-text-primary">{visit.reach.accounts ?? "—"}</span>}
              />
              <Row
                label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.reachViews}</span>}
                value={<span className="text-sous-titre tabular-nums text-text-primary">{visit.reach.views ?? "—"}</span>}
              />
            </div>
          ) : (
            <div className="mt-rango">
              <p className="text-capitale uppercase tracking-capitale text-accent">{t.reachTitle}</p>
              <p className="mt-bloque mb-fila max-w-[46ch] text-legende text-text-secondary">{t.reachHint}</p>
              <div className="grid grid-cols-3 gap-fila">
                {[
                  { etiqueta: t.reachViews, valor: vues, set: setVues },
                  { etiqueta: t.reachAccounts, valor: comptes, set: setComptes },
                  { etiqueta: t.reachInteractions, valor: interactions, set: setInteractions },
                ].map((campo) => (
                  <div key={campo.etiqueta}>
                    <label className="mb-bloque block text-capitale uppercase tracking-capitale text-text-secondary">
                      {campo.etiqueta}
                    </label>
                    <input
                      inputMode="numeric"
                      value={campo.valor}
                      onChange={(e) => campo.set(e.target.value.replace(/\D/g, ""))}
                      className="w-full min-w-0 border-0 border-b border-transparent bg-transparent py-bloque text-champ tabular-nums text-text-primary transition-colors duration-200 ease-curato outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-fila">
                <Button onClick={guardarPortee} disabled={guardando || !comptes}>
                  {guardando ? t.sending : t.reachSave}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Not yet uploaded: prompt to mark visited + upload ─────────────────────
  return (
    <div>
      {/* Solo se desliza lo que tiene algo que hacer. Un gesto que revela un
          botón vacío enseña a desconfiar del gesto. */}
      <Envoltura
        deslizable={canUpload}
        action={t.swipeDeclare}
        onAction={() => fileRef.current?.click()}
      >
        <Row
          name
          label={<span className="text-sous-titre text-text-primary">{visit.maison}</span>}
          aside={
            <span className="text-legende tabular-nums text-brume">
              {dateLabel}
              {canUpload && visit.photos.length === 0 && horasRestantes(visit.slotStart) !== null && (
                <span className="ml-fila text-copper-vif">
                  {t.reachCountdown.replace("{h}", String(horasRestantes(visit.slotStart)))}
                </span>
              )}
            </span>
          }
          value={
            <span className={`text-capitale uppercase tracking-capitale ${STATUS_TONE[statusKey]}`}>
              {t[statusKey]}
            </span>
          }
        />
      </Envoltura>

      {canUpload && (
        <div className="mt-fila">
          {fileInput}
          <LabelButton htmlFor={`fotos-${visit.id}`} disabled={busy}>
            {busy ? t.sending : t.markVisited}
          </LabelButton>
          <p className="mt-bloque text-legende text-text-secondary">{t.minPhotos}</p>
          {error && <p className="mt-bloque text-legende text-copper-vif">{error}</p>}
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
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/reservations/visit");
      const data = await res.json();
      setVisits(data.visits ?? []);
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
        {/* En claro cada bloque va sobre vidrio, y el titular toma copper:
            en Mes visites hay algo con plazo. */}
        <Rise className="claro:vidrio claro:mb-seccion claro:p-[26px]">
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
          <h1 className="mt-bloque mb-seccion text-titre uppercase tracking-titre text-text-primary md:text-[32px] claro:mb-0 claro:text-copper-vif">
            {t.title}
          </h1>
        </Rise>

        {loading ? (
          <div className="space-y-fila">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-border animate-pulse [animation-duration:1.6s]" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="py-respiro text-center claro:vidrio claro:px-[26px]">
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
                <Section key={grupo} title={titulo} className="claro:vidrio claro:p-[26px]">
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
