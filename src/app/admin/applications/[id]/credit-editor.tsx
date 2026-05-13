"use client";

import { useState } from "react";
import { PencilSimple, Check, X } from "@phosphor-icons/react";

export default function CreditEditor({ email, initialCredit }: { email: string; initialCredit: number }) {
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
      if (res.ok) {
        setCurrent(n);
        setEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Error al guardar");
      }
    } catch {
      setErr("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setValue(String(current));
    setErr("");
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40 mb-1">Crédito mensual</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="font-serif text-[16px] text-white/50">€</span>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
              className="w-24 font-serif text-[18px] font-light text-white bg-white/10 border border-champagne/40 px-2 py-1 focus:outline-none focus:border-champagne"
            />
            <button
              onClick={save}
              disabled={loading}
              className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
              title="Guardar"
            >
              <Check size={16} weight="bold" />
            </button>
            <button
              onClick={cancel}
              disabled={loading}
              className="text-white/30 hover:text-white transition-colors"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="font-serif text-[22px] font-light text-champagne">€{current}</p>
            <button
              onClick={() => setEditing(true)}
              className="text-white/20 hover:text-champagne transition-colors"
              title="Editar crédito"
            >
              <PencilSimple size={14} />
            </button>
          </div>
        )}
        {err && <p className="font-serif text-[11px] text-red-400 mt-1">{err}</p>}
      </div>
    </div>
  );
}
