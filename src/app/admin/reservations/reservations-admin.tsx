"use client";

import { useState } from "react";

type Item = {
  id: string;
  venueId: string;
  venueName: string;
  creatorName: string;
  creatorHandle: string | null;
  whenLabel: string;
  partySize: number;
  note: string | null;
  credits: number;
};

function Card({ item, onResolved }: { item: Item; onResolved: (id: string) => void }) {
  const [mode, setMode] = useState<"idle" | "propose">("idle");
  const [slots, setSlots] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      onResolved(item.id);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  }

  function sendProposal() {
    const clean = slots.filter((s) => s).map((local) => ({ iso: new Date(local).toISOString(), local }));
    if (clean.length === 0) {
      setError("Ajoutez au moins un créneau.");
      return;
    }
    post({ id: item.id, action: "propose", slots: clean });
  }

  return (
    <div className="border border-white/10 bg-black/40 p-6 mb-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-serif text-[18px] font-light text-white">{item.venueName}</p>
          <p className="font-serif text-[13px] text-white/40 mt-1">
            {item.creatorName}
            {item.creatorHandle ? ` · @${item.creatorHandle}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[13px] text-champagne/80">{item.whenLabel}</p>
          <p className="font-serif text-[12px] text-white/30 mt-1">
            {item.partySize} pers. · {item.credits} crédits
          </p>
        </div>
      </div>

      {item.note && (
        <p className="font-serif text-[13px] font-light text-white/40 italic mt-4 border-l border-white/10 pl-3">
          « {item.note} »
        </p>
      )}

      {error && <p className="font-serif text-[12px] text-copper/80 mt-4">{error}</p>}

      {mode === "idle" ? (
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => post({ id: item.id, action: "confirm" })}
            disabled={busy}
            className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
          >
            {busy ? "…" : "Confirmer"}
          </button>
          <button
            onClick={() => { setMode("propose"); setError(""); }}
            disabled={busy}
            className="font-serif text-[11px] tracking-widest uppercase text-white/50 border border-white/15 px-6 py-3 hover:border-champagne/40 hover:text-champagne transition-all duration-200 disabled:opacity-50"
          >
            Proposer d'autres créneaux
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="font-serif text-[11px] tracking-[0.2em] uppercase text-champagne/50">
            Créneaux proposés
          </p>
          {slots.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="datetime-local"
                step={1800}
                value={s}
                onChange={(e) => {
                  const next = [...slots];
                  next[i] = e.target.value;
                  setSlots(next);
                }}
                className="flex-1 px-4 py-3 border border-white/15 bg-black/40 text-white font-serif text-[14px] focus:outline-none focus:border-champagne/40"
              />
              {slots.length > 1 && (
                <button
                  onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                  className="font-serif text-[13px] text-white/30 hover:text-copper px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setSlots([...slots, ""])}
            className="font-serif text-[11px] tracking-wide text-white/40 hover:text-champagne transition-colors"
          >
            + Ajouter un créneau
          </button>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={sendProposal}
              disabled={busy}
              className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              {busy ? "Envoi…" : "Envoyer les créneaux"}
            </button>
            <button
              onClick={() => { setMode("idle"); setError(""); }}
              disabled={busy}
              className="font-serif text-[11px] tracking-widest uppercase text-white/40 hover:text-white px-3 py-3"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationsAdmin({ items }: { items: Item[] }) {
  const [list, setList] = useState<Item[]>(items);

  function resolve(id: string) {
    setList((l) => l.filter((it) => it.id !== id));
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-20 border border-white/5">
        <p className="font-serif text-[14px] font-light text-white/30">
          Aucune demande en attente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {list.map((it) => (
        <Card key={it.id} item={it} onResolved={resolve} />
      ))}
    </div>
  );
}
