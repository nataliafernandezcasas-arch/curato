"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";

type App = { id: string; type: string; status: string; name: string };

export default function ApplicationActions({ app }: { app: App }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [followers, setFollowers] = useState("");
  const [status, setStatus] = useState(app.status);
  const router = useRouter();

  async function update(newStatus: string) {
    setLoading(newStatus);
    setErr(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          status: newStatus,
          followers: newStatus === "approved" && app.type === "creator" ? parseInt(followers) || 0 : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      } else {
        setErr(`Error ${res.status}: ${data.error || "desconocido"}`);
      }
    } catch (e) {
      setErr(`Error: ${e instanceof Error ? e.message : "conexión"}`);
    } finally {
      setLoading(null);
    }
  }

  if (status === "deleted") {
    return (
      <div className="border border-white/10 p-6 flex items-center gap-4">
        <p className="font-serif text-[13px] font-light text-white/40 flex-1">Esta candidatura ha sido borrada.</p>
        <button onClick={() => update("pending")} disabled={!!loading} className="font-serif text-[12px] tracking-wider text-white/50 hover:text-white transition-colors disabled:opacity-40">
          {loading === "pending" ? "…" : "Restaurar"}
        </button>
        {err && <p className="font-serif text-[11px] text-red-400">{err}</p>}
      </div>
    );
  }

  return (
    <div className="border border-white/10 p-6 space-y-4">
      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/30">Acciones</p>

      {app.type === "creator" && (
        <input
          type="number"
          value={followers}
          onChange={(e) => setFollowers(e.target.value)}
          placeholder="Nº de seguidores (para aceptar)"
          className="w-full font-serif text-[13px] border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-champagne/40"
        />
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {status !== "approved" && (
          <button
            onClick={() => update("approved")}
            disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-emerald-400 transition-all duration-200 disabled:opacity-40"
          >
            {loading === "approved" ? "…" : "Aceptar"}
          </button>
        )}
        {status !== "rejected" && (
          <button
            onClick={() => update("rejected")}
            disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-white/50 border border-white/20 px-6 py-3 hover:border-red-400 hover:text-red-400 transition-all duration-200 disabled:opacity-40"
          >
            {loading === "rejected" ? "…" : "Rechazar"}
          </button>
        )}
        {status !== "pending" && (
          <button
            onClick={() => update("pending")}
            disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-white/30 border border-white/10 px-6 py-3 hover:border-white/30 hover:text-white/60 transition-all duration-200 disabled:opacity-40"
          >
            {loading === "pending" ? "…" : "Marcar pendiente"}
          </button>
        )}
        <button
          onClick={() => update("deleted")}
          disabled={!!loading}
          className="ml-auto text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
          title="Borrar"
        >
          {loading === "deleted" ? <span className="font-serif text-[11px]">…</span> : <Trash size={16} />}
        </button>
      </div>

      {err && <p className="font-serif text-[12px] text-red-400">{err}</p>}
    </div>
  );
}
