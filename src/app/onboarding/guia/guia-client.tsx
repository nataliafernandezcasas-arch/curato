"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Camera, MagnifyingGlass, QrCode, type Icon } from "@/components/member/iconos";
import FloralBackdrop from "@/app/dashboard/floral-backdrop";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { Button } from "@/components/member/button";
import ConnectInstagram from "@/app/dashboard/storyteller/connect-instagram";
import { PortraitEditor, type Retrato } from "@/app/dashboard/storyteller/profil/portrait-editor";

type Pantalla = { icono: Icon; titulo: string; texto: string };

const TEXTOS: Record<
  Lang,
  {
    kicker: string;
    pantallas: Pantalla[];
    siguiente: string;
    saltar: string;
    despues: string;
    igTitulo: string;
    igTexto: string;
    perfilTitulo: string;
    perfilTexto: string;
    perfilBoton: string;
    entrar: string;
    error: string;
  }
> = {
  fr: {
    kicker: "Bienvenue chez Curato",
    pantallas: [
      { icono: MagnifyingGlass, titulo: "Choisissez une adresse", texto: "Dans Adresses, parcourez les maisons de Curato. Chaque fiche montre son offre : ce que la visite coûte sur votre crédit du mois." },
      { icono: CalendarCheck, titulo: "Demandez une visite", texto: "Choisissez le jour et l'heure. La maison accepte votre demande, et la veille vous confirmez votre venue dans Mes visites." },
      { icono: QrCode, titulo: "Le jour de la visite", texto: "En arrivant, montrez votre code de visite : la maison le scanne. Vous le trouvez dans Mes visites, et nous vous l'envoyons une heure avant." },
      { icono: Camera, titulo: "Racontez-la", texto: "Dans les 24 heures, publiez au moins deux stories. Ajoutez-les dans Mes visites avec leur portée : la visite est validée et vous pouvez réserver la suivante." },
    ],
    siguiente: "Suivant",
    saltar: "Passer",
    despues: "Plus tard",
    igTitulo: "Connectez votre Instagram",
    igTexto: "Les maisons voient vos abonnés et vos dernières publications. C'est ce qui leur permet d'accepter votre visite.",
    perfilTitulo: "Créez votre profil",
    perfilTexto: "Choisissez vos photos et quelques mots sur vous : c'est ce que voient les maisons quand vous demandez une visite.",
    perfilBoton: "Créer mon profil",
    entrar: "Découvrir les adresses",
    error: "Une erreur est survenue. Réessayez.",
  },
  en: {
    kicker: "Welcome to Curato",
    pantallas: [
      { icono: MagnifyingGlass, titulo: "Choose an address", texto: "In Addresses, browse Curato's houses. Each one shows its offer: what the visit costs from your monthly credit." },
      { icono: CalendarCheck, titulo: "Request a visit", texto: "Pick the day and time. The house accepts your request, and the day before you confirm you're coming in My visits." },
      { icono: QrCode, titulo: "On the day", texto: "When you arrive, show your visit code: the house scans it. You'll find it in My visits, and we send it to you an hour before." },
      { icono: Camera, titulo: "Tell the story", texto: "Within 24 hours, post at least two stories. Add them in My visits with their reach: the visit is validated and you can book the next one." },
    ],
    siguiente: "Next",
    saltar: "Skip",
    despues: "Later",
    igTitulo: "Connect your Instagram",
    igTexto: "Houses see your followers and your latest posts. That's what lets them accept your visit.",
    perfilTitulo: "Create your profile",
    perfilTexto: "Choose your photos and a few words about yourself: it's what houses see when you request a visit.",
    perfilBoton: "Create my profile",
    entrar: "Discover the addresses",
    error: "Something went wrong. Try again.",
  },
  es: {
    kicker: "Bienvenida a Curato",
    pantallas: [
      { icono: MagnifyingGlass, titulo: "Elige una dirección", texto: "En Direcciones, recorre las casas de Curato. Cada ficha enseña su oferta: lo que la visita cuesta de tu crédito del mes." },
      { icono: CalendarCheck, titulo: "Pide una visita", texto: "Elige el día y la hora. La casa acepta tu solicitud, y la víspera confirmas que vas en Mis visitas." },
      { icono: QrCode, titulo: "El día de la visita", texto: "Al llegar, enseña tu código de visita: la casa lo escanea. Está en Mis visitas, y te lo mandamos una hora antes." },
      { icono: Camera, titulo: "Cuéntala", texto: "En las 24 horas siguientes, publica al menos dos stories. Súbelas en Mis visitas con su alcance: la visita queda validada y puedes reservar la siguiente." },
    ],
    siguiente: "Siguiente",
    saltar: "Saltar",
    despues: "Más tarde",
    igTitulo: "Conecta tu Instagram",
    igTexto: "Las casas ven tus seguidores y tus últimas publicaciones. Es lo que les permite aceptar tu visita.",
    perfilTitulo: "Crea tu perfil",
    perfilTexto: "Elige tus fotos y unas palabras sobre ti: es lo que ven las casas cuando pides una visita.",
    perfilBoton: "Crear mi perfil",
    entrar: "Descubrir las direcciones",
    error: "Algo ha fallado. Vuelve a intentarlo.",
  },
};

type Perfil = { portraits: Retrato[]; bio: string; subjects: string[]; estilo: Retrato[]; inherited: string | null };

/**
 * La guía de después de la encuesta (Natalia, 2026-10-15): cuatro pantallas
 * sobre cómo se usa la app, conectar Instagram y crear el perfil. Cada paso se
 * puede dejar para más tarde; al final, o al saltar, no se vuelve a enseñar.
 */
export default function GuiaClient({ instagram }: { instagram: boolean }) {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const router = useRouter();
  const reduce = useReducedMotion();
  const total = t.pantallas.length + 2;
  const [paso, setPaso] = useState(0);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const [fallo, setFallo] = useState(false);

  const siguiente = () => setPaso((p) => Math.min(p + 1, total - 1));

  async function terminar() {
    setTerminando(true);
    setFallo(false);
    const res = await fetch("/api/storyteller/guia", { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      setFallo(true);
      setTerminando(false);
      return;
    }
    router.replace("/dashboard/storyteller");
  }

  async function abrirPerfil() {
    setCargandoPerfil(true);
    setFallo(false);
    const res = await fetch("/api/storyteller/perfil", { cache: "no-store" }).catch(() => null);
    setCargandoPerfil(false);
    if (res?.ok) setPerfil(await res.json());
    else setFallo(true);
  }

  const esPantalla = paso < t.pantallas.length;
  const pantalla = esPantalla ? t.pantallas[paso] : null;
  const Icono = pantalla?.icono;

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-pagina" style={{ minHeight: "calc(100dvh - var(--safe-top, 0px))" }}>
      <FloralBackdrop opacity={0.86} breathe />

      {/* Arriba: el progreso y, mientras se explica, saltar la explicación. */}
      <div className="relative z-10 flex items-center justify-between pt-pagina">
        <div className="flex gap-2" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ease-curato ${i === paso ? "w-6 bg-accent" : i < paso ? "w-2 bg-accent/60" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
        {esPantalla && (
          <button
            type="button"
            onClick={() => setPaso(t.pantallas.length)}
            className="min-h-11 text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-text-secondary"
          >
            {t.saltar}
          </button>
        )}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-seccion">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={paso}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {pantalla && Icono ? (
              <>
                {paso === 0 && <p className="mb-fila text-capitale uppercase tracking-capitale text-accent">{t.kicker}</p>}
                <Icono size={40} weight="thin" className="text-accent" />
                <h1 className="mt-fila font-titulo text-grande uppercase tracking-titre text-text-primary">{pantalla.titulo}</h1>
                <p className="mt-fila text-corps text-text-secondary">{pantalla.texto}</p>
                <div className="mt-rango">
                  <Button full onClick={siguiente}>
                    {t.siguiente}
                  </Button>
                </div>
              </>
            ) : paso === t.pantallas.length ? (
              <>
                <h1 className="font-titulo text-grande uppercase tracking-titre text-text-primary">{t.igTitulo}</h1>
                <p className="mb-rango mt-fila text-corps text-text-secondary">{t.igTexto}</p>
                <ConnectInstagram connected={instagram} onConnected={() => setTimeout(siguiente, 900)} className="" />
                <button
                  type="button"
                  onClick={siguiente}
                  className="mt-fila flex min-h-11 w-full items-center justify-center text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-text-secondary"
                >
                  {instagram ? t.siguiente : t.despues}
                </button>
              </>
            ) : (
              <>
                <h1 className="font-titulo text-grande uppercase tracking-titre text-text-primary">{t.perfilTitulo}</h1>
                <p className="mt-fila text-corps text-text-secondary">{t.perfilTexto}</p>
                <div className="mt-rango">
                  <Button full onClick={abrirPerfil} disabled={cargandoPerfil || terminando}>
                    {t.perfilBoton}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={terminar}
                  disabled={terminando}
                  className="mt-fila flex min-h-11 w-full items-center justify-center text-capitale uppercase tracking-capitale text-text-muted transition-colors hover:text-text-secondary"
                >
                  {t.despues}
                </button>
              </>
            )}
            {fallo && <p className="mt-fila text-legende text-copper-vif">{t.error}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* El editor del perfil, el mismo de Mon profil. Al guardar, a las direcciones. */}
      {perfil && (
        <PortraitEditor
          lang={lang}
          initial={perfil}
          onClose={() => setPerfil(null)}
          onSaved={() => {
            setPerfil(null);
            void terminar();
          }}
        />
      )}
    </div>
  );
}
