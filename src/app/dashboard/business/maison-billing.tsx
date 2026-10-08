"use client";

import { useEffect, useState } from "react";
import { Row } from "@/components/member/row";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

type Billing = { name: string; signedAt: string | null; plan: string; monthly: number; trialDays: number };

// Fechas e importes con las convenciones de cada idioma, no siempre las francesas.
const LOCALE: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", es: "es-ES" };

const T: Record<Lang, {
  loading: string;
  unavailable: string;
  trial: (dias: number) => string;
  active: string;
  pending: string;
  plan: string;
  planValue: (importe: string) => string;
  start: string;
  trialEnd: string;
  firstPayment: string;
  nextPayment: string;
  payment: string;
  paymentValue: string;
  heading: string;
  note: string;
}> = {
  fr: {
    loading: "Chargement…",
    unavailable: "Informations de facturation indisponibles.",
    trial: (n) => `Essai gratuit · ${n} jour${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}`,
    active: "Abonnement actif",
    pending: "En attente de signature",
    plan: "Formule",
    planValue: (x) => `Abonnement mensuel · ${x}/mois`,
    start: "Début",
    trialEnd: "Fin de l'essai",
    firstPayment: "Premier paiement",
    nextPayment: "Prochain paiement",
    payment: "Paiement",
    paymentValue: "Géré par Curato (virement)",
    heading: "Facturation & abonnement",
    note: "Les 15 premiers jours vous sont offerts. La facturation est gérée par Curato : vous serez contacté·e pour la mise en place du paiement. Pour toute question, écrivez à hello@curatocollective.com.",
  },
  en: {
    loading: "Loading…",
    unavailable: "Billing information unavailable.",
    trial: (n) => `Free trial · ${n} day${n > 1 ? "s" : ""} left`,
    active: "Active subscription",
    pending: "Awaiting signature",
    plan: "Plan",
    planValue: (x) => `Monthly subscription · ${x}/month`,
    start: "Start",
    trialEnd: "Trial ends",
    firstPayment: "First payment",
    nextPayment: "Next payment",
    payment: "Payment",
    paymentValue: "Handled by Curato (bank transfer)",
    heading: "Billing & subscription",
    note: "The first 15 days are on us. Billing is handled by Curato: we will contact you to set up payment. For any question, write to hello@curatocollective.com.",
  },
  es: {
    loading: "Cargando…",
    unavailable: "La información de facturación no está disponible.",
    trial: (n) => `Prueba gratuita · ${n > 1 ? "quedan" : "queda"} ${n} día${n > 1 ? "s" : ""}`,
    active: "Suscripción activa",
    pending: "Pendiente de firma",
    plan: "Plan",
    planValue: (x) => `Suscripción mensual · ${x}/mes`,
    start: "Inicio",
    trialEnd: "Fin de la prueba",
    firstPayment: "Primer pago",
    nextPayment: "Próximo pago",
    payment: "Pago",
    paymentValue: "Lo gestiona Curato (transferencia)",
    heading: "Facturación y suscripción",
    note: "Los 15 primeros días corren de nuestra cuenta. La facturación la gestiona Curato: te contactaremos para organizar el pago. Para cualquier duda, escribe a hello@curatocollective.com.",
  },
};

export default function MaisonBilling() {
  const { lang } = useLang();
  const t = T[lang];
  const locale = LOCALE[lang];
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const eur = (n: number) =>
    n.toLocaleString(locale, { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

  const [b, setB] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maison/billing", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setB(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-serif text-[13px] text-text-secondary">{t.loading}</p>;
  if (!b) return <p className="font-serif text-[13px] text-text-secondary">{t.unavailable}</p>;

  const signed = b.signedAt ? new Date(b.signedAt) : null;
  const now = new Date();

  let trialEnd: Date | null = null;
  let inTrial = false;
  let daysLeft = 0;
  let nextPayment: Date | null = null;

  if (signed) {
    trialEnd = new Date(signed);
    trialEnd.setDate(trialEnd.getDate() + b.trialDays);
    inTrial = now < trialEnd;
    daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    // Billing is anchored at the trial end (first paid date), then monthly.
    nextPayment = new Date(trialEnd);
    while (nextPayment <= now) nextPayment.setMonth(nextPayment.getMonth() + 1);
  }

  // El estado sube al titular, así que sale de la lista.
  const status = signed ? (inTrial ? t.trial(daysLeft) : t.active) : t.pending;

  const rows: { label: string; value: string }[] = [
    { label: t.plan, value: t.planValue(eur(b.monthly)) },
    ...(signed ? [{ label: t.start, value: fmtDate(signed) }] : []),
    ...(inTrial && trialEnd ? [{ label: t.trialEnd, value: fmtDate(trialEnd) }] : []),
    ...(nextPayment ? [{ label: inTrial ? t.firstPayment : t.nextPayment, value: fmtDate(nextPayment) }] : []),
    { label: t.payment, value: t.paymentValue },
  ];

  return (
    <div>
      <p className="text-capitale uppercase tracking-capitale text-accent">{t.heading}</p>

      {/* El estado estaba escondido en una fila dentro de un recuadro. Es lo
          primero que una casa quiere saber, así que es el titular. */}
      <p className="mt-bloque mb-seccion text-titre uppercase tracking-titre text-accent md:text-[32px]">
        {status}
      </p>

      <div>
        {rows.map((r) => (
          <Row
            key={r.label}
            label={
              <span className="text-capitale uppercase tracking-capitale text-text-secondary">{r.label}</span>
            }
            value={
              // Una fecha no se trunca jamás: envuelve si hace falta.
              <span className="block max-w-[62vw] text-right text-corps text-text-primary sm:max-w-none">
                {r.value}
              </span>
            }
          />
        ))}
      </div>

      <p className="mt-seccion max-w-[46ch] text-legende text-text-secondary">
        {t.note}
      </p>
    </div>
  );
}
