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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-champagne/60 mb-3">
          Clave
        </label>
        <input
          type="password"
          autoFocus
          required
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full px-5 py-4 border border-white/10 bg-white/5 text-text-primary font-serif text-[15px] font-light focus:outline-none focus:border-champagne/40 transition-colors"
          placeholder="••••••••••"
        />
      </div>

      {error && (
        <p className="font-serif text-[13px] font-light text-copper/80 border-l border-copper/40 pl-4">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !pass}
        className="w-full font-serif text-[13px] tracking-widest uppercase text-charcoal-deep bg-champagne py-4 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
