"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { Rise } from "@/components/member/motion";
import { Button } from "@/components/member/button";

type Demanda = {
  id: string;
  name: string;
  handle: string | null;
  followers: number | null;
  slotStart: string;
  partySize: number;
  nights: number | null;
  note: string | null;
};

const TEXTOS = {
  fr: {
    title: "Demandes de visite",
    empty: "Aucune demande en attente.",
    people: "personnes",
    nights: "nuits",
    accept: "Accepter",
    decline: "Refuser",
    working: "Un instant…",
    // La consecuencia se lee antes de pulsar, no en un diálogo después.
    consequence:
      "Un refus compte comme une visite offerte : {done} sur {min} ce mois-ci.",
    consequenceLast:
      "Attention : un refus compte comme une visite offerte, et il ne vous en reste qu'une avant d'atteindre les {min} garanties.",
    error: "Cette demande a déjà été traitée. Rechargez la page.",
  },
  en: {
    title: "Visit requests",
    empty: "No pending requests.",
    people: "people",
    nights: "nights",
    accept: "Accept",
    decline: "Decline",
    working: "One moment…",
    consequence: "A decline counts as a visit offered: {done} of {min} this month.",
    consequenceLast:
      "Careful: a decline counts as a visit offered, and you have only one left before reaching the {min} guaranteed.",
    error: "This request has already been handled. Reload the page.",
  },
  es: {
    title: "Solicitudes de visita",
    empty: "Ninguna solicitud pendiente.",
    people: "personas",
    nights: "noches",
    accept: "Aceptar",
    decline: "Rechazar",
    working: "Un momento…",
    consequence: "Un rechazo cuenta como visita ofrecida: {done} de {min} este mes.",
    consequenceLast:
      "Ojo: un rechazo cuenta como visita ofrecida, y solo te queda una para llegar a las {min} garantizadas.",
    error: "Esta solicitud ya fue resuelta. Vuelve a cargar la página.",
  },
};

/**
 * Las demandas de visita, decididas por la casa.
 *
 * Hasta ahora esto solo lo podía hacer Curato, así que una maison tenía que
 * escribir un correo para confirmar a alguien que ya le había pedido mesa. Con
 * cinco visitas garantizadas al mes, ese ida y vuelta se come el plazo.
 *
 * Rechazar tiene consecuencia contractual: cuenta como visita ofrecida dentro
 * del mínimo del mes. Eso se lee **encima de los dos botones y antes de
 * pulsar**, con el recuento real del mes, no en un diálogo de confirmación
 * después, que es donde nadie lee. Y no hay diálogo: quien pulsa, decide.
 */
export default function MaisonDemandes() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [mes, setMes] = useState({ visits: 0, guaranteed: 5 });
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    fetch("/api/maison/reservations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setDemandas(d.requests ?? []);
        setMes({ visits: d.monthVisits ?? 0, guaranteed: d.guaranteed ?? 5 });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  async function decidir(id: string, action: "confirm" | "decline") {
    setTrabajando(id);
    setError("");
    try {
      const res = await fetch("/api/maison/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        setError(t.error);
        return;
      }
      // Fuera de la lista, y el recuento del mes cambia si aceptó.
      setDemandas((prev) => prev.filter((d) => d.id !== id));
      cargar();
    } catch {
      setError(t.error);
    } finally {
      setTrabajando(null);
    }
  }

  // Sin demandas no se pinta nada: una sección vacía encima del carnet solo
  // ocupa el sitio de lo que la casa venía a ver.
  if (cargando || demandas.length === 0) return null;

  const faltan = Math.max(0, mes.guaranteed - mes.visits);
  const aviso =
    faltan === 1
      ? t.consequenceLast.replace("{min}", String(mes.guaranteed))
      : t.consequence
          .replace("{done}", String(mes.visits))
          .replace("{min}", String(mes.guaranteed));

  const fecha = (iso: string) =>
    new Date(iso).toLocaleString(lang, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });

  return (
    <Section title={t.title}>
      <div className="space-y-seccion">
        {demandas.map((d, i) => (
          <Rise key={d.id} index={i}>
            <Row
              name
              label={<span className="text-sous-titre text-text-primary">{d.name}</span>}
              aside={
                <span className="text-legende text-brume">
                  {d.handle ? `@${d.handle} · ` : ""}
                  {d.nights ? `${d.nights} ${t.nights}` : `${d.partySize} ${t.people}`}
                </span>
              }
              value={
                <span className="text-legende tabular-nums text-text-primary">{fecha(d.slotStart)}</span>
              }
            />

            {d.note && <p className="mt-bloque text-legende text-text-secondary">{d.note}</p>}

            {/* La consecuencia, encima de los botones y con la cifra real. */}
            <p className={`mt-fila text-legende ${faltan === 1 ? "text-copper-vif" : "text-text-secondary"}`}>
              {aviso}
            </p>

            <div className="mt-fila flex flex-wrap items-center gap-fila">
              <Button onClick={() => decidir(d.id, "confirm")} disabled={trabajando === d.id}>
                {trabajando === d.id ? t.working : t.accept}
              </Button>
              <button
                onClick={() => decidir(d.id, "decline")}
                disabled={trabajando === d.id}
                className="min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors duration-200 ease-curato hover:text-copper-vif disabled:pointer-events-none disabled:opacity-45"
              >
                {t.decline}
              </button>
            </div>
          </Rise>
        ))}
      </div>

      {error && (
        <p className="mt-fila border-l-2 border-burgundy-vif pl-fila text-legende text-text-primary">{error}</p>
      )}
    </Section>
  );
}
