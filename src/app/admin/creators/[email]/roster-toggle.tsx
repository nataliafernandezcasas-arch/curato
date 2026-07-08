"use client";

import { useState } from "react";

// Admin toggle: hide a creator from the maison-facing roster (they stay in
// admin). Optimistic, saves via the creators PATCH endpoint.
export default function CreatorRosterToggle({ email, initial }: { email: string; initial: boolean }) {
  const [hidden, setHidden] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !hidden;
    setSaving(true);
    setHidden(next);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hidden_from_roster: next }),
      });
      if (!res.ok) setHidden(!next);
    } catch {
      setHidden(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`font-serif text-[11px] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
        hidden
          ? "border-amber-400/50 text-amber-300 bg-amber-400/10"
          : "border-white/20 text-white/60 hover:text-white hover:border-white/40"
      } ${saving ? "opacity-50" : ""}`}
      title={hidden ? "Masqué aux maisons — cliquer pour afficher" : "Visible par les maisons — cliquer pour masquer"}
    >
      {hidden ? "Masqué aux maisons" : "Masquer aux maisons"}
    </button>
  );
}
