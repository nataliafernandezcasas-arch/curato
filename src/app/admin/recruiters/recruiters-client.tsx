"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

type Item = {
  id: string;
  maison_name: string;
  maison_email: string | null;
  notes: string | null;
  status: string;
  recruiter: string;
  recruiter_id: string | null;
  created_at: string;
};
type Recruiter = { id: string; full_name: string | null; email: string; iban: string | null };

const PER_MAISON = 448.5;
const eur = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const BADGE: Record<string, { label: string; dot: string; text: string }> = {
  pending: { label: "En attente", dot: "#C9A34B", text: "text-[#D8BE7E]" },
  approved: { label: "Validée", dot: "#7FA8C9", text: "text-[#9EC1DE]" },
  rejected: { label: "Refusée", dot: "#B5564E", text: "text-[#D08A84]" },
  signed: { label: "Signée", dot: "#6FA372", text: "text-[#9CC79E]" },
};

export default function RecruitersClient({ items, recruiters }: { items: Item[]; recruiters: Recruiter[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = items.filter((i) => i.status === "pending");

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id + action);
    const res = await fetch("/api/admin/recruiter-prospect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  const signedByRecruiter = (rid: string) => items.filter((i) => i.recruiter_id === rid && i.status === "signed").length;

  return (
    <main className="max-w-[900px] mx-auto px-5 py-12">
      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-3">Curato · Admin · Recruiters</p>
      <h1 className="font-serif text-4xl font-light tracking-[0.1em] uppercase text-white mb-10">Recruiters</h1>

      {/* À valider */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] tracking-[0.25em] uppercase text-white/50 mb-5">À valider ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="font-serif text-[13px] font-light text-white/35">Aucun prospect en attente.</p>
        ) : (
          <div className="divide-y divide-white/8 border-y border-white/8">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-serif text-[15px] text-white truncate">{p.maison_name}</p>
                  <p className="font-serif text-[12px] font-light text-white/40 truncate">
                    {p.recruiter}
                    {p.maison_email ? ` · ${p.maison_email}` : ""}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => decide(p.id, "approve")} disabled={!!busy} className="inline-flex items-center gap-1.5 font-serif text-[12px] tracking-wide text-[#9CC79E] hover:text-white transition-colors disabled:opacity-40">
                    <CheckCircle size={16} weight="thin" /> Valider
                  </button>
                  <button onClick={() => decide(p.id, "reject")} disabled={!!busy} className="inline-flex items-center gap-1.5 font-serif text-[12px] tracking-wide text-[#D08A84] hover:text-white transition-colors disabled:opacity-40">
                    <XCircle size={16} weight="thin" /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Toutes les maisons */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] tracking-[0.25em] uppercase text-white/50 mb-5">Toutes les maisons ({items.length})</h2>
        {items.length === 0 ? (
          <p className="font-serif text-[13px] font-light text-white/35">Aucune maison proposée.</p>
        ) : (
          <div className="divide-y divide-white/8 border-y border-white/8">
            {items.map((p) => {
              const b = BADGE[p.status] || BADGE.pending;
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-serif text-[14px] text-white truncate">{p.maison_name}</p>
                    <p className="font-serif text-[11px] font-light text-white/35 truncate">{p.recruiter}{p.maison_email ? ` · ${p.maison_email}` : ""}</p>
                  </div>
                  <div className={`shrink-0 inline-flex items-center gap-2 font-serif text-[12px] ${b.text}`}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: b.dot, display: "inline-block" }} />
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recruiters */}
      <section>
        <h2 className="font-serif text-[13px] tracking-[0.25em] uppercase text-white/50 mb-5">Recruiters ({recruiters.length})</h2>
        {recruiters.length === 0 ? (
          <p className="font-serif text-[13px] font-light text-white/35">
            Aucun recruiter. Créez-en un depuis <Link href="/admin/nuevo" className="text-champagne hover:underline">Nouveau membre</Link>.
          </p>
        ) : (
          <div className="divide-y divide-white/8 border-y border-white/8">
            {recruiters.map((r) => {
              const count = signedByRecruiter(r.id);
              return (
                <div key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-serif text-[14px] text-white truncate">{r.full_name || r.email}</p>
                    <p className="font-serif text-[11px] font-light text-white/35 truncate">
                      {r.email}{r.iban ? ` · IBAN : ${r.iban}` : " · IBAN non renseigné"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-serif text-[14px] text-champagne">{eur(count * PER_MAISON)}</p>
                    <p className="font-serif text-[10px] tracking-wide uppercase text-white/35">{count} signée{count > 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
