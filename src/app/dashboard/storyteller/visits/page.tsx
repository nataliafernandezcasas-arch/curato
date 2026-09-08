"use client";

import { useState, useEffect, useRef } from "react";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Button } from "@/components/member/button";
import { PullToRefresh } from "@/components/member/pull-to-refresh";
import { SwipeAction } from "@/components/member/swipe-action";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, Lang } from "@/lib/i18n/translations";

type Visit = {
  id: string;
  maison: string;
  slotStart: string;
  status: string;
  photos: string[];
  rightsExpiresAt: string | null;
};

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
  confirmed: "text-sauge-text",
  visited: "text-sauge-text",
  pending: "text-copper",
  declined: "text-burgundy",
  noShow: "text-burgundy",
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
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-charcoal-mid">
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
              {error && <p className="text-legende text-copper">{error}</p>}
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
          aside={<span className="text-legende tabular-nums text-brume">{dateLabel}</span>}
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
          <label
            htmlFor={`fotos-${visit.id}`}
            className={`inline-flex min-h-11 items-center justify-center border border-[rgba(203,183,143,0.3)] px-fila text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:border-accent hover:text-text-primary ${busy ? "pointer-events-none opacity-45" : "cursor-pointer"}`}
          >
            {busy ? t.sending : t.markVisited}
          </label>
          <p className="mt-bloque text-legende text-text-secondary">{t.minPhotos}</p>
          {error && <p className="mt-bloque text-legende text-copper">{error}</p>}
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
        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
          <h1 className="mt-bloque mb-seccion text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
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
