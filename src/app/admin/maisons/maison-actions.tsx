"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MaisonItem } from "./maisons-list";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "", label: "— Catégorie —" },
  { id: "00000000-0000-0000-0000-0000000ca702", label: "Gastronomie" },
  { id: "00000000-0000-0000-0000-0000000ca701", label: "Hôtels" },
  { id: "00000000-0000-0000-0000-0000000ca703", label: "Wellness" },
  { id: "00000000-0000-0000-0000-0000000ca704", label: "Beauté" },
];

const PLANS: { id: string; label: string }[] = [
  { id: "", label: "— Formule —" },
  { id: "monthly_299", label: "299 €/mois" },
  { id: "yearly_2990", label: "2 990 €/an" },
];

const inputCls =
  "w-full px-3 py-2 border border-white/15 bg-black/40 text-white font-serif text-[13px] focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/30";
const labelCls = "block font-serif text-[10px] tracking-[0.2em] uppercase text-white/45 mb-1.5";

// Admin actions for one maison: sign / un-sign, and edit its details.
export default function MaisonActions({ m }: { m: MaisonItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: m.name,
    email: m.email,
    arrondissement: m.arrondissement,
    address: m.address,
    description: m.description,
    website_url: m.websiteUrl,
    subscription_plan: m.subscriptionPlan,
    category_id: m.categoryId,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function toggleSign() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/maisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, action: "sign", signed: !m.isSigned }),
      });
      if (!res.ok) setErr((await res.json()).error || "Erreur.");
      else router.refresh();
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/maisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, action: "update", fields: form }),
      });
      if (!res.ok) setErr((await res.json()).error || "Erreur.");
      else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  const btn = "font-serif text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors disabled:opacity-50";

  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleSign}
          disabled={busy}
          className={`${btn} ${m.isSigned ? "border-white/15 text-white/50 hover:text-white/80 hover:border-white/30" : "border-emerald-400/50 text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20"}`}
          title={m.isSigned ? "Retirer la signature (masque du catalogue)" : "Marquer comme signé (visible dans le catalogue)"}
        >
          {m.isSigned ? "Retirer la signature" : "Marquer comme signé"}
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          disabled={busy}
          className={`${btn} border-white/15 text-white/60 hover:text-champagne hover:border-champagne/40`}
        >
          {editing ? "Fermer" : "Éditer"}
        </button>
        {err && <span className="font-serif text-[12px] text-copper/80">{err}</span>}
      </div>

      {editing && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom</label>
            <input className={inputCls} value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className={labelCls}>Arrondissement</label>
            <input className={inputCls} value={form.arrondissement} onChange={set("arrondissement")} placeholder="8e" />
          </div>
          <div>
            <label className={labelCls}>Adresse</label>
            <input className={inputCls} value={form.address} onChange={set("address")} />
          </div>
          <div>
            <label className={labelCls}>Site web</label>
            <input className={inputCls} value={form.website_url} onChange={set("website_url")} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls}>Catégorie</label>
            <select className={inputCls} value={form.category_id} onChange={set("category_id")}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-charcoal-deep">{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Formule</label>
            <select className={inputCls} value={form.subscription_plan} onChange={set("subscription_plan")}>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id} className="bg-charcoal-deep">{p.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={form.description} onChange={set("description")} />
          </div>
          <div className="md:col-span-2">
            <button onClick={save} disabled={busy} className={`${btn} border-champagne/50 text-champagne bg-champagne/10 hover:bg-champagne/20`}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
