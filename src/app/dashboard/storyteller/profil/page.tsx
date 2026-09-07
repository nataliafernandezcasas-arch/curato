"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { STORYTELLER_LINKS } from "../nav-links";

type Reservation = {
  id: string;
  venueName: string;
  slotStart: string;
  status: string;
  photos: string[];
};

type Profile = {
  full_name: string | null;
  handle: string | null;
  followers: number | null;
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
};

export default function ProfilPage() {
  const { lang } = useLang();
  const t = translations[lang].dashboard;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase
          .from("creators")
          .select("full_name, handle, followers, monthly_credit_cop, credit_used_cop")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
        setProfile(data as Profile | null);
      }
      const res = await fetch("/api/reservations/visit", { cache: "no-store" });
      if (res.ok) setVisits((await res.json()).reservations ?? []);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const credit = profile?.monthly_credit_cop ?? 0;
  const used = profile?.credit_used_cop ?? 0;
  const done = visits.filter((v) => v.status === "completed");
  const houses = Array.from(new Set(done.map((v) => v.venueName))).filter(Boolean);
  const stories = done.length * 2; // Two per visit, the published commitment.

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(t, "profile")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={t.navSettings}
      />

      <div className="mx-auto max-w-[900px] px-5 py-10">
        <p className="mb-3 font-serif text-[11px] uppercase tracking-[0.35em] text-champagne/60">
          {t.navProfile}
        </p>
        <h1 className="mb-2 font-serif text-[32px] font-light uppercase leading-none tracking-[0.12em] text-white">
          {profile?.full_name ?? ""}
        </h1>
        {profile?.handle && (
          <p className="mb-10 font-serif text-[14px] font-light tracking-wider text-champagne/70">
            @{profile.handle}
          </p>
        )}

        <div className="mb-12 grid grid-cols-2 gap-y-8 border-y border-white/10 py-8 sm:grid-cols-4">
          {[
            { k: t.profileCredit, v: `€${credit - used}`, s: `${t.profileOf} €${credit}` },
            { k: t.profileVisits, v: String(done.length) },
            { k: t.profileHouses, v: String(houses.length) },
            { k: t.profileStories, v: String(stories) },
          ].map(({ k, v, s }) => (
            <div key={k}>
              <p className="mb-2 font-serif text-[10px] uppercase tracking-[0.25em] text-white/60">{k}</p>
              <p className="font-serif text-[26px] font-light text-champagne">{v}</p>
              {s && <p className="mt-1 font-serif text-[12px] font-light text-white/55">{s}</p>}
            </div>
          ))}
        </div>

        <p className="mb-5 font-serif text-[11px] uppercase tracking-[0.3em] text-champagne/60">
          {t.profileHousesVisited}
        </p>
        {loading ? (
          <p className="font-serif text-[14px] font-light text-white/55">…</p>
        ) : houses.length === 0 ? (
          <p className="font-serif text-[14px] font-light italic text-white/55">
            {t.profileNoVisitsYet}
          </p>
        ) : (
          <div className="flex flex-col">
            {done.map((v) => (
              <div
                key={v.id}
                className="flex items-baseline justify-between border-b border-white/10 py-4"
              >
                <span className="font-serif text-[15px] font-light text-white/85">{v.venueName}</span>
                <span className="font-serif text-[12px] tracking-wider text-white/55">
                  {new Date(v.slotStart).toLocaleDateString(lang, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
