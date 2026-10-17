"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";
import { Rise } from "@/components/member/motion";
import { Section } from "@/components/member/section";
import { PullToRefresh } from "@/components/member/pull-to-refresh";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, type Lang } from "@/lib/i18n/translations";
import { CALENDARIO, STATUS_KEY, STATUS_TONE, VISITA, groupOf, type Credito, type Visit } from "./visita";

// Lo que toca hacer con cada visita, en una línea bajo su estado.
const PENDIENTE: Record<Lang, { fotos: string; cifras: string; confirmar: string }> = {
  fr: { fotos: "Ajoutez vos photos", cifras: "Ajoutez les chiffres de vos stories", confirmar: "Confirmez votre venue" },
  en: { fotos: "Add your photos", cifras: "Add your stories' figures", confirmar: "Confirm you're coming" },
  es: { fotos: "Añade tus fotos", cifras: "Añade las cifras de tus stories", confirmar: "Confirma que vas" },
};

/**
 * Una visita en la lista: la casa, cuándo, en qué punto está y qué falta. Se
 * toca para abrirla entera, como una casa en Adresses (Natalia, 2026-10-17:
 * antes cada visita era una burbuja con todo dentro).
 */
function ResumenVisita({ visit, t, lang }: { visit: Visit; t: Record<string, string>; lang: Lang }) {
  const statusKey = STATUS_KEY[visit.status] ?? "pending";
  const foto = visit.photos[0] ?? visit.casa?.photos?.[0] ?? null;
  const cuando = new Date(visit.slotStart);
  const fecha = cuando.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const hora = cuando.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const p = PENDIENTE[lang] ?? PENDIENTE.fr;
  const falta = visit.mustConfirm
    ? p.confirmar
    : visit.photos.length === 0 && groupOf(visit) === "todo"
      ? p.fotos
      : visit.photos.length > 0 && visit.pending
        ? p.cifras
        : null;

  return (
    <Link
      href={`/dashboard/storyteller/visits/${visit.id}`}
      className="caja-cristal flex items-center gap-fila p-bloque transition-colors hover:border-accent"
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="h-20 w-20 shrink-0 rounded-[12px] object-cover" />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-[12px] bg-surface-raised" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-titulo text-[21px] leading-tight text-text-primary">{visit.maison}</p>
        <p className="mt-etiqueta truncate text-legende tabular-nums text-text-secondary first-letter:uppercase">
          {fecha} · {hora} · {CALENDARIO[lang].party(visit.partySize ?? 1)}
        </p>
        <p className={`mt-etiqueta text-capitale uppercase tracking-capitale ${STATUS_TONE[statusKey]}`}>{t[statusKey]}</p>
        {falta && <p className="mt-etiqueta text-legende text-copper-vif">{falta}</p>}
      </div>
      <CaretRight size={16} className="shrink-0 text-text-muted" aria-hidden />
    </Link>
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

        {/* Solo lo que le queda este mes: es lo que decide la próxima visita. */}
        {credito && credito.mensual > 0 && (
          <Section title={(VISITA[lang] ?? VISITA.fr).credit}>
            <p className="text-[34px] font-light leading-none tabular-nums text-accent">
              {(VISITA[lang] ?? VISITA.fr).left(credito.restante)}
            </p>
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
                  <div className="space-y-fila">
                    {delGrupo.map((v, i) => (
                      <Rise key={v.id} index={i}>
                        <ResumenVisita visit={v} t={t} lang={lang} />
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
