"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SignOut } from "@phosphor-icons/react";
import RoleSwitch from "../role-switch";

type Prospect = {
  id: string;
  maison_name: string;
  maison_email: string | null;
  notes: string | null;
  effectiveStatus: "pending" | "approved" | "rejected" | "signed";
  created_at: string;
};
type Data = {
  recruiter: { full_name: string | null; email: string; iban: string };
  prospects: Prospect[];
  earnings: { signedCount: number; perMaison: number; total: number };
};

const STATUS: Record<Prospect["effectiveStatus"], { label: string; dot: string; text: string }> = {
  pending: { label: "En attente de validation", dot: "#C9A34B", text: "text-[#D8BE7E]" },
  approved: { label: "Validée · à contacter", dot: "#7FA8C9", text: "text-[#9EC1DE]" },
  rejected: { label: "Refusée", dot: "#B5564E", text: "text-[#D08A84]" },
  signed: { label: "Signée", dot: "#6FA372", text: "text-[#9CC79E]" },
};

const eur = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export default function RecruiterDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const [iban, setIban] = useState("");
  const [ibanMsg, setIbanMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/recruiter", { cache: "no-store" });
    if (res.ok) {
      const d: Data = await res.json();
      setData(d);
      setIban(d.recruiter.iban || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addProspect(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setAdding(true);
    setAddMsg("");
    const res = await fetch("/api/recruiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_prospect", maison_name: name, maison_email: email, notes }),
    });
    setAdding(false);
    if (res.ok) {
      setName(""); setEmail(""); setNotes("");
      setAddMsg("Maison proposée. Nous la validons sous peu.");
      load();
    } else {
      setAddMsg("Une erreur est survenue. Réessayez.");
    }
  }

  async function saveIban(e: React.FormEvent) {
    e.preventDefault();
    setIbanMsg("");
    const res = await fetch("/api/recruiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_iban", iban }),
    });
    setIbanMsg(res.ok ? "IBAN enregistré." : "Erreur, réessayez.");
  }

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/auth/sign-in";
  }

  const inputClass =
    "w-full font-serif text-[14px] font-light text-white bg-white/5 border border-white/15 px-4 py-3 focus:outline-none focus:border-champagne/50 transition-colors placeholder:text-white/25";
  const labelClass = "block font-serif text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2";

  const firstName = (data?.recruiter.full_name || "").split(" ")[0];

  return (
    <main className="min-h-[100dvh] max-w-[760px] mx-auto px-5 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-14">
        <Link href="/">
          <img src="/logo-curato-simple.png" alt="curato" style={{ height: "13px", width: "auto", display: "block" }} />
        </Link>
        <div className="flex items-center gap-6">
          <RoleSwitch current="recruiter" />
          <button onClick={signOut} className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
            <SignOut size={14} weight="thin" /> Déconnexion
          </button>
        </div>
      </div>

      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">Espace Recruiter</p>
      <h1 className="font-serif text-3xl font-light tracking-wide text-white mb-2">
        Bonjour{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="font-serif text-[14px] font-light text-white/55 leading-relaxed mb-12">
        Proposez une maison, nous la validons, puis vous la contactez. Vous gagnez 50 % de l&apos;abonnement (299 €) pendant 3 mois par maison signée.
      </p>

      {/* Payouts summary */}
      <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
        {[
          { k: "Maisons signées", v: loading ? "—" : String(data?.earnings.signedCount ?? 0) },
          { k: "Par maison", v: eur(448.5) },
          { k: "Commission générée", v: loading ? "—" : eur(data?.earnings.total ?? 0) },
        ].map((c) => (
          <div key={c.k} className="bg-black/30 px-5 py-6">
            <p className="font-serif text-[9px] tracking-[0.3em] uppercase text-white/35 mb-3">{c.k}</p>
            <p className="font-serif text-[20px] font-light text-champagne">{c.v}</p>
          </div>
        ))}
      </div>

      {/* Add a maison */}
      <section className="border border-white/10 bg-black/20 p-6 mb-12">
        <h2 className="font-serif text-[15px] text-white mb-1">Proposer une maison</h2>
        <p className="font-serif text-[12px] font-light text-white/45 mb-5">
          Attendez la validation avant de la contacter (cela évite les doublons).
        </p>
        <form onSubmit={addProspect} className="space-y-4">
          <div>
            <label className={labelClass}>Nom de la maison *</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Le Comptoir du Marais" required />
          </div>
          <div>
            <label className={labelClass}>Email de la maison</label>
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@lamaison.com" type="email" />
          </div>
          <div>
            <label className={labelClass}>Notes (optionnel)</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adresse, contact, arrondissement…" />
          </div>
          {addMsg && <p className="font-serif text-[12px] text-champagne/80">{addMsg}</p>}
          <button type="submit" disabled={adding} className="font-serif text-[11px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40">
            {adding ? "Envoi…" : "Proposer la maison"}
          </button>
        </form>
      </section>

      {/* Prospects list */}
      <section className="mb-12">
        <h2 className="font-serif text-[15px] text-white mb-5">Mes maisons</h2>
        {loading ? (
          <p className="font-serif text-[13px] text-white/40">Chargement…</p>
        ) : data && data.prospects.length > 0 ? (
          <div className="divide-y divide-white/8 border-y border-white/8">
            {data.prospects.map((p) => {
              const s = STATUS[p.effectiveStatus];
              return (
                <div key={p.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-[15px] text-white truncate">{p.maison_name}</p>
                    {p.maison_email && <p className="font-serif text-[12px] font-light text-white/40 truncate">{p.maison_email}</p>}
                  </div>
                  <div className={`shrink-0 inline-flex items-center gap-2 font-serif text-[12px] ${s.text}`}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: s.dot, display: "inline-block" }} />
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-serif text-[13px] font-light text-white/40">Vous n&apos;avez pas encore proposé de maison.</p>
        )}
      </section>

      {/* Payouts / IBAN */}
      <section className="border border-white/10 bg-black/20 p-6">
        <h2 className="font-serif text-[15px] text-white mb-1">Vos versements</h2>
        <p className="font-serif text-[12px] font-light text-white/45 mb-5">
          Les commissions sont versées par virement, au fil des paiements de chaque maison. Renseignez votre IBAN pour être payé.
        </p>
        <form onSubmit={saveIban} className="space-y-4">
          <div>
            <label className={labelClass}>IBAN</label>
            <input className={inputClass} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="FR76 ..." />
          </div>
          {ibanMsg && <p className="font-serif text-[12px] text-champagne/80">{ibanMsg}</p>}
          <button type="submit" className="font-serif text-[11px] tracking-[0.25em] uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300">
            Enregistrer l&apos;IBAN
          </button>
        </form>
      </section>
    </main>
  );
}
