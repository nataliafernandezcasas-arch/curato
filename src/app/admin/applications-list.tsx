"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  type: string;
  name: string;
  email: string;
  instagram: string | null;
  website: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-amber-700 border-amber-300 bg-amber-50",
    approved: "text-emerald-700 border-emerald-300 bg-emerald-50",
    rejected: "text-red-600 border-red-300 bg-red-50",
  };
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aceptada",
    rejected: "Rechazada",
  };
  return (
    <span className={`inline-block font-serif text-[10px] tracking-[0.25em] uppercase border px-2.5 py-1 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ActionButtons({ app, onUpdate }: { app: Application; onUpdate: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function update(status: string) {
    setLoading(status);
    setErr(null);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, status }),
      });
      if (res.ok) {
        onUpdate(app.id, status);
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Error al actualizar");
      }
    } catch {
      setErr("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  if (app.status === "approved") {
    return (
      <div className="space-y-1">
        <button onClick={() => update("rejected")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-red-500 hover:text-red-700 transition-colors disabled:opacity-40">
          {loading === "rejected" ? "…" : "Rechazar"}
        </button>
        {err && <p className="font-serif text-[10px] text-red-500">{err}</p>}
      </div>
    );
  }
  if (app.status === "rejected") {
    return (
      <div className="space-y-1">
        <button onClick={() => update("approved")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-40">
          {loading === "approved" ? "…" : "Aceptar"}
        </button>
        {err && <p className="font-serif text-[10px] text-red-500">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => update("approved")}
          disabled={!!loading}
          className="font-serif text-[11px] tracking-widest uppercase text-white bg-charcoal-deep px-4 py-2 hover:bg-emerald-700 transition-all duration-200 disabled:opacity-40"
        >
          {loading === "approved" ? "…" : "Aceptar"}
        </button>
        <button
          onClick={() => update("rejected")}
          disabled={!!loading}
          className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep/60 border border-black/20 px-4 py-2 hover:border-red-400 hover:text-red-600 transition-all duration-200 disabled:opacity-40"
        >
          {loading === "rejected" ? "…" : "Rechazar"}
        </button>
      </div>
      {err && <p className="font-serif text-[10px] text-red-500">{err}</p>}
    </div>
  );
}

export default function ApplicationsList({ initial }: { initial: Application[] }) {
  const [apps, setApps] = useState(initial);
  const [tab, setTab] = useState<"all" | "creator" | "business">("all");
  const router = useRouter();

  function handleUpdate(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    router.refresh();
  }

  const filtered = tab === "all" ? apps : apps.filter((a) => a.type === tab);
  const counts = {
    all: apps.length,
    creator: apps.filter((a) => a.type === "creator").length,
    business: apps.filter((a) => a.type === "business").length,
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
  };

  const tabs = [
    { key: "all", label: "Todas", count: counts.all },
    { key: "creator", label: "Creadores", count: counts.creator },
    { key: "business", label: "Casas", count: counts.business },
  ] as const;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total", value: counts.all },
          { label: "Pendientes", value: counts.pending },
          { label: "Aceptadas", value: counts.approved },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 backdrop-blur-sm border border-black/8 px-8 py-6">
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-charcoal-deep/40 mb-2">{s.label}</p>
            <p className="font-serif text-3xl font-light text-charcoal-deep">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-black/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-serif text-[12px] tracking-wider pb-3 transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-charcoal-deep border-charcoal-deep"
                : "text-charcoal-deep/40 border-transparent hover:text-charcoal-deep/70"
            }`}
          >
            {t.label}
            <span className="ml-2 text-[10px] opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-[15px] font-light text-charcoal-deep/40">No hay candidaturas aún.</p>
        </div>
      ) : (
        <div className="divide-y divide-black/8">
          {filtered.map((app) => (
            <div key={app.id} className="py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <h3 className="font-serif text-[17px] font-light text-charcoal-deep">{app.name}</h3>
                  <span className="font-serif text-[10px] tracking-[0.25em] uppercase text-charcoal-deep/40 border border-black/15 px-2 py-0.5">
                    {app.type === "creator" ? "Creador" : "Casa"}
                  </span>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  <a href={`mailto:${app.email}`} className="font-serif text-[13px] font-light text-charcoal-deep/60 hover:text-charcoal-deep transition-colors">
                    {app.email}
                  </a>
                  {app.instagram && (
                    <a
                      href={`https://instagram.com/${app.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-charcoal-deep/40 hover:text-charcoal-deep transition-colors"
                    >
                      {app.instagram.startsWith("@") ? app.instagram : `@${app.instagram}`}
                    </a>
                  )}
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-charcoal-deep/40 hover:text-charcoal-deep transition-colors"
                    >
                      {app.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                {app.message && (
                  <p className="font-serif text-[13px] font-light text-charcoal-deep/50 leading-relaxed max-w-2xl italic">
                    "{app.message}"
                  </p>
                )}

                <p className="font-serif text-[11px] text-charcoal-deep/30">
                  {new Date(app.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex md:justify-end">
                <ActionButtons app={app} onUpdate={handleUpdate} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
