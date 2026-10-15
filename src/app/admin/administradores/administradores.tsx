"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Persona = { userId: string; email: string; desde: string; ultima: string | null };

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : "jamais";

export default function Administradores({ lista }: { lista: Persona[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function anadir(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMensaje(null);
    const res = await fetch("/api/admin/administradores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const d = await res?.json().catch(() => null);
    setOcupado(false);
    if (!res?.ok) {
      setMensaje({ ok: false, texto: d?.error === "email" ? "Cet email n'est pas valide." : `Échec (${d?.error ?? "réseau"}).` });
      return;
    }
    setMensaje({
      ok: true,
      texto: d?.nueva
        ? `${email} est administrateur. Un email lui a été envoyé pour choisir son mot de passe.`
        : `${email} est administrateur. Il se connecte avec son compte Curato habituel.`,
    });
    setEmail("");
    router.refresh();
  }

  async function quitar(p: Persona) {
    if (!confirm(`Retirer l'accès admin à ${p.email} ? Son compte reste, il n'entre simplement plus dans l'admin.`)) return;
    const res = await fetch("/api/admin/administradores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: p.userId }),
    }).catch(() => null);
    const d = await res?.json().catch(() => null);
    if (!res?.ok) {
      setMensaje({ ok: false, texto: d?.error === "ultimo" ? "Il faut au moins un administrateur." : "Échec. Réessayez." });
      return;
    }
    router.refresh();
  }

  return (
    <>
      <ul className="mb-12 divide-y divide-white/8 border-y border-white/8">
        {lista.map((p) => (
          <li key={p.userId} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-serif text-[15px] text-white">{p.email}</p>
              <p className="mt-0.5 font-serif text-[12px] text-white/35">
                admin depuis le {fecha(p.desde)} · dernière connexion : {fecha(p.ultima)}
              </p>
            </div>
            <button type="button" onClick={() => quitar(p)} className="font-serif text-[11px] uppercase tracking-[0.2em] text-red-300/70 hover:text-red-300">
              Retirer
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={anadir} className="border border-white/10 bg-white/5 p-6">
        <p className="mb-2 font-serif text-[11px] uppercase tracking-[0.35em] text-champagne/50">Ajouter un administrateur</p>
        <p className="mb-4 font-serif text-[13px] text-white/50">
          Avec son email. S&apos;il n&apos;a pas encore de compte Curato, il est créé et il reçoit un email pour choisir son mot de passe.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@curatocollective.com"
          required
          className="w-full border border-white/15 bg-black/40 px-4 py-3 font-serif text-[14px] text-white outline-none focus:border-champagne/40"
        />
        <button
          type="submit"
          disabled={ocupado}
          className="mt-4 bg-champagne px-6 py-3 font-serif text-[11px] uppercase tracking-[0.2em] text-charcoal-deep transition-colors hover:bg-copper hover:text-white disabled:opacity-50"
        >
          {ocupado ? "…" : "Ajouter"}
        </button>
        {mensaje && <p className={`mt-4 font-serif text-[13px] ${mensaje.ok ? "text-emerald-400" : "text-red-300"}`}>{mensaje.texto}</p>}
      </form>
    </>
  );
}
