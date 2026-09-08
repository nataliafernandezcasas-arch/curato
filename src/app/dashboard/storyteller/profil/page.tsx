"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
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

      <div className="mx-auto max-w-[900px] px-pagina py-seccion">
        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.navProfile}</p>
          <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary md:text-[32px]">
            {profile?.full_name ?? ""}
          </h1>
          {profile?.handle && (
            <p className="mt-etiqueta text-legende text-accent">@{profile.handle}</p>
          )}
        </Rise>

        {/* Las cifras dejan de ir encerradas entre dos filetes. Son filas, y
            cada una es la suya: el crédito en champagne porque es lo que la
            persona tiene, el resto en tinta porque solo cuentan lo hecho. */}
        <Rise index={1} className="mt-rango mb-seccion">
          <Row
            label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.profileCredit}</span>}
            aside={<span className="text-legende text-text-muted">{t.profileOf} {credit} €</span>}
            value={<span className="text-sous-titre text-accent">{credit - used} €</span>}
          />
          {credit > 0 && (
            <div className="my-fila h-px bg-border">
              <div
                className="h-full bg-accent transition-[width] duration-700 ease-curato"
                style={{ width: `${Math.min((used / credit) * 100, 100)}%` }}
              />
            </div>
          )}
          <Row
            label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.profileVisits}</span>}
            value={<span className="text-sous-titre text-text-primary">{done.length}</span>}
          />
          <Row
            label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.profileHouses}</span>}
            value={<span className="text-sous-titre text-text-primary">{houses.length}</span>}
          />
          <Row
            label={<span className="text-capitale uppercase tracking-capitale text-text-secondary">{t.profileStories}</span>}
            value={<span className="text-sous-titre text-text-primary">{stories}</span>}
          />
        </Rise>

        <Section title={t.profileHousesVisited}>
          {loading ? (
            <div className="space-y-bloque">
              {[1, 2].map((i) => (
                <div key={i} className="h-3 w-2/3 bg-border animate-pulse [animation-duration:1.6s]" />
              ))}
            </div>
          ) : houses.length === 0 ? (
            <div className="py-respiro text-center">
              <p className="text-corps text-text-secondary">{t.profileNoVisitsYet}</p>
            </div>
          ) : (
            <div>
              {done.map((v, i) => (
                <Rise key={v.id} index={i}>
                  <Row
                    name
                    label={<span className="text-corps text-text-primary">{v.venueName}</span>}
                    value={
                      <span className="text-legende tabular-nums text-brume">
                        {new Date(v.slotStart).toLocaleDateString(lang, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    }
                  />
                </Rise>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
