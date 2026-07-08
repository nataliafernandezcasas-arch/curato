"use client";

import { useState } from "react";

type Initial = {
  full_name: string;
  handle: string;
  followers: number | null;
  monthly_credit_cop: number | null;
  stage: string;
};

// Inline editor for a creator, used on the admin detail page. Saves via the
// admin PATCH endpoint (keyed by email) and reloads to reflect changes.
export default function CreatorEditForm({ email, initial }: { email: string; initial: Initial }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [followers, setFollowers] = useState(initial.followers?.toString() ?? "");
  const [credit, setCredit] = useState(initial.monthly_credit_cop?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: fullName,
          handle,
          followers: followers === "" ? null : Number(followers),
          monthly_credit_cop: credit === "" ? null : Number(credit),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Erreur");
        setSaving(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Erreur réseau");
      setSaving(false);
    }
  }

  async function archive() {
    if (!confirm("Archiver ce créateur ? Il disparaîtra de la liste.")) return;
    setSaving(true);
    const res = await fetch("/api/admin/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, archive: true }),
    });
    if (res.ok) window.location.href = "/admin/creators";
    else setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:border-champagne/40 transition-colors"
      >
        Éditer
      </button>
    );
  }

  const field = "w-full px-4 py-3 border border-white/15 bg-black/40 text-white font-serif text-[14px] focus:outline-none focus:border-champagne/40 transition-colors";
  const label = "block font-serif text-[10px] tracking-[0.25em] uppercase text-white/40 mb-2";

  return (
    <div className="w-full border border-champagne/20 bg-black/40 p-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={label}>Nom</label>
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className={label}>Instagram (handle)</label>
          <input className={field} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="sans @" />
        </div>
        <div>
          <label className={label}>Abonnés</label>
          <input className={field} value={followers} onChange={(e) => setFollowers(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className={label}>Budget mensuel (€)</label>
          <input className={field} value={credit} onChange={(e) => setCredit(e.target.value)} inputMode="numeric" />
        </div>
      </div>

      {error && <p className="font-serif text-[13px] text-red-400/80 mt-4">{error}</p>}

      <div className="flex items-center gap-3 mt-6 flex-wrap">
        <button
          onClick={save}
          disabled={saving}
          className={`font-serif text-[11px] tracking-[0.2em] uppercase px-6 py-3 transition-colors ${saving ? "bg-white/10 text-white/30" : "bg-champagne text-charcoal-deep hover:bg-copper hover:text-white"}`}
        >
          {saving ? "…" : "Enregistrer"}
        </button>
        <button onClick={() => setOpen(false)} className="font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-3 text-white/50 hover:text-white transition-colors">
          Annuler
        </button>
        <button onClick={archive} disabled={saving} className="font-serif text-[11px] tracking-[0.2em] uppercase px-4 py-3 text-red-400/60 hover:text-red-400 transition-colors ml-auto">
          Archiver
        </button>
      </div>
    </div>
  );
}
