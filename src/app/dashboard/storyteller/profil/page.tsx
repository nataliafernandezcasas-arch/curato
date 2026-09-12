"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations } from "@/lib/i18n/translations";
import DashboardNav from "../../dashboard-nav";
import { Rise } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { Section } from "@/components/member/section";
import { STORYTELLER_LINKS } from "../nav-links";
import { Button } from "@/components/member/button";
import { Toast, useToast } from "@/components/member/toast";
import { DossierPane } from "../../business/storyteller-dossier";
import type { Dossier } from "@/lib/storyteller-dossier";
import { PortraitEditor, type Retrato } from "./portrait-editor";

type Perfil = { portraits: Retrato[]; bio: string; subjects: string[]; estilo: Retrato[]; inherited: string | null; dossier: Dossier | null };

const TP = {
  fr: {
    sectionTitle: "Ce que voient les maisons",
    noBio: "Vous n'avez pas encore écrit votre phrase. C'est la première chose qu'une maison lit de vous.",
    inheritedNote: "Pour l'instant, les maisons voient votre photo d'Instagram.",
    edit: "Modifier",
    preview: "Aperçu",
    previewNote: "Votre profil tel qu'une maison le voit.",
    saved: "Enregistré. C'est ce que voient maintenant les maisons.",
    quote: (s: string) => `« ${s} »`,
  },
  en: {
    sectionTitle: "What houses see",
    noBio: "You haven't written your sentence yet. It's the first thing a house reads about you.",
    inheritedNote: "For now, houses see your Instagram photo.",
    edit: "Edit",
    preview: "Preview",
    previewNote: "Your profile as a house sees it.",
    saved: "Saved. This is what houses now see.",
    quote: (s: string) => `“${s}”`,
  },
  es: {
    sectionTitle: "Lo que ven las maisons",
    noBio: "Todavía no has escrito tu frase. Es lo primero que una maison lee de ti.",
    inheritedNote: "Por ahora, las maisons ven tu foto de Instagram.",
    edit: "Editar",
    preview: "Vista previa",
    previewNote: "Tu perfil tal como lo ve una maison.",
    saved: "Guardado. Es lo que ven ahora las maisons.",
    quote: (s: string) => `«${s}»`,
  },
};

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
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [viendo, setViendo] = useState(false);
  const { aviso, mostrar, cerrar } = useToast();
  const tp = TP[lang] ?? TP.fr;

  // El retrato y la frase que ven las casas (16b), y el dossier tal como lo ven.
  const cargarPerfil = useCallback(async () => {
    const res = await fetch("/api/storyteller/perfil", { cache: "no-store" }).catch(() => null);
    if (res?.ok) setPerfil(await res.json());
  }, []);
  useEffect(() => {
    fetch("/api/storyteller/perfil", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPerfil(d))
      .catch(() => {});
  }, []);
  const cerrarEditor = useCallback(() => setEditando(false), []);
  const cerrarVista = useCallback(() => setViendo(false), []);

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
        {/* En claro, cada bloque va sobre vidrio, y el titular del perfil
            toma sauge: nada que decidir, algo cumplido. */}
        <Rise className="claro:vidrio claro:p-[26px]">
          <p className="text-capitale uppercase tracking-capitale text-accent">{t.navProfile}</p>
          <h1 className="mt-bloque text-titre uppercase tracking-titre text-text-primary md:text-[32px] claro:text-sauge-vif">
            {profile?.full_name ?? ""}
          </h1>
          {profile?.handle && (
            <p className="mt-etiqueta text-legende text-accent">@{profile.handle}</p>
          )}
        </Rise>

        {/* Lo primero que ve una casa de esta persona: su retrato y su frase.
            Se edita aquí mismo (16b) y se puede mirar desde fuera. */}
        {perfil && (
          <Rise index={1} className="mt-rango claro:vidrio claro:p-[26px]">
            <Section title={tp.sectionTitle}>
              <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-fila">
                {perfil.portraits[0]?.url || perfil.inherited ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={perfil.portraits[0]?.url || perfil.inherited || ""}
                    alt=""
                    className="aspect-[4/5] w-24 rounded-[14px] object-cover"
                  />
                ) : (
                  <span className="flex aspect-[4/5] w-24 items-center justify-center rounded-[14px] bg-surface-raised text-sous-titre text-accent">
                    {(profile?.full_name || profile?.handle || "·").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  {perfil.bio ? (
                    <p className="break-words text-champ italic text-text-primary">{tp.quote(perfil.bio)}</p>
                  ) : (
                    <p className="text-corps text-text-secondary">{tp.noBio}</p>
                  )}
                  {perfil.portraits.length === 0 && perfil.inherited && (
                    <p className="mt-bloque text-legende text-text-secondary">{tp.inheritedNote}</p>
                  )}
                </div>
              </div>
              <div className="mt-fila flex flex-wrap items-center gap-fila">
                <Button onClick={() => setEditando(true)}>{tp.edit}</Button>
                {perfil.dossier && (
                  <button
                    type="button"
                    onClick={() => setViendo(true)}
                    className="flex min-h-11 items-center text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
                  >
                    {tp.preview}
                  </button>
                )}
              </div>
            </Section>
          </Rise>
        )}

        {/* Las cifras dejan de ir encerradas entre dos filetes. Son filas, y
            cada una es la suya: el crédito en champagne porque es lo que la
            persona tiene, el resto en tinta porque solo cuentan lo hecho. */}
        <Rise index={1} className="mt-rango mb-seccion claro:vidrio claro:p-[26px]">
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

        <Section title={t.profileHousesVisited} className="claro:vidrio claro:p-[26px]">
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

      {editando && perfil && (
        <PortraitEditor
          lang={lang}
          initial={{
            portraits: perfil.portraits,
            bio: perfil.bio,
            subjects: perfil.subjects ?? [],
            estilo: perfil.estilo ?? [],
            inherited: perfil.inherited,
          }}
          onClose={cerrarEditor}
          onSaved={() => {
            setEditando(false);
            cargarPerfil();
            mostrar(tp.saved);
          }}
        />
      )}

      {/* Mirarse desde fuera: el mismo dossier que abre una maison. */}
      {viendo && perfil?.dossier && (
        <DossierPane
          dossier={perfil.dossier}
          lang={lang}
          onClose={cerrarVista}
          header={<p className="text-legende text-text-secondary">{tp.previewNote}</p>}
        />
      )}

      <Toast aviso={aviso} onClose={cerrar} />
    </div>
  );
}
