"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";

export default function AdminLoginForm() {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
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
        <label className="block font-serif text-[11px] tracking-[0.25em] uppercase text-charcoal-deep/50 mb-3">
          Clave
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            autoFocus
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full px-5 py-4 pr-12 border border-black/15 bg-white/70 text-charcoal-deep font-serif text-[15px] font-light focus:outline-none focus:border-black/30 transition-colors placeholder:text-charcoal-deep/30"
            placeholder="••••••••••"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-deep/30 hover:text-charcoal-deep/60 transition-colors"
          >
            {show ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="font-serif text-[13px] font-light text-copper border-l border-copper/40 pl-4">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !pass}
        className="w-full font-serif text-[13px] tracking-widest uppercase text-white bg-charcoal-deep py-4 hover:bg-copper transition-all duration-300 disabled:opacity-40"
      >
        {loading ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
