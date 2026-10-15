"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEXTO = {
  storyteller: {
    reiniciar: "Recommence comme si elle venait d'être acceptée : bienvenue, questionnaire, guide, Instagram et profil. Ses visites restent.",
    suprimir: "Supprime tout : visites, crédits, fiche, candidatures et compte de connexion. Irréversible.",
    volver: "/admin/creators",
  },
  maison: {
    reiniciar: "Recommence au premier accès : elle signe de nouveau l'engagement. Sa fiche et ses visites restent.",
    suprimir: "Supprime tout : visites, fiche, candidatures et compte de connexion. Irréversible.",
    volver: "/admin/maisons",
  },
} as const;

/**
 * Réinitialiser ou supprimer un compte, depuis sa fiche. Supprimer demande
 * d'écrire SUPPRIMER : c'est irréversible.
 */
export default function AccionesDeCuenta({ tipo, id, nombre }: { tipo: "storyteller" | "maison"; id: string; nombre: string }) {
  const router = useRouter();
  const t = TEXTO[tipo];
  const [abierta, setAbierta] = useState<"reiniciar" | "suprimir" | null>(null);
  const [frase, setFrase] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function hacer(accion: "reiniciar" | "suprimir") {
    setOcupado(true);
    setMensaje(null);
    const res = await fetch("/api/admin/cuenta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, id, accion }),
    }).catch(() => null);
    setOcupado(false);
    if (!res?.ok) {
      const d = await res?.json().catch(() => null);
      setMensaje({ ok: false, texto: `Échec${d?.error ? ` (${d.error})` : ""}. Rien n'a été changé ou seulement en partie : réessayez.` });
      return;
    }
    if (accion === "suprimir") {
      router.replace(t.volver);
      router.refresh();
      return;
    }
    setAbierta(null);
    setMensaje({ ok: true, texto: "Compte réinitialisé." });
    router.refresh();
  }

  const boton = "border px-4 py-2.5 font-serif text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-40";

  return (
    <section className="mt-14 border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="mb-5 font-serif text-[11px] uppercase tracking-[0.35em] text-champagne/40">Compte</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setAbierta(abierta === "reiniciar" ? null : "reiniciar")} className={`${boton} border-white/20 text-white/70 hover:text-white`}>
          Réinitialiser
        </button>
        <button type="button" onClick={() => setAbierta(abierta === "suprimir" ? null : "suprimir")} className={`${boton} border-red-400/30 text-red-300/80 hover:text-red-300`}>
          Supprimer
        </button>
      </div>

      {abierta === "reiniciar" && (
        <div className="mt-5">
          <p className="font-serif text-[13px] text-white/60">{t.reiniciar}</p>
          <button type="button" disabled={ocupado} onClick={() => hacer("reiniciar")} className={`${boton} mt-4 border-champagne/40 text-champagne`}>
            {ocupado ? "…" : `Réinitialiser ${nombre}`}
          </button>
        </div>
      )}

      {abierta === "suprimir" && (
        <div className="mt-5">
          <p className="font-serif text-[13px] text-white/60">{t.suprimir}</p>
          <p className="mt-3 font-serif text-[12px] text-white/45">Écrivez SUPPRIMER pour confirmer.</p>
          <input
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            autoCapitalize="characters"
            className="mt-2 w-full max-w-[260px] border border-white/15 bg-white/5 px-3 py-2 font-serif text-[14px] text-white outline-none focus:border-red-300/60"
          />
          <div>
            <button
              type="button"
              disabled={ocupado || frase.trim().toUpperCase() !== "SUPPRIMER"}
              onClick={() => hacer("suprimir")}
              className={`${boton} mt-4 border-red-400/50 text-red-300`}
            >
              {ocupado ? "…" : `Supprimer ${nombre}`}
            </button>
          </div>
        </div>
      )}

      {mensaje && <p className={`mt-4 font-serif text-[13px] ${mensaje.ok ? "text-emerald-400" : "text-red-300"}`}>{mensaje.texto}</p>}
    </section>
  );
}
