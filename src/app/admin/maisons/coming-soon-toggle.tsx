"use client";

import { useState } from "react";

// Admin toggle: mark a maison as "coming soon" (blurred teaser in the directory)
// or visible. Optimistic, with a small saving state.
export default function ComingSoonToggle({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !on;
    setSaving(true);
    setOn(next);
    try {
      const res = await fetch("/api/admin/maisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comingSoon: next }),
      });
      if (!res.ok) setOn(!next); // revert on failure
    } catch {
      setOn(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`font-serif text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${
        on
          ? "border-amber-400/50 text-amber-300 bg-amber-400/10"
          : "border-white/15 text-white/50 hover:text-white/80 hover:border-white/30"
      } ${saving ? "opacity-50" : ""}`}
      title={on ? "Visible comme « Prochainement » (masqué)" : "Visible normalement dans le répertoire"}
    >
      {on ? "Prochainement · masqué" : "Masquer (Prochainement)"}
    </button>
  );
}
