"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash, PencilSimple, Check, X } from "@phosphor-icons/react";

type App = { id: string; type: string; status: string; name: string };

function CreditEditorInline({ email, initialCredit }: { email: string; initialCredit: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initialCredit));
  const [current, setCurrent] = useState(initialCredit);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    const n = parseInt(value);
    if (isNaN(n) || n < 0) { setErr("Valor inválido"); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, monthly_credit_cop: n }),
      });
      if (res.ok) { setCurrent(n); setEditing(false); }
      else { const d = await res.json().catch(() => ({})); setErr(d.error || "Error al guardar"); }
    } catch { setErr("Error de conexión"); }
    finally { setLoading(false); }
  }

  function cancel() { setValue(String(current)); setErr(""); setEditing(false); }

  return (
    <div>
      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/30 mb-3">Crédito mensual</p>
      {editing ? (
        <div className="flex items-center gap-3">
          <span className="font-serif text-[20px] text-white/40">€</span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            autoFocus
            className="w-28 font-serif text-[22px] font-light text-white bg-white/10 border border-champagne/50 px-3 py-1.5 focus:outline-none focus:border-champagne"
          />
          <button onClick={save} disabled={loading} title="Guardar" className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40">
            <Check size={18} weight="bold" />
          </button>
          <button onClick={cancel} disabled={loading} title="Cancelar" className="text-white/25 hover:text-white transition-colors">
            <X size={18} />
          </button>
          {err && <p className="font-serif text-[11px] text-red-400">{err}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="font-serif text-[28px] font-light text-champagne">€{current}</p>
          <button onClick={() => setEditing(true)} title="Editar" className="text-white/20 hover:text-champagne transition-colors">
            <PencilSimple size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ApplicationActions({ app, creatorEmail, initialCredit }: {
  app: App;
  creatorEmail?: string;
  initialCredit?: number;
}) {
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
      if (res.ok) { setStatus(newStatus); router.refresh(); }
      else setErr(`Error ${res.status}: ${data.error || "desconocido"}`);
    } catch (e) {
      setErr(`Error: ${e instanceof Error ? e.message : "conexión"}`);
    } finally { setLoading(null); }
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

  // Approved: show credit editor as the main action
  if (status === "approved" && app.type === "creator" && creatorEmail != null) {
    return (
      <div className="border border-white/10 p-6 space-y-6">
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/30">Acciones</p>
        <CreditEditorInline email={creatorEmail} initialCredit={initialCredit ?? 0} />
        <div className="flex items-center gap-4 pt-2 border-t border-white/8">
          <button onClick={() => update("rejected")} disabled={!!loading}
            className="font-serif text-[11px] tracking-wider text-white/30 hover:text-red-400 transition-colors disabled:opacity-40">
            {loading === "rejected" ? "…" : "Rechazar"}
          </button>
          <button onClick={() => update("deleted")} disabled={!!loading} title="Borrar"
            className="ml-auto text-white/15 hover:text-red-400 transition-colors disabled:opacity-40">
            {loading === "deleted" ? <span className="font-serif text-[11px]">…</span> : <Trash size={15} />}
          </button>
        </div>
        {err && <p className="font-serif text-[12px] text-red-400">{err}</p>}
      </div>
    );
  }

  // Pending / rejected: standard actions
  return (
    <div className="border border-white/10 p-6 space-y-4">
      <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-white/30">Acciones</p>

      {app.type === "creator" && status !== "approved" && (
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
          <button onClick={() => update("approved")} disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-emerald-400 transition-all duration-200 disabled:opacity-40">
            {loading === "approved" ? "…" : "Aceptar"}
          </button>
        )}
        {status !== "rejected" && (
          <button onClick={() => update("rejected")} disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-white/50 border border-white/20 px-6 py-3 hover:border-red-400 hover:text-red-400 transition-all duration-200 disabled:opacity-40">
            {loading === "rejected" ? "…" : "Rechazar"}
          </button>
        )}
        {status !== "pending" && (
          <button onClick={() => update("pending")} disabled={!!loading}
            className="font-serif text-[12px] tracking-widest uppercase text-white/30 border border-white/10 px-6 py-3 hover:border-white/30 hover:text-white/60 transition-all duration-200 disabled:opacity-40">
            {loading === "pending" ? "…" : "Marcar pendiente"}
          </button>
        )}
        <button onClick={() => update("deleted")} disabled={!!loading} title="Borrar"
          className="ml-auto text-white/20 hover:text-red-400 transition-colors disabled:opacity-40">
          {loading === "deleted" ? <span className="font-serif text-[11px]">…</span> : <Trash size={16} />}
        </button>
      </div>
      {err && <p className="font-serif text-[12px] text-red-400">{err}</p>}
    </div>
  );
}
