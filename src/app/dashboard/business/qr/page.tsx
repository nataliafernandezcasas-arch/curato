"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useLang } from "@/lib/i18n/LanguageContext";
import { StateMark } from "@/components/member/state-mark";
import { useModoSala } from "@/lib/native/modo-sala";
import { mostrarCodigo } from "@/lib/check-in";

type Datos = { maison: string; code: string; url: string; lastCheckIn: { name: string; at: string } | null };

const BURDEOS = "#2B0709";
const TINTA = "#F5EFE4";
const CHAMPAGNE = "#CBB78F";
// Cada cuánto se pregunta si alguien acaba de escanear.
const SONDEO_MS = 15000;

const TEXTOS = {
  fr: {
    back: "Retour",
    bright: "Luminosité au maximum",
    raise: "Montez la luminosité",
    show: "À montrer au visiteur",
    scan: "Le storyteller scanne, la visite est enregistrée.",
    awakeBright: "L'écran reste allumé tant que cette page est ouverte. La luminosité revient à la normale en sortant.",
    awake: "L'écran reste allumé tant que cette page est ouverte.",
    notAwake: "Pensez à garder l'écran allumé pendant que le visiteur scanne.",
    fallback: "Si le téléphone ne suffit pas",
    manual: "Code à saisir à la main",
    manualWhere: "Sur curatocollective.com/v",
    print: "Imprimer le carton",
    printNote: "Un carton posé sur le comptoir évite de sortir le téléphone à chaque visite.",
    scannedCap: "Visite enregistrée",
    scanned: (n: string) => `${n || "Le storyteller"} vient d'arriver.`,
    offlineCap: "Hors ligne",
    offline: (c: string) => `Le code ${c} reste valable.`,
    errorCap: "Code indisponible",
    error: "Le code ne s'est pas chargé. Réessayez dans un instant.",
  },
  en: {
    back: "Back",
    bright: "Brightness at maximum",
    raise: "Turn the brightness up",
    show: "Show it to the visitor",
    scan: "The storyteller scans, and the visit is recorded.",
    awakeBright: "The screen stays on while this page is open. Brightness goes back to normal when you leave.",
    awake: "The screen stays on while this page is open.",
    notAwake: "Keep the screen on while the visitor scans.",
    fallback: "If the phone isn't enough",
    manual: "Code to type by hand",
    manualWhere: "At curatocollective.com/v",
    print: "Print the card",
    printNote: "A card on the counter saves taking the phone out at every visit.",
    scannedCap: "Visit recorded",
    scanned: (n: string) => `${n || "The storyteller"} has just arrived.`,
    offlineCap: "Offline",
    offline: (c: string) => `The code ${c} still works.`,
    errorCap: "Code unavailable",
    error: "The code didn't load. Try again in a moment.",
  },
  es: {
    back: "Volver",
    bright: "Brillo al máximo",
    raise: "Sube el brillo",
    show: "Para enseñar al visitante",
    scan: "El storyteller escanea y la visita queda registrada.",
    awakeBright: "La pantalla sigue encendida mientras esta página esté abierta. El brillo vuelve a lo normal al salir.",
    awake: "La pantalla sigue encendida mientras esta página esté abierta.",
    notAwake: "Mantén la pantalla encendida mientras el visitante escanea.",
    fallback: "Si el teléfono no basta",
    manual: "Código para teclear a mano",
    manualWhere: "En curatocollective.com/v",
    print: "Imprimir el cartón",
    printNote: "Un cartón en el mostrador evita sacar el teléfono en cada visita.",
    scannedCap: "Visita registrada",
    scanned: (n: string) => `${n || "El storyteller"} acaba de llegar.`,
    offlineCap: "Sin conexión",
    offline: (c: string) => `El código ${c} sigue valiendo.`,
    errorCap: "Código no disponible",
    error: "El código no se cargó. Vuelve a intentarlo en un momento.",
  },
};

/**
 * Code QR (27): la carte de visite de la marca con el QR de sala.
 *
 * Es el único caso físico del producto: se enseña de pie, con prisa y a veces
 * con mala luz. Por eso la pantalla se reconoce como Curato antes de leerse
 * (el burdeos plano de la tarjeta y su flor abajo a la izquierda), el código va
 * en champagne a 250 px sin marco, y el brillo sube solo.
 *
 * Un QR claro sobre oscuro va invertido: las cámaras de iOS y Android lo leen,
 * algunos lectores dentro de otras apps no. El código de seis caracteres y el
 * cartón impreso, en tinta oscura sobre claro, son la red de seguridad.
 */
export default function MaisonQRPage() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const modo = useModoSala();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      fetch("/api/maison/qr", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: Datos) => vivo && (setDatos(d), setFallo(false)))
        .catch(() => vivo && setFallo(true));
    cargar();
    // Mientras está abierta se pregunta cada poco si alguien acaba de escanear:
    // así la sala ve que ha funcionado sin tocar nada.
    const sondeo = setInterval(cargar, SONDEO_MS);
    const red = () => setEnLinea(navigator.onLine);
    red();
    window.addEventListener("online", red);
    window.addEventListener("offline", red);
    return () => {
      vivo = false;
      clearInterval(sondeo);
      window.removeEventListener("online", red);
      window.removeEventListener("offline", red);
    };
  }, []);

  const codigo = datos ? mostrarCodigo(datos.code) : "";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: BURDEOS, color: TINTA }}>
      {/* La flor de la tarjeta, abajo a la izquierda, difuminada con una
          máscara radial: sin rectángulo ni canto. */}
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
            href="/dashboard/business?section=demandes"
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

        <div className="my-rango flex justify-center" aria-busy={!datos}>
          {datos ? (
            <QRCode value={datos.url} size={250} fgColor={CHAMPAGNE} bgColor="transparent" level="M" title={codigo} />
          ) : (
            <div className="h-[250px] w-[250px] animate-pulse rounded-[20px] [animation-duration:1.6s]" style={{ backgroundColor: "rgba(245,239,228,0.06)" }} />
          )}
        </div>

        {datos?.lastCheckIn && (
          <StateMark tono="cumplido" capital={t.scannedCap} className="mb-rango">
            {t.scanned(datos.lastCheckIn.name)}
          </StateMark>
        )}
        {!enLinea && datos && (
          <StateMark tono="plazo" capital={t.offlineCap} className="mb-rango">
            {t.offline(codigo)}
          </StateMark>
        )}
        {fallo && !datos && (
          <StateMark tono="caido" capital={t.errorCap} className="mb-rango">
            {t.error}
          </StateMark>
        )}

        <p className="text-corps">{t.scan}</p>
        <p className="mt-bloque text-legende" style={{ color: TINTA }}>
          {modo.despierta ? (modo.brillo ? t.awakeBright : t.awake) : t.notAwake}
        </p>

        <section className="mt-seccion">
          <p className="text-capitale uppercase tracking-capitale" style={{ color: CHAMPAGNE }}>
            {t.fallback}
          </p>
          <p className="mt-fila text-legende">{t.manual}</p>
          <p className="mt-etiqueta text-[34px] font-light tabular-nums tracking-[0.18em]">{codigo || "···"}</p>
          <p className="text-legende">{t.manualWhere}</p>
          <Link
            href="/dashboard/business/qr/carton"
            className="mt-rango inline-flex min-h-11 items-center text-corps underline underline-offset-4"
            style={{ color: CHAMPAGNE }}
          >
            {t.print}
          </Link>
          <p className="max-w-[36ch] text-legende">{t.printNote}</p>
        </section>
      </div>
    </div>
  );
}
