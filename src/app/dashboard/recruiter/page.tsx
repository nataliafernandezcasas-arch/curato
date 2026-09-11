"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SignOut } from "@phosphor-icons/react";
import RoleSwitch from "../role-switch";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { Button } from "@/components/member/button";

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

// FR / EN / ES copy for the recruiter space.
const T: Record<Lang, Record<string, string>> = {
  fr: {
    eyebrow: "Espace Recruiter",
    hello: "Bonjour",
    intro: "Proposez une maison, nous la validons, puis vous la contactez. Vous gagnez 50 % de l'abonnement (299 €) pendant 3 mois par maison signée.",
    statSigned: "Maisons signées",
    statPerMaison: "Par maison",
    statCommission: "Commission générée",
    proposeTitle: "Proposer une maison",
    proposeSub: "Attendez la validation avant de la contacter (cela évite les doublons).",
    lblName: "Nom de la maison *",
    phName: "Le Comptoir du Marais",
    lblEmail: "Email de la maison",
    phEmail: "contact@lamaison.com",
    lblNotes: "Notes (optionnel)",
    phNotes: "Adresse, contact, arrondissement…",
    btnPropose: "Proposer la maison",
    btnProposing: "Envoi…",
    msgProposed: "Maison proposée. Nous la validons sous peu.",
    msgError: "Une erreur est survenue. Réessayez.",
    myMaisons: "Mes maisons",
    loading: "Chargement…",
    empty: "Vous n'avez pas encore proposé de maison.",
    stPending: "En attente de validation",
    stApproved: "Validée · à contacter",
    stRejected: "Refusée",
    stSigned: "Signée",
    payoutsTitle: "Vos versements",
    payoutsSub: "Les commissions sont versées par virement, au fil des paiements de chaque maison. Renseignez votre IBAN pour être payé.",
    lblIban: "IBAN",
    phIban: "FR76 ...",
    msgIbanSaved: "IBAN enregistré.",
    msgIbanError: "Erreur, réessayez.",
    btnSaveIban: "Enregistrer l'IBAN",
    signOut: "Déconnexion",
  },
  en: {
    eyebrow: "Recruiter space",
    hello: "Hello",
    intro: "Propose a maison, we validate it, then you contact it. You earn 50% of the subscription (€299) for 3 months per signed maison.",
    statSigned: "Signed maisons",
    statPerMaison: "Per maison",
    statCommission: "Commission earned",
    proposeTitle: "Propose a maison",
    proposeSub: "Wait for validation before contacting it (this avoids duplicates).",
    lblName: "Maison name *",
    phName: "Le Comptoir du Marais",
    lblEmail: "Maison email",
    phEmail: "contact@lamaison.com",
    lblNotes: "Notes (optional)",
    phNotes: "Address, contact, arrondissement…",
    btnPropose: "Propose the maison",
    btnProposing: "Sending…",
    msgProposed: "Maison proposed. We'll validate it shortly.",
    msgError: "Something went wrong. Please try again.",
    myMaisons: "My maisons",
    loading: "Loading…",
    empty: "You haven't proposed any maison yet.",
    stPending: "Awaiting validation",
    stApproved: "Validated · to contact",
    stRejected: "Declined",
    stSigned: "Signed",
    payoutsTitle: "Your payouts",
    payoutsSub: "Commissions are paid by bank transfer, as each maison pays. Enter your IBAN to get paid.",
    lblIban: "IBAN",
    phIban: "FR76 ...",
    msgIbanSaved: "IBAN saved.",
    msgIbanError: "Error, please try again.",
    btnSaveIban: "Save IBAN",
    signOut: "Sign out",
  },
  es: {
    eyebrow: "Espacio Recruiter",
    hello: "Hola",
    intro: "Propón una maison, la validamos, y luego la contactas. Ganas el 50 % de la suscripción (299 €) durante 3 meses por cada maison firmada.",
    statSigned: "Maisons firmadas",
    statPerMaison: "Por maison",
    statCommission: "Comisión generada",
    proposeTitle: "Proponer una maison",
    proposeSub: "Espera la validación antes de contactarla (así se evitan duplicados).",
    lblName: "Nombre de la maison *",
    phName: "Le Comptoir du Marais",
    lblEmail: "Email de la maison",
    phEmail: "contact@lamaison.com",
    lblNotes: "Notas (opcional)",
    phNotes: "Dirección, contacto, arrondissement…",
    btnPropose: "Proponer la maison",
    btnProposing: "Enviando…",
    msgProposed: "Maison propuesta. La validamos pronto.",
    msgError: "Ocurrió un error. Inténtalo de nuevo.",
    myMaisons: "Mis maisons",
    loading: "Cargando…",
    empty: "Aún no has propuesto ninguna maison.",
    stPending: "En espera de validación",
    stApproved: "Validada · por contactar",
    stRejected: "Rechazada",
    stSigned: "Firmada",
    payoutsTitle: "Tus pagos",
    payoutsSub: "Las comisiones se pagan por transferencia, según los pagos de cada maison. Ingresa tu IBAN para recibir el pago.",
    lblIban: "IBAN",
    phIban: "FR76 ...",
    msgIbanSaved: "IBAN guardado.",
    msgIbanError: "Error, inténtalo de nuevo.",
    btnSaveIban: "Guardar IBAN",
    signOut: "Cerrar sesión",
  },
};

// Status colour dots (labels come from the translation table by key).
const STATUS_STYLE: Record<Prospect["effectiveStatus"], { dot: string; text: string; key: string }> = {
  pending: { dot: "#C9A34B", text: "text-[#D8BE7E]", key: "stPending" },
  approved: { dot: "#7FA8C9", text: "text-[#9EC1DE]", key: "stApproved" },
  rejected: { dot: "#B5564E", text: "text-[#D08A84]", key: "stRejected" },
  signed: { dot: "#6FA372", text: "text-[#9CC79E]", key: "stSigned" },
};

const LANGS: Lang[] = ["fr", "en", "es"];

function eur(n: number, lang: Lang): string {
  if (lang === "en") return "€" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const locale = lang === "es" ? "es-ES" : "fr-FR";
  return n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function RecruiterDashboard() {
  const { lang, setLang } = useLang();
  const t = T[lang];

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
      setAddMsg(t.msgProposed);
      load();
    } else {
      setAddMsg(t.msgError);
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
    setIbanMsg(res.ok ? t.msgIbanSaved : t.msgIbanError);
  }

  async function signOut() {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    window.location.href = "/auth/sign-in";
  }

  const inputClass =
    "campo-cristal font-serif text-[14px] font-light";
  const labelClass = "block font-serif text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2";

  const firstName = (data?.recruiter.full_name || "").split(" ")[0];

  return (
    <main className="min-h-[100dvh] max-w-[1120px] mx-auto px-6 md:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Link href="/dashboard">
          <img src="/logo-curato-simple.png" alt="curato" style={{ height: "13px", width: "auto", display: "block" }} />
        </Link>
        <div className="flex items-center gap-6">
          <RoleSwitch current="recruiter" />
          <div className="flex items-center gap-2.5">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`font-serif text-[11px] tracking-[0.2em] uppercase transition-colors ${
                  lang === l ? "text-champagne" : "text-white/40 hover:text-white/70"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 font-serif text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
            <SignOut size={14} weight="thin" /> {t.signOut}
          </button>
        </div>
      </div>

      <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/60 mb-3">{t.eyebrow}</p>
      <h1 className="font-serif text-3xl font-light tracking-wide text-white mb-2">
        {t.hello}{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="font-serif text-[14px] font-light text-white/55 leading-relaxed mb-12">
        {t.intro}
      </p>

      {/* Payouts summary */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 border border-white/10 mb-12">
        {[
          { k: t.statSigned, v: loading ? "—" : String(data?.earnings.signedCount ?? 0) },
          { k: t.statPerMaison, v: eur(448.5, lang) },
          { k: t.statCommission, v: loading ? "—" : eur(data?.earnings.total ?? 0, lang) },
        ].map((c) => (
          <div key={c.k} className="bg-black/30 px-7 py-8">
            <p className="font-serif text-[9px] tracking-[0.3em] uppercase text-white/35 mb-3">{c.k}</p>
            <p className="font-serif text-[20px] font-light text-champagne">{c.v}</p>
          </div>
        ))}
      </div>

      {/* Add a maison */}
      <section className="caja-cristal p-8 mb-12">
        <h2 className="font-serif text-[15px] text-white mb-1">{t.proposeTitle}</h2>
        <p className="font-serif text-[12px] font-light text-white/45 mb-5">
          {t.proposeSub}
        </p>
        <form onSubmit={addProspect} className="space-y-4">
          <div>
            <label className={labelClass}>{t.lblName}</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.phName} required />
          </div>
          <div>
            <label className={labelClass}>{t.lblEmail}</label>
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.phEmail} type="email" />
          </div>
          <div>
            <label className={labelClass}>{t.lblNotes}</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.phNotes} />
          </div>
          {addMsg && <p className="font-serif text-[12px] text-champagne/80">{addMsg}</p>}
          <Button type="submit" disabled={adding}>
            {adding ? t.btnProposing : t.btnPropose}
          </Button>
        </form>
      </section>

      {/* Prospects list */}
      <section className="mb-12">
        <h2 className="font-serif text-[15px] text-white mb-5">{t.myMaisons}</h2>
        {loading ? (
          <p className="font-serif text-[13px] text-white/40">{t.loading}</p>
        ) : data && data.prospects.length > 0 ? (
          <div className="divide-y divide-white/8 border-y border-white/8">
            {data.prospects.map((p) => {
              const s = STATUS_STYLE[p.effectiveStatus];
              return (
                <div key={p.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-[15px] text-white truncate">{p.maison_name}</p>
                    {p.maison_email && <p className="font-serif text-[12px] font-light text-white/40 truncate">{p.maison_email}</p>}
                  </div>
                  <div className={`shrink-0 inline-flex items-center gap-2 font-serif text-[12px] ${s.text}`}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: s.dot, display: "inline-block" }} />
                    {t[s.key]}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-serif text-[13px] font-light text-white/40">{t.empty}</p>
        )}
      </section>

      {/* Payouts / IBAN */}
      <section className="caja-cristal p-8">
        <h2 className="font-serif text-[15px] text-white mb-1">{t.payoutsTitle}</h2>
        <p className="font-serif text-[12px] font-light text-white/45 mb-5">
          {t.payoutsSub}
        </p>
        <form onSubmit={saveIban} className="space-y-4">
          <div>
            <label className={labelClass}>{t.lblIban}</label>
            <input className={inputClass} value={iban} onChange={(e) => setIban(e.target.value)} placeholder={t.phIban} />
          </div>
          {ibanMsg && <p className="font-serif text-[12px] text-champagne/80">{ibanMsg}</p>}
          <Button type="submit">{t.btnSaveIban}</Button>
        </form>
      </section>
    </main>
  );
}
