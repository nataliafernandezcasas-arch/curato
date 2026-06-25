"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import { suggestedBudgetEUR } from "@/lib/credits";

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

function StatusBadge({ status, t }: { status: string; t: { [K in keyof typeof translations.fr.admin]: string } }) {
  const styles: Record<string, string> = {
    pending: "text-amber-300 border-amber-400/40 bg-amber-400/10",
    approved: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    rejected: "text-red-400 border-red-400/40 bg-red-400/10",
    deleted: "text-white/25 border-white/10 bg-white/5",
  };
  const labels: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
    deleted: t.statusDeleted,
  };
  return (
    <span className={`inline-block font-serif text-[10px] tracking-[0.25em] uppercase border px-2.5 py-1 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ActionButtons({ app, onUpdate, t }: { app: Application; onUpdate: (id: string, status: string) => void; t: { [K in keyof typeof translations.fr.admin]: string } }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [followers, setFollowers] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetTouched, setBudgetTouched] = useState(false);

  // Typing the follower count auto-fills the suggested budget, until the admin
  // edits the budget by hand (then we stop overwriting it).
  function onFollowersChange(v: string) {
    setFollowers(v);
    if (!budgetTouched) {
      const n = parseInt(v) || 0;
      setBudget(n > 0 ? String(suggestedBudgetEUR(n)) : "");
    }
  }

  async function update(status: string) {
    setLoading(status);
    setErr(null);
    try {
      const isCreatorApprove = status === "approved" && app.type === "creator";
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          status,
          followers: isCreatorApprove ? parseInt(followers) || 0 : undefined,
          budget: isCreatorApprove ? parseInt(budget) || 0 : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onUpdate(app.id, status);
      } else {
        setErr(`Error ${res.status}: ${data.error || "desconocido"}`);
      }
    } catch (e) {
      setErr(`Error: ${e instanceof Error ? e.message : "conexión"}`);
    } finally {
      setLoading(null);
    }
  }

  if (app.status === "deleted") {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => update("pending")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-white/40 hover:text-white transition-colors disabled:opacity-40">
          {loading === "pending" ? "…" : t.actionRestore}
        </button>
        {err && <p className="font-serif text-[10px] text-red-400">{err}</p>}
      </div>
    );
  }
  if (app.status === "approved") {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => update("rejected")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-red-400 hover:text-red-300 transition-colors disabled:opacity-40">
          {loading === "rejected" ? "…" : t.actionReject}
        </button>
        <button onClick={() => update("deleted")} disabled={!!loading} title="Borrar" className="text-white/25 hover:text-red-400 transition-colors disabled:opacity-40">
          {loading === "deleted" ? <span className="text-[10px]">…</span> : <Trash size={14} />}
        </button>
        {err && <p className="font-serif text-[10px] text-red-400">{err}</p>}
      </div>
    );
  }
  if (app.status === "rejected") {
    return (
      <div className="space-y-2">
        {app.type === "creator" && (
          <>
            <input
              type="number"
              value={followers}
              onChange={(e) => onFollowersChange(e.target.value)}
              placeholder={t.followersPlaceholderShort}
              className="w-full font-serif text-[11px] border border-white/20 bg-white/10 px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
            <input
              type="number"
              value={budget}
              onChange={(e) => { setBudget(e.target.value); setBudgetTouched(true); }}
              placeholder="Budget € / mois"
              className="w-full font-serif text-[11px] border border-white/20 bg-white/10 px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
            />
          </>
        )}
        <div className="flex items-center gap-3">
          <button onClick={() => update("approved")} disabled={!!loading} className="font-serif text-[11px] tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40">
            {loading === "approved" ? "…" : t.actionAccept}
          </button>
          <button onClick={() => update("deleted")} disabled={!!loading} title="Borrar" className="text-white/25 hover:text-red-400 transition-colors disabled:opacity-40">
            {loading === "deleted" ? <span className="text-[10px]">…</span> : <Trash size={14} />}
          </button>
        </div>
        {err && <p className="font-serif text-[10px] text-red-400">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {app.type === "creator" && (
        <>
          <input
            type="number"
            value={followers}
            onChange={(e) => onFollowersChange(e.target.value)}
            placeholder={t.followersPlaceholder}
            className="w-full font-serif text-[11px] border border-white/20 bg-white/10 px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
          />
          <input
            type="number"
            value={budget}
            onChange={(e) => { setBudget(e.target.value); setBudgetTouched(true); }}
            placeholder="Budget € / mois"
            className="w-full font-serif text-[11px] border border-white/20 bg-white/10 px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
          />
        </>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => update("approved")}
          disabled={!!loading}
          className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-4 py-2 hover:bg-emerald-400 transition-all duration-200 disabled:opacity-40"
        >
          {loading === "approved" ? "…" : t.actionAccept}
        </button>
        <button
          onClick={() => update("rejected")}
          disabled={!!loading}
          className="font-serif text-[11px] tracking-widest uppercase text-white/50 border border-white/20 px-4 py-2 hover:border-red-400 hover:text-red-400 transition-all duration-200 disabled:opacity-40"
        >
          {loading === "rejected" ? "…" : t.actionReject}
        </button>
        <button
          onClick={() => update("deleted")}
          disabled={!!loading}
          title="Borrar"
          className="text-white/25 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {loading === "deleted" ? <span className="text-[10px]">…</span> : <Trash size={14} />}
        </button>
      </div>
      {err && <p className="font-serif text-[10px] text-red-400">{err}</p>}
    </div>
  );
}

export default function ApplicationsList({ initial }: { initial: Application[] }) {
  const [apps, setApps] = useState(initial);
  const [tab, setTab] = useState<"all" | "creator" | "business" | "deleted">("all");
  const router = useRouter();
  const { lang } = useLang();
  const t = translations[lang].admin;

  function handleUpdate(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    router.refresh();
  }

  const active = apps.filter((a) => a.status !== "deleted");
  const deleted = apps.filter((a) => a.status === "deleted");

  const filtered = (
    tab === "deleted" ? deleted :
    tab === "all" ? active :
    active.filter((a) => a.type === tab)
  ).sort((a, b) => {
    // Pending first
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    // Then most recent first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts = {
    all: active.length,
    creator: active.filter((a) => a.type === "creator").length,
    business: active.filter((a) => a.type === "business").length,
    pending: active.filter((a) => a.status === "pending").length,
    approved: active.filter((a) => a.status === "approved").length,
    deleted: deleted.length,
  };

  const tabs = [
    { key: "all", label: t.tabAll, count: counts.all },
    { key: "creator", label: t.tabCreators, count: counts.creator },
    { key: "business", label: t.tabHouses, count: counts.business },
    { key: "deleted", label: t.tabDeleted, count: counts.deleted },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-4">
          {t.pageLabel}
        </p>
        <h1 className="font-serif text-4xl font-light tracking-[0.28em] uppercase text-white">
          {t.pageTitle}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { key: "total", label: t.statTotal, value: counts.all },
          { key: "pending", label: t.statPending, value: counts.pending },
          { key: "approved", label: t.statApproved, value: counts.approved },
        ].map((s) => (
          <div key={s.key} className="bg-white/8 backdrop-blur-sm border border-white/10 px-8 py-6">
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/50 mb-2">{s.label}</p>
            <p className="font-serif text-3xl font-light text-white">{s.value}</p>
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
                ? "text-white border-champagne"
                : "text-white/35 border-transparent hover:text-white/60"
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
          <p className="font-serif text-[15px] font-light text-white/40">{t.empty}</p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {filtered.map((app) => (
            <div key={app.id} className="py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href={`/admin/applications/${app.id}`} className="font-serif text-[17px] font-light text-white hover:text-champagne transition-colors">{app.name}</Link>
                  <span className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/40 border border-white/15 px-2 py-0.5">
                    {app.type === "creator" ? t.typeCreator : t.typeHouse}
                  </span>
                  <StatusBadge status={app.status} t={t} />
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  <a href={`mailto:${app.email}`} className="font-serif text-[13px] font-light text-white/60 hover:text-white transition-colors">
                    {app.email}
                  </a>
                  {app.instagram && (
                    <a
                      href={`https://instagram.com/${app.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-white/40 hover:text-white transition-colors"
                    >
                      {app.instagram.startsWith("@") ? app.instagram : `@${app.instagram}`}
                    </a>
                  )}
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[13px] font-light text-white/40 hover:text-white transition-colors"
                    >
                      {app.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>

                {app.message && (
                  <p className="font-serif text-[13px] font-light text-white/50 leading-relaxed max-w-2xl italic">
                    "{app.message}"
                  </p>
                )}

                <p className="font-serif text-[11px] text-white/30">
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
                <ActionButtons app={app} onUpdate={handleUpdate} t={t} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
