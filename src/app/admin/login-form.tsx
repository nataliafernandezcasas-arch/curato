"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Clave incorrecta.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-2xl bg-surface-raised p-6 space-y-4">
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-2 uppercase tracking-[0.12em]">Clave</label>
        <input
          type="password"
          autoFocus
          required
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          placeholder="••••••••••"
        />
      </div>

      {error && (
        <div className="bg-midi-orange/8 border border-midi-orange/20 text-midi-orange text-sm px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !pass}
        className="w-full bg-text-primary text-white text-[13px] font-semibold py-3 rounded-lg hover:bg-accent transition-all duration-300 disabled:opacity-50 active:scale-[0.97]"
      >
        {loading ? "Verificando..." : "Entrar"}
      </button>
    </form>
  );
}
