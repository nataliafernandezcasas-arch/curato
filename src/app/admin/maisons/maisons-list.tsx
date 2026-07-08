"use client";

import { useState } from "react";
import ComingSoonToggle from "./coming-soon-toggle";

export type MaisonItem = {
  id: string;
  name: string;
  email: string;
  place: string; // "Paris 8e" etc.
  planLabel: string;
  isSigned: boolean;
  signatory: string;
  signedDate: string;
  comingSoon: boolean;
  account: "connected" | "never" | "none";
  lastSignIn: string;
};

// Admin maisons list with search. By default only signed maisons are shown to
// keep it focused; typing a query searches across ALL maisons by name.
export default function MaisonsList({ maisons }: { maisons: MaisonItem[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const list = query
    ? maisons.filter((m) => m.name.toLowerCase().includes(query))
    : maisons.filter((m) => m.isSigned);

  return (
    <div>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une maison…"
        className="w-full max-w-[420px] px-5 py-3 mb-8 border border-white/15 bg-black/40 text-white font-serif text-[14px] focus:outline-none focus:border-champagne/40 transition-colors placeholder:text-white/30"
      />

      {!query && (
        <p className="font-serif text-[12px] font-light text-white/40 mb-6">
          Seules les maisons signées sont affichées. Recherchez pour voir les autres.
        </p>
      )}

      {list.length === 0 ? (
        <div className="text-center py-16 border border-white/10">
          <p className="font-serif text-[14px] font-light text-white/55">
            {query ? "Aucune maison trouvée." : "Aucune maison signée pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((m) => (
            <div key={m.id} className="border border-white/10 bg-black/40 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="font-serif text-[18px] font-light text-white">{m.name || "—"}</p>
                  <p className="font-serif text-[13px] text-white/65 mt-1">
                    {m.email || ""}
                    {m.place ? ` · ${m.place}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Formule</p>
                    <p className="font-serif text-[14px] text-champagne">{m.planLabel}</p>
                  </div>
                  <div className="min-w-[110px]">
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Compte</p>
                    <p className={`font-serif text-[14px] ${m.account === "connected" ? "text-emerald-400" : m.account === "never" ? "text-amber-300" : "text-white/40"}`}>
                      {m.account === "connected" ? "Connectée" : m.account === "never" ? "Jamais entrée" : "Pas de compte"}
                    </p>
                    {m.account === "connected" && m.lastSignIn && <p className="font-serif text-[11px] text-white/30 mt-0.5">{m.lastSignIn}</p>}
                  </div>
                  <div className="min-w-[110px]">
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/55">Engagement</p>
                    <p className={`font-serif text-[14px] ${m.isSigned ? "text-emerald-400" : "text-white/45"}`}>
                      {m.isSigned ? "Signé" : "Non signé"}
                    </p>
                  </div>
                  <div className="self-center">
                    <ComingSoonToggle id={m.id} initial={m.comingSoon} />
                  </div>
                </div>
              </div>

              {m.isSigned && (
                <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap gap-x-10 gap-y-2">
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-1">Signé par</p>
                    <p className="font-serif text-[15px] text-white/85">{m.signatory || "—"}</p>
                  </div>
                  <div>
                    <p className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/70 mb-1">Date</p>
                    <p className="font-serif text-[15px] text-white/85">{m.signedDate}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
