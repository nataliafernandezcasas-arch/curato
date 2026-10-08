"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { useLang } from "@/lib/i18n/LanguageContext";
import { StateMark } from "@/components/member/state-mark";
import { useModoSala } from "@/lib/native/modo-sala";
import { contenidoDelQR, mostrarCodigo } from "@/lib/check-in";

type Datos = { maison: string; slotStart: string; visitedAt: string | null; code?: string; error?: string };

const BURDEOS = "#2B0709";
const TINTA = "#F5EFE4";
const CHAMPAGNE = "#CBB78F";
// Cada cuánto se pregunta si la casa ya escaneó.
const SONDEO_MS = 5000;

const TEXTOS = {
  fr: {
    back: "Mes visites",
    bright: "Luminosité au maximum",
    raise: "Montez la luminosité",
    show: "À montrer à la maison",
    scan: "La maison scanne ce code, et votre visite est enregistrée.",
    awake: "L'écran reste allumé tant que cette page est ouverte.",
    manual: "Si la caméra ne le lit pas, la maison peut saisir ce code",
    doneCap: "Visite enregistrée",
    done: "La maison a enregistré votre arrivée. Bonne visite.",
    dayCap: "Pas aujourd'hui",
    day: "Ce code n'existe que le jour de la visite.",
    errorCap: "Code indisponible",
    error: "Le code ne s'est pas chargé. Réessayez dans un instant.",
    offlineCap: "Hors ligne",
    offline: "Le code reste valable : la maison peut le scanner.",
  },
  en: {
    back: "My visits",
    bright: "Brightness at maximum",
    raise: "Turn the brightness up",
    show: "Show it to the maison",
    scan: "The maison scans this code, and your visit is recorded.",
    awake: "The screen stays on while this page is open.",
    manual: "If the camera can't read it, the maison can type this code",
    doneCap: "Visit recorded",
    done: "The maison has recorded your arrival. Enjoy your visit.",
    dayCap: "Not today",
    day: "This code only exists on the day of the visit.",
    errorCap: "Code unavailable",
    error: "The code didn't load. Try again in a moment.",
    offlineCap: "Offline",
    offline: "The code still works: the maison can scan it.",
  },
  es: {
    back: "Mis visitas",
    bright: "Brillo al máximo",
    raise: "Sube el brillo",
    show: "Para enseñar a la maison",
    scan: "La maison escanea este código y tu visita queda registrada.",
    awake: "La pantalla sigue encendida mientras esta página esté abierta.",
    manual: "Si la cámara no lo lee, la maison puede teclear este código",
    doneCap: "Visita registrada",
    done: "La maison ha registrado tu llegada. Disfruta la visita.",
    dayCap: "Hoy no",
    day: "Este código solo existe el día de la visita.",
    errorCap: "Código no disponible",
    error: "El código no se cargó. Vuelve a intentarlo en un momento.",
    offlineCap: "Sin conexión",
    offline: "El código sigue valiendo: la maison puede escanearlo.",
  },
};

/**
 * El código de la visita de hoy (migración 040). Lo enseña el storyteller y lo
 * escanea la casa, al revés que antes.
 *
 * Es la misma pantalla de sala que tenía la casa: se enseña de pie, con prisa y
 * a veces con mala luz, así que se reconoce como Curato antes de leerse y el
 * brillo sube solo. Pregunta cada pocos segundos si la casa ya escaneó, para
 * que el storyteller vea que ha funcionado sin tocar nada.
 */
export default function CodigoDeVisita() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const { id } = useParams<{ id: string }>();
  const modo = useModoSala();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    let vivo = true;
    let sondeo: ReturnType<typeof setInterval> | null = null;
    const cargar = () =>
      fetch(`/api/visite/codigo?reserva=${encodeURIComponent(id)}`, { cache: "no-store" })
        .then((r) => r.json().then((d: Datos) => ({ ok: r.ok || r.status === 409, d })))
        .then(({ ok, d }) => {
          if (!vivo) return;
          if (!ok) return setFallo(true);
          setDatos(d);
          setFallo(false);
          // Registrada o fuera de día, ya no hay nada que esperar.
          if ((d.visitedAt || d.error) && sondeo) clearInterval(sondeo);
        })
        .catch(() => vivo && setFallo(true));
    cargar();
    sondeo = setInterval(cargar, SONDEO_MS);
    const red = () => setEnLinea(navigator.onLine);
    red();
    window.addEventListener("online", red);
    window.addEventListener("offline", red);
    return () => {
      vivo = false;
      if (sondeo) clearInterval(sondeo);
      window.removeEventListener("online", red);
      window.removeEventListener("offline", red);
    };
  }, [id]);

  const codigo = datos?.code ? mostrarCodigo(datos.code) : "";
  const fecha = datos
    ? new Date(datos.slotStart).toLocaleString(lang, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: BURDEOS, color: TINTA }}>
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 h-[300px] w-[300px] bg-no-repeat"
        style={{
          backgroundImage: "url(/carte-visite-curato.png)",
          backgroundSize: "auto 300px",
          backgroundPosition: "left bottom",
          opacity: 0.55,
          maskImage: "radial-gradient(circle at 30% 70%, black 35%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 30% 70%, black 35%, transparent 72%)",
        }}
      />

      <div
        className="relative mx-auto flex min-h-full max-w-[420px] flex-col px-pagina pb-seccion"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-h-[52px] items-center justify-between gap-fila">
          <Link
            href="/dashboard/storyteller/visits"
            className="text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato"
            style={{ color: CHAMPAGNE }}
          >
            {t.back}
          </Link>
          <span className="text-capitale uppercase tracking-capitale" style={{ color: CHAMPAGNE }}>
            {modo.brillo ? t.bright : t.raise}
          </span>
        </div>

        <p className="mt-rango text-capitale uppercase tracking-capitale" style={{ color: CHAMPAGNE }}>
          {t.show}
        </p>
        <h1 className="mt-bloque text-titre uppercase tracking-titre">{datos?.maison ?? ""}</h1>
        {fecha && <p className="mt-bloque text-legende first-letter:uppercase">{fecha}</p>}

        {datos?.visitedAt ? (
          <StateMark tono="cumplido" capital={t.doneCap} className="my-rango">
            {t.done}
          </StateMark>
        ) : datos?.error === "dia" ? (
          <StateMark tono="plazo" capital={t.dayCap} className="my-rango">
            {t.day}
          </StateMark>
        ) : (
          <>
            <div className="my-rango flex justify-center" aria-busy={!datos?.code}>
              {datos?.code ? (
                <QRCode
                  value={contenidoDelQR(datos.code)}
                  size={250}
                  fgColor={CHAMPAGNE}
                  bgColor="transparent"
                  level="M"
                  title={codigo}
                />
              ) : (
                <div
                  className="h-[250px] w-[250px] animate-pulse rounded-[20px] [animation-duration:1.6s]"
                  style={{ backgroundColor: "rgba(245,239,228,0.06)" }}
                />
              )}
            </div>
            {!enLinea && datos?.code && (
              <StateMark tono="plazo" capital={t.offlineCap} className="mb-rango">
                {t.offline}
              </StateMark>
            )}
            {fallo && !datos && (
              <StateMark tono="caido" capital={t.errorCap} className="mb-rango">
                {t.error}
              </StateMark>
            )}
            <p className="text-corps">{t.scan}</p>
            {modo.despierta && <p className="mt-bloque text-legende">{t.awake}</p>}

            <section className="mt-seccion">
              <p className="text-legende">{t.manual}</p>
              <p className="mt-etiqueta text-[34px] font-light tabular-nums tracking-[0.18em]">{codigo || "···"}</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
