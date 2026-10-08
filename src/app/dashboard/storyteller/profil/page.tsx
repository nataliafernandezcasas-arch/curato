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
import { DossierInline } from "../../business/storyteller-dossier";
import type { Dossier } from "@/lib/storyteller-dossier";
import { PortraitEditor, type Retrato } from "./portrait-editor";

type Perfil = { portraits: Retrato[]; bio: string; subjects: string[]; estilo: Retrato[]; inherited: string | null; dossier: Dossier | null };

const TP = {
  fr: {
    seen: "Ce que voient les maisons",
    seenNote: "Votre profil tel qu'une maison l'ouvre. Ce que vous modifiez, elles le voient aussitôt.",
    edit: "Modifier mon profil",
    unavailable: "Votre profil ne s'est pas chargé. Réessayez dans un instant.",
    saved: "Enregistré. C'est ce que voient maintenant les maisons.",
    figures: "Vos chiffres",
    reachAccounts: "Comptes atteints",
    reachViews: "Vues",
    reachNote: (n: number) =>
      n > 0 ? `Il manque la portée de ${n} visite${n > 1 ? "s" : ""} : déclarez-la dans Mes visites.` : "",
  },
  en: {
    seen: "What houses see",
    seenNote: "Your profile as a house opens it. Whatever you change, they see straight away.",
    edit: "Edit my profile",
    unavailable: "Your profile didn't load. Try again in a moment.",
    saved: "Saved. This is what houses now see.",
    figures: "Your figures",
    reachAccounts: "Accounts reached",
    reachViews: "Views",
    reachNote: (n: number) =>
      n > 0 ? `The reach of ${n} visit${n > 1 ? "s is" : " is"} missing: declare it in My visits.` : "",
  },
  es: {
    seen: "Lo que ven las maisons",
    seenNote: "Tu perfil tal como lo abre una maison. Lo que cambies, lo ven al momento.",
    edit: "Editar mi perfil",
    unavailable: "Tu perfil no se cargó. Vuelve a intentarlo en un momento.",
    saved: "Guardado. Es lo que ven ahora las maisons.",
    figures: "Tus cifras",
    reachAccounts: "Cuentas alcanzadas",
    reachViews: "Vistas",
    reachNote: (n: number) =>
      n > 0 ? `Falta el alcance de ${n} visita${n > 1 ? "s" : ""}: declárala en Mis visitas.` : "",
  },
};

type Reach = { views: number | null; accounts: number | null; interactions: number | null };

type Visita = {
  id: string;
  maison: string;
  slotStart: string;
  status: string;
  photos: string[];
  reach: Reach | null;
};

type Profile = {
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
};

/**
 * Mon profil: una sola página. Arriba, el perfil tal como lo ve una casa, que
 * es lo que importa, con el botón para cambiarlo; debajo, lo que ha hecho en el
 * club. Antes eran dos cosas, un resumen y una vista previa escondida detrás
 * de un botón, y nadie veía de verdad lo que veían las casas.
 */
export default function ProfilPage() {
  const { lang } = useLang();
  const t = translations[lang].dashboard;
  const tp = TP[lang] ?? TP.fr;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilFallo, setPerfilFallo] = useState(false);
  const [editando, setEditando] = useState(false);
  const { aviso, mostrar, cerrar } = useToast();

  const cargarPerfil = useCallback(async () => {
    const res = await fetch("/api/storyteller/perfil", { cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      setPerfil(await res.json());
      setPerfilFallo(false);
    } else setPerfilFallo(true);
  }, []);
  useEffect(() => {
    fetch("/api/storyteller/perfil", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Perfil) => setPerfil(d))
      .catch(() => setPerfilFallo(true));
  }, []);
  const cerrarEditor = useCallback(() => setEditando(false), []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase
          .from("creators")
          .select("monthly_credit_cop, credit_used_cop")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
        // Lo gastado sale de las visitas del mes (src/lib/credito.ts).
        const credito = await fetch("/api/storyteller/credito", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        setProfile(
          credito ? { monthly_credit_cop: credito.mensual, credit_used_cop: credito.usado } : (data as Profile | null)
        );
      }
      const res = await fetch("/api/reservations/visit", { cache: "no-store" });
      if (res.ok) setVisits((await res.json()).visits ?? []);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const credit = profile?.monthly_credit_cop ?? 0;
  const used = profile?.credit_used_cop ?? 0;
  const hechas = visits.filter((v) => v.status === "completed");
  const casas = Array.from(new Set(hechas.map((v) => v.maison))).filter(Boolean);
  // Cada captura subida es una story publicada: es lo que se entrega por visita.
  const stories = hechas.reduce((n, v) => n + v.photos.length, 0);
  const cuentas = hechas.reduce((n, v) => n + (v.reach?.accounts ?? 0), 0);
  const vistas = hechas.reduce((n, v) => n + (v.reach?.views ?? 0), 0);
  const sinAlcance = hechas.filter((v) => !v.reach).length;
  const cifra = (n: number) => n.toLocaleString(lang);

  const etiqueta = (texto: string) => (
    <span className="text-capitale uppercase tracking-capitale text-text-secondary">{texto}</span>
  );

  return (
    <div className="min-h-[100dvh]">
      <DashboardNav
        links={STORYTELLER_LINKS(t, "profile")}
        settingsHref="/dashboard/storyteller/reglages"
        settingsLabel={t.navSettings}
      />

      <div className="mx-auto max-w-[560px] px-pagina py-seccion">
        <Rise>
          <p className="text-capitale uppercase tracking-capitale text-accent">{tp.seen}</p>
          <p className="mt-bloque max-w-[46ch] text-legende text-text-secondary">{tp.seenNote}</p>
          {perfil && (
            <div className="mt-fila">
              <Button onClick={() => setEditando(true)}>{tp.edit}</Button>
            </div>
          )}
        </Rise>

        {/* El perfil, en el sitio, idéntico al dossier que abre una casa. */}
        <Rise index={1} className="mt-rango">
          {perfil?.dossier ? (
            <DossierInline dossier={perfil.dossier} lang={lang} />
          ) : perfilFallo || (perfil && !perfil.dossier) ? (
            <p className="text-corps text-text-secondary">{tp.unavailable}</p>
          ) : (
            <div aria-hidden className="space-y-fila">
              <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-surface-raised [animation-duration:1.6s]" />
              <div className="h-12 animate-pulse rounded-[20px] bg-surface-raised [animation-duration:1.6s]" />
            </div>
          )}
        </Rise>

        {/* Lo suyo, que la casa no ve así: el crédito, y lo que ha hecho en el
            club contado entero, con la portée que declaró visita a visita. */}
        <Section title={tp.figures} className="mt-seccion">
          <Row
            label={etiqueta(t.profileCredit)}
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
          <Row label={etiqueta(t.profileVisits)} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(hechas.length)}</span>} />
          <Row label={etiqueta(t.profileHouses)} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(casas.length)}</span>} />
          <Row label={etiqueta(t.profileStories)} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(stories)}</span>} />
          <Row label={etiqueta(tp.reachAccounts)} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(cuentas)}</span>} />
          <Row label={etiqueta(tp.reachViews)} value={<span className="text-sous-titre tabular-nums text-text-primary">{cifra(vistas)}</span>} />
          {sinAlcance > 0 && <p className="mt-bloque text-legende text-text-muted">{tp.reachNote(sinAlcance)}</p>}
        </Section>

        <Section title={t.profileHousesVisited}>
          {loading ? (
            <div className="space-y-bloque">
              {[1, 2].map((i) => (
                <div key={i} className="h-3 w-2/3 bg-border animate-pulse [animation-duration:1.6s]" />
              ))}
            </div>
          ) : hechas.length === 0 ? (
            <div className="py-respiro text-center">
              <p className="text-corps text-text-secondary">{t.profileNoVisitsYet}</p>
            </div>
          ) : (
            <div>
              {hechas.map((v, i) => (
                <Rise key={v.id} index={i}>
                  <Row
                    name
                    label={<span className="text-corps text-text-primary">{v.maison}</span>}
                    aside={
                      v.reach?.accounts != null ? (
                        <span className="text-legende tabular-nums text-text-muted">
                          {cifra(v.reach.accounts)} {tp.reachAccounts.toLowerCase()}
                        </span>
                      ) : undefined
                    }
                    value={
                      <span className="text-legende tabular-nums text-brume">
                        {new Date(v.slotStart).toLocaleDateString(lang, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "Europe/Paris",
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

      <Toast aviso={aviso} onClose={cerrar} />
    </div>
  );
}
