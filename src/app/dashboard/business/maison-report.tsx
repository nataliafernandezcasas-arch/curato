"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Rise, Photo } from "@/components/member/motion";
import { Viewer } from "@/components/member/viewer";

type Informe = {
  month: string;
  visits: number;
  guaranteed: number;
  belowMinimum: boolean;
  reach: { accounts: number; views: number; interactions: number; declared: number };
  storytellers: { name: string; handle: string | null; followers: number | null; date: string; accounts: number | null }[];
  gallery: string[];
};

const TEXTOS = {
  fr: {
    kicker: "Rapport mensuel", visitsOf: "sur {n} garanties", reach: "Comptes atteints",
    views: "Vues", storytellers: "Storytellers reçus", published: "Ce qui a été publié",
    below: "Ce mois-ci est en dessous des {n} visites garanties : le mois suivant vous est offert.",
    pending: "{n} visite(s) n'ont pas encore déclaré leur portée.", empty: "Aucune visite ce mois-ci.",
    previous: "Mois précédent",
  },
  en: {
    kicker: "Monthly report", visitsOf: "of {n} guaranteed", reach: "Accounts reached",
    views: "Views", storytellers: "Storytellers received", published: "What was published",
    below: "This month is below the {n} guaranteed visits: the next one is on us.",
    pending: "{n} visit(s) have not declared their reach yet.", empty: "No visits this month.",
    previous: "Previous month",
  },
  es: {
    kicker: "Informe mensual", visitsOf: "de {n} garantizadas", reach: "Cuentas alcanzadas",
    views: "Visualizaciones", storytellers: "Storytellers recibidos", published: "Lo que se publicó",
    below: "Este mes está por debajo de las {n} visitas garantizadas: el siguiente es gratis.",
    pending: "{n} visita(s) todavía no han declarado su alcance.", empty: "Ninguna visita este mes.",
    previous: "Mes anterior",
  },
};

/**
 * El informe mensual de la maison.
 *
 * Es la razón por la que una casa paga 299 € al mes, y no existía. La cifra que
 * lo justifica es las visitas contra el mínimo garantizado, así que es la más
 * grande de la pantalla.
 *
 * Por debajo del mínimo se dice, en copper y sin rodeos, junto con lo que la
 * casa gana por ello: el mes siguiente sale gratis. Esconderlo sería peor, se
 * enteraría igual y con menos confianza.
 */
export default function MaisonReport() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [mes, setMes] = useState<string | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [visor, setVisor] = useState<number | null>(null);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/maison/report${mes ? `?month=${mes}` : ""}`)
      .then((r) => r.json())
      .then((d) => setInforme(d.error ? null : d))
      .catch(() => setInforme(null))
      .finally(() => setCargando(false));
  }, [mes]);

  if (cargando) return <div className="h-64 bg-border animate-pulse [animation-duration:1.6s]" />;
  if (!informe) return null;

  const [anio, num] = informe.month.split("-").map(Number);
  const nombreMes = new Date(anio, num - 1, 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  const anterior = num === 1 ? `${anio - 1}-12` : `${anio}-${String(num - 1).padStart(2, "0")}`;
  const pendientes = informe.visits - informe.reach.declared;

  return (
    <div>
      <Rise>
        <p className="text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>
        <p className="mt-bloque text-legende text-text-secondary">{nombreMes}</p>

        {/* La cifra que justifica la suscripción. */}
        <p className={`mt-fila text-[46px] font-light leading-none tabular-nums ${informe.belowMinimum ? "text-copper-vif" : "text-accent"}`}>
          {informe.visits}
        </p>
        <p className="mt-bloque text-legende text-text-secondary">
          {t.visitsOf.replace("{n}", String(informe.guaranteed))}
        </p>

        {informe.belowMinimum && (
          <p className="mt-fila max-w-[46ch] text-corps text-copper-vif">
            {t.below.replace("{n}", String(informe.guaranteed))}
          </p>
        )}
      </Rise>

      {informe.visits === 0 ? (
        <div className="py-respiro text-center">
          <p className="text-corps text-text-secondary">{t.empty}</p>
        </div>
      ) : (
        <>
          <Rise index={1} className="mt-seccion">
            <Row
              label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.reach}</span>}
              value={<span className="text-sous-titre tabular-nums text-text-primary">{informe.reach.accounts.toLocaleString(lang)}</span>}
            />
            <Row
              label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.views}</span>}
              value={<span className="text-sous-titre tabular-nums text-text-primary">{informe.reach.views.toLocaleString(lang)}</span>}
            />
            {/* Sin esto, un mes con pocas cifras parece un mal mes cuando solo
                faltan datos por declarar. */}
            {pendientes > 0 && (
              <p className="mt-bloque text-legende text-text-muted">
                {t.pending.replace("{n}", String(pendientes))}
              </p>
            )}
          </Rise>

          <Section title={t.storytellers} className="mt-seccion">
            {informe.storytellers.map((s, i) => (
              <Row
                key={i}
                name
                label={<span className="text-corps text-text-primary">{s.name}</span>}
                aside={
                  <span className="text-legende tabular-nums text-brume">
                    {new Date(s.date).toLocaleDateString(lang, { day: "numeric", month: "long" })}
                  </span>
                }
                value={
                  s.accounts != null ? (
                    <span className="text-legende tabular-nums text-text-primary">{s.accounts.toLocaleString(lang)}</span>
                  ) : undefined
                }
              />
            ))}
          </Section>

          {informe.gallery.length > 0 && (
            <Section title={t.published}>
              <div className="grid grid-cols-3 gap-bloque">
                {informe.gallery.map((url, i) => (
                  <button key={i} type="button" onClick={() => setVisor(i)} className="block">
                    <Photo src={url} className="aspect-square" />
                  </button>
                ))}
              </div>
              <Viewer photos={informe.gallery} index={visor} onClose={() => setVisor(null)} />
            </Section>
          )}
        </>
      )}

      <button
        onClick={() => setMes(anterior)}
        className="mt-seccion min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-accent"
      >
        {t.previous}
      </button>
    </div>
  );
}
