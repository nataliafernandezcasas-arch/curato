"use client";

import { useEffect, useState } from "react";
import { Row } from "@/components/member/row";

type Billing = { name: string; signedAt: string | null; plan: string; monthly: number; trialDays: number };

const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const eur = (n: number) => n.toLocaleString("fr-FR") + " €";

export default function MaisonBilling() {
  const [b, setB] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maison/billing", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setB(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-serif text-[13px] text-white/40">Chargement…</p>;
  if (!b) return <p className="font-serif text-[13px] text-white/40">Informations de facturation indisponibles.</p>;

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
  const status = signed
    ? inTrial
      ? `Essai gratuit · ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`
      : "Abonnement actif"
    : "En attente de signature";

  const rows: { label: string; value: string }[] = [
    { label: "Formule", value: `Abonnement mensuel · ${eur(b.monthly)}/mois` },
    ...(signed ? [{ label: "Début", value: fmtDate(signed) }] : []),
    ...(inTrial && trialEnd ? [{ label: "Fin de l'essai", value: fmtDate(trialEnd) }] : []),
    ...(nextPayment ? [{ label: inTrial ? "Premier paiement" : "Prochain paiement", value: fmtDate(nextPayment) }] : []),
    { label: "Paiement", value: "Géré par Curato (virement)" },
  ];

  return (
    <div>
      <p className="text-capitale uppercase tracking-capitale text-accent">Facturation &amp; abonnement</p>

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
        Les 15 premiers jours vous sont offerts. La facturation est gérée par Curato : vous serez contacté·e pour la mise en place du paiement. Pour toute question, écrivez à hello@curatocollective.com.
      </p>
    </div>
  );
}
