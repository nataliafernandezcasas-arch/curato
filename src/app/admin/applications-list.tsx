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
    pending: "text-champagne/70 border-champagne/20 bg-champagne/5",
    approved: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    rejected: "text-copper/70 border-copper/20 bg-copper/5",
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

  async function update(status: string) {
    setLoading(status);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, status }),
      });
      if (res.ok) onUpdate(app.id, status);
    } finally {
      setLoading(null);
    }
  }

  if (app.status === "approved") {
    return (
      <button onClick={() => update("rejected")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-copper/60 hover:text-copper transition-colors disabled:opacity-40">
        {loading === "rejected" ? "…" : "Rechazar"}
      </button>
    );
  }
  if (app.status === "rejected") {
    return (
      <button onClick={() => update("approved")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-champagne/60 hover:text-champagne transition-colors disabled:opacity-40">
        {loading === "approved" ? "…" : "Aceptar"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => update("approved")}
        disabled={!!loading}
        className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-4 py-1.5 hover:bg-copper hover:text-white transition-all duration-200 disabled:opacity-40"
      >
        {loading === "approved" ? "…" : "Aceptar"}
      </button>
      <button
        onClick={() => update("rejected")}
        disabled={!!loading}
        className="font-serif text-[11px] tracking-widest uppercase text-copper/70 border border-copper/20 px-4 py-1.5 hover:border-copper/50 hover:text-copper transition-all duration-200 disabled:opacity-40"
      >
        {loading === "rejected" ? "…" : "Rechazar"}
      </button>
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
      <div className="grid grid-cols-3 gap-px bg-white/5 mb-10">
        {[
          { label: "Total", value: counts.all },
          { label: "Pendientes", value: counts.pending },
          { label: "Aceptadas", value: counts.approved },
        ].map((s) => (
          <div key={s.label} className="bg-charcoal-deep px-8 py-6">
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-text-muted mb-2">{s.label}</p>
            <p className="font-serif text-3xl font-light text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-serif text-[12px] tracking-wider pb-3 transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-champagne border-champagne"
                : "text-text-muted border-transparent hover:text-text-secondary"
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
          <p className="font-serif text-[15px] font-light text-text-muted">No hay candidaturas aún.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {filtered.map((app) => (
            <div key={app.id} className="py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <h3 className="font-serif text-[17px] font-light text-text-primary">{app.name}</h3>
                  <span className="font-serif text-[10px] tracking-[0.25em] uppercase text-champagne/40 border border-champagne/15 px-2 py-0.5">
                    {app.type === "creator" ? "Creador" : "Casa"}
                  </span>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  <a href={`mailto:${app.email}`} className="font-serif text-[13px] font-light text-text-secondary hover:text-champagne transition-colors">
                    {app.email}
                  </a>
                  {app.instagram && (
                    <a
                      href={`https://instagram.com/${app.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-text-muted hover:text-champagne transition-colors"
                    >
                      {app.instagram.startsWith("@") ? app.instagram : `@${app.instagram}`}
                    </a>
                  )}
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-text-muted hover:text-champagne transition-colors"
                    >
                      {app.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                {app.message && (
                  <p className="font-serif text-[13px] font-light text-text-muted leading-relaxed max-w-2xl italic">
                    "{app.message}"
                  </p>
                )}

                <p className="font-serif text-[11px] text-text-muted/50">
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
