"use client";

import { useEffect, useState } from "react";

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

  const rows: { label: string; value: string }[] = [
    { label: "Formule", value: `Abonnement mensuel · ${eur(b.monthly)}/mois` },
    { label: "Statut", value: signed ? (inTrial ? `Essai gratuit · ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}` : "Abonnement actif") : "En attente de signature" },
    ...(signed ? [{ label: "Début", value: fmtDate(signed) }] : []),
    ...(inTrial && trialEnd ? [{ label: "Fin de l'essai", value: fmtDate(trialEnd) }] : []),
    ...(nextPayment ? [{ label: inTrial ? "Premier paiement" : "Prochain paiement", value: fmtDate(nextPayment) }] : []),
    { label: "Paiement", value: "Géré par Curato (virement)" },
  ];

  return (
    <div>
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-8">Facturation & abonnement</p>

      <div className="border border-white/12 bg-black/20">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between gap-4 px-6 py-4 ${i > 0 ? "border-t border-white/8" : ""}`}>
            <span className="font-serif text-[11px] tracking-[0.2em] uppercase text-white/40">{r.label}</span>
            <span className={`font-serif text-[15px] font-light text-right ${r.label === "Statut" ? "text-champagne" : "text-white/85"}`}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <p className="font-serif text-[12px] font-light text-white/40 leading-relaxed mt-5">
        Les 15 premiers jours vous sont offerts. La facturation est gérée par Curato : vous serez contacté·e pour la mise en place du paiement. Pour toute question, écrivez à hello@curatocollective.com.
      </p>
    </div>
  );
}
