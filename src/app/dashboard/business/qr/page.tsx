"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FlorDeFondo, FranjaSuperior } from "@/components/member/flor-de-fondo";
import jsQR from "jsqr";
import { useLang } from "@/lib/i18n/LanguageContext";
import { StateMark } from "@/components/member/state-mark";
import { Button, ButtonLink } from "@/components/member/button";
import { codigoDelQR, mostrarCodigo, normalizarCodigo } from "@/lib/check-in";

type Visita = { name: string; handle: string | null; portrait: string | null; slotStart: string; partySize: number };
type Respuesta = { ok?: boolean; ya?: boolean; registrada?: boolean; error?: string; visita?: Visita };

type Estado =
  | { paso: "escaneando" }
  | { paso: "buscando"; codigo: string }
  | { paso: "visto"; codigo: string; visita: Visita; ya: boolean }
  | { paso: "registrando"; codigo: string; visita: Visita }
  | { paso: "registrada"; visita: Visita }
  | { paso: "otroDia"; visita: Visita }
  | { paso: "desconocido" }
  | { paso: "fallo" };

const BURDEOS = "#2B0709";
const TINTA = "#F5EFE4";
const CHAMPAGNE = "#CBB78F";
// Cada cuánto se mira un fotograma. Más seguido no lee antes y calienta el teléfono.
const LECTURA_MS = 200;
// El fotograma se reduce a este ancho antes de buscar el QR: basta y es rápido.
const ANCHO_LECTURA = 640;

const TEXTOS = {
  fr: {
    back: "Retour",
    title: "Scanner",
    lead: "Scannez le code que vous montre le storyteller. Vous verrez qui arrive avant d'enregistrer la visite.",
    camera: "Placez le code dans le cadre.",
    cameraOff: "La caméra n'est pas disponible. Autorisez-la dans les réglages du téléphone, ou saisissez le code.",
    manual: "Ou saisissez le code",
    manualPlaceholder: "K7M 4QX",
    check: "Vérifier",
    searching: "Un instant…",
    party: (n: number) => (n > 1 ? `${n} personnes` : "1 personne"),
    today: "Aujourd'hui",
    confirm: "Confirmer l'arrivée",
    notThem: "Ce n'est pas cette personne",
    saving: "Enregistrement…",
    alreadyCap: "Déjà enregistrée",
    already: "Cette visite a déjà été enregistrée.",
    doneCap: "Visite enregistrée",
    done: (n: string) => `${n || "Le storyteller"} est bien arrivé.`,
    otherDayCap: "Pas aujourd'hui",
    otherDay: "Ce code correspond à une visite chez vous, mais pas à celle d'aujourd'hui.",
    unknownCap: "Code inconnu",
    unknown: "Ce code ne correspond à aucune visite chez vous. Vérifiez-le avec le storyteller.",
    errorCap: "Erreur",
    error: "La vérification n'a pas abouti. Réessayez dans un instant.",
    again: "Scanner une autre visite",
  },
  en: {
    back: "Back",
    title: "Scanner",
    lead: "Scan the code the storyteller shows you. You'll see who is arriving before recording the visit.",
    camera: "Place the code inside the frame.",
    cameraOff: "The camera isn't available. Allow it in the phone's settings, or type the code.",
    manual: "Or type the code",
    manualPlaceholder: "K7M 4QX",
    check: "Check",
    searching: "One moment…",
    party: (n: number) => (n > 1 ? `${n} people` : "1 person"),
    today: "Today",
    confirm: "Confirm arrival",
    notThem: "This isn't the right person",
    saving: "Recording…",
    alreadyCap: "Already recorded",
    already: "This visit has already been recorded.",
    doneCap: "Visit recorded",
    done: (n: string) => `${n || "The storyteller"} has arrived.`,
    otherDayCap: "Not today",
    otherDay: "This code belongs to a visit at your maison, but not today's.",
    unknownCap: "Unknown code",
    unknown: "This code doesn't match any visit at your maison. Check it with the storyteller.",
    errorCap: "Error",
    error: "The check didn't go through. Try again in a moment.",
    again: "Scan another visit",
  },
  es: {
    back: "Volver",
    title: "Scanner",
    lead: "Escanea el código que te enseña el storyteller. Verás quién llega antes de registrar la visita.",
    camera: "Coloca el código dentro del marco.",
    cameraOff: "La cámara no está disponible. Permítela en los ajustes del teléfono o teclea el código.",
    manual: "O teclea el código",
    manualPlaceholder: "K7M 4QX",
    check: "Comprobar",
    searching: "Un momento…",
    party: (n: number) => (n > 1 ? `${n} personas` : "1 persona"),
    today: "Hoy",
    confirm: "Confirmar la llegada",
    notThem: "No es esta persona",
    saving: "Registrando…",
    alreadyCap: "Ya registrada",
    already: "Esta visita ya estaba registrada.",
    doneCap: "Visita registrada",
    done: (n: string) => `${n || "El storyteller"} ya ha llegado.`,
    otherDayCap: "Hoy no",
    otherDay: "Este código es de una visita en tu maison, pero no de la de hoy.",
    unknownCap: "Código desconocido",
    unknown: "Este código no corresponde a ninguna visita en tu maison. Compruébalo con el storyteller.",
    errorCap: "Error",
    error: "La comprobación no salió. Vuelve a intentarlo en un momento.",
    again: "Escanear otra visita",
  },
};

/**
 * Scanner: la casa lee el código de la visita que le enseña el storyteller
 * (migración 040). Antes era al revés, la casa enseñaba un QR fijo.
 *
 * La cámara va por el navegador (getUserMedia) y el QR se lee con jsQR, sin
 * plugin nativo: así funciona en la app que ya está instalada y en un
 * ordenador. El QR del storyteller es claro sobre oscuro, por eso se buscan
 * las dos polaridades.
 *
 * Antes de registrar se enseña la cara de quien llega: un código se puede
 * reenviar, una cara no.
 */
export default function MaisonScanner({ searchParams }: { searchParams: Promise<{ visite?: string }> }) {
  const { visite } = use(searchParams);
  // Se vuelve a la visita desde la que se abrió o, si no, al calendario.
  const volver = visite ? `/dashboard/business/calendrier/${encodeURIComponent(visite)}` : "/dashboard/business/calendrier";
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [estado, setEstado] = useState<Estado>({ paso: "escaneando" });
  const [camara, setCamara] = useState<"pidiendo" | "lista" | "sin">("pidiendo");
  const [tecleado, setTecleado] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement | null>(null);

  const consultar = useCallback(async (codigo: string, confirmar = false) => {
    try {
      const res = await fetch("/api/maison/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codigo, confirmar }),
      });
      const d = (await res.json().catch(() => ({}))) as Respuesta;
      if (d.error === "code") return setEstado({ paso: "desconocido" });
      if (d.error === "dia" && d.visita) return setEstado({ paso: "otroDia", visita: d.visita });
      if (!res.ok || !d.visita) return setEstado({ paso: "fallo" });
      if (d.registrada) return setEstado({ paso: "registrada", visita: d.visita });
      setEstado({ paso: "visto", codigo, visita: d.visita, ya: Boolean(d.ya) });
    } catch {
      setEstado({ paso: "fallo" });
    }
  }, []);

  // La cámara solo está encendida mientras se escanea: en cuanto hay un código,
  // se apaga, y se vuelve a pedir al escanear otra visita.
  const escaneando = estado.paso === "escaneando";
  useEffect(() => {
    if (!escaneando) return;
    let vivo = true;
    let flujo: MediaStream | null = null;
    let reloj: ReturnType<typeof setTimeout> | null = null;

    const leer = () => {
      const v = video.current;
      if (!vivo || !v) return;
      if (v.readyState >= 2 && v.videoWidth > 0) {
        const escala = Math.min(1, ANCHO_LECTURA / v.videoWidth);
        const ancho = Math.round(v.videoWidth * escala);
        const alto = Math.round(v.videoHeight * escala);
        const c = (lienzo.current ??= document.createElement("canvas"));
        c.width = ancho;
        c.height = alto;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, ancho, alto);
          const imagen = ctx.getImageData(0, 0, ancho, alto);
          const leido = jsQR(imagen.data, ancho, alto, { inversionAttempts: "attemptBoth" });
          const codigo = leido ? codigoDelQR(leido.data) : null;
          if (codigo) {
            setEstado({ paso: "buscando", codigo });
            void consultar(codigo);
            return;
          }
        }
      }
      reloj = setTimeout(leer, LECTURA_MS);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("sin cámara");
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!vivo) return;
        const v = video.current;
        if (!v) return;
        v.srcObject = flujo;
        await v.play().catch(() => {});
        setCamara("lista");
        leer();
      } catch {
        if (vivo) setCamara("sin");
      }
    })();

    return () => {
      vivo = false;
      if (reloj) clearTimeout(reloj);
      flujo?.getTracks().forEach((pista) => pista.stop());
    };
  }, [escaneando, consultar]);

  function comprobarTecleado(e: React.FormEvent) {
    e.preventDefault();
    const codigo = codigoDelQR(tecleado);
    if (!codigo) return setEstado({ paso: "desconocido" });
    setEstado({ paso: "buscando", codigo });
    void consultar(codigo);
  }

  function otraVez() {
    setTecleado("");
    setCamara("pidiendo");
    setEstado({ paso: "escaneando" });
  }

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

  const ficha = (v: Visita) => (
    <div className="my-rango flex items-center gap-fila">
      <div className="h-[120px] w-[96px] shrink-0 overflow-hidden rounded-[14px]" style={{ backgroundColor: "rgba(245,239,228,0.08)" }}>
        {v.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.portrait} alt={v.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-titre" style={{ color: CHAMPAGNE }}>
            {(v.name || v.handle || "?").trim().charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sous-titre">{v.name}</p>
        {v.handle && <p className="text-legende" style={{ color: CHAMPAGNE }}>@{v.handle.replace(/^@/, "")}</p>}
        <p className="mt-bloque text-legende tabular-nums">
          {t.today} · {hora(v.slotStart)} · {t.party(v.partySize)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: BURDEOS, color: TINTA }}>
      <FranjaSuperior color={BURDEOS} />
      {/* El mismo fondo que la pantalla del código del storyteller. */}
      <FlorDeFondo />
      <div
        className="relative mx-auto flex min-h-full max-w-[420px] flex-col px-10 pb-seccion"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-h-[52px] items-center">
          <Link
            href={volver}
            className="text-capitale uppercase tracking-capitale transition-colors duration-200 ease-curato"
            style={{ color: CHAMPAGNE }}
          >
            {t.back}
          </Link>
        </div>

        <h1 className="mt-rango text-titre uppercase tracking-titre">{t.title}</h1>
        <p className="mt-bloque text-legende">{t.lead}</p>

        {(estado.paso === "escaneando" || estado.paso === "buscando") && (
          <>
            <div
              className="relative my-rango aspect-square w-full overflow-hidden rounded-[20px]"
              style={{ backgroundColor: "rgba(245,239,228,0.06)" }}
            >
              {camara !== "sin" && estado.paso === "escaneando" && (
                <video ref={video} playsInline muted autoPlay className="h-full w-full object-cover" />
              )}
              {/* El marco: dice dónde poner el código sin tapar la imagen. */}
              <div aria-hidden className="pointer-events-none absolute inset-[15%] rounded-[16px] border-2" style={{ borderColor: CHAMPAGNE }} />
              {estado.paso === "buscando" && (
                <div className="absolute inset-0 flex items-center justify-center text-corps" style={{ backgroundColor: "rgba(43,7,9,0.7)" }}>
                  {t.searching}
                </div>
              )}
            </div>
            <p className="text-legende">{camara === "sin" ? t.cameraOff : t.camera}</p>

            <form onSubmit={comprobarTecleado} className="mt-seccion">
              <label htmlFor="codigo-tecleado" className="text-capitale uppercase tracking-capitale" style={{ color: CHAMPAGNE }}>
                {t.manual}
              </label>
              <input
                id="codigo-tecleado"
                value={tecleado}
                onChange={(e) => setTecleado(mostrarCodigo(normalizarCodigo(e.target.value).slice(0, 6)))}
                placeholder={t.manualPlaceholder}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="mt-fila w-full border-0 border-b bg-transparent py-bloque text-[28px] font-light uppercase tabular-nums tracking-[0.18em] outline-none"
                style={{ borderColor: CHAMPAGNE, color: TINTA }}
              />
              <div className="mt-fila">
                <Button type="submit" disabled={estado.paso === "buscando" || normalizarCodigo(tecleado).length < 6}>
                  {t.check}
                </Button>
              </div>
            </form>
          </>
        )}

        {estado.paso === "visto" && (
          <>
            {ficha(estado.visita)}
            {estado.ya ? (
              <>
                <StateMark tono="cumplido" capital={t.alreadyCap} className="mb-rango">
                  {t.already}
                </StateMark>
                <Button onClick={otraVez}>{t.again}</Button>
              </>
            ) : (
              <div className="flex flex-col items-start gap-fila">
                <Button
                  onClick={() => {
                    setEstado({ paso: "registrando", codigo: estado.codigo, visita: estado.visita });
                    void consultar(estado.codigo, true);
                  }}
                >
                  {t.confirm}
                </Button>
                <button
                  type="button"
                  onClick={otraVez}
                  className="min-h-11 text-capitale uppercase tracking-capitale"
                  style={{ color: CHAMPAGNE }}
                >
                  {t.notThem}
                </button>
              </div>
            )}
          </>
        )}

        {estado.paso === "registrando" && (
          <>
            {ficha(estado.visita)}
            <p className="text-corps">{t.saving}</p>
          </>
        )}

        {estado.paso === "registrada" && (
          <>
            {ficha(estado.visita)}
            <StateMark tono="cumplido" capital={t.doneCap} className="mb-rango">
              {t.done(estado.visita.name.split(" ")[0])}
            </StateMark>
            {visite ? <ButtonLink href={volver}>{t.back}</ButtonLink> : <Button onClick={otraVez}>{t.again}</Button>}
          </>
        )}

        {estado.paso === "otroDia" && (
          <>
            {ficha(estado.visita)}
            <StateMark tono="plazo" capital={t.otherDayCap} className="mb-rango">
              {t.otherDay}
            </StateMark>
            <Button onClick={otraVez}>{t.again}</Button>
          </>
        )}

        {estado.paso === "desconocido" && (
          <>
            <StateMark tono="caido" capital={t.unknownCap} className="my-rango">
              {t.unknown}
            </StateMark>
            <Button onClick={otraVez}>{t.again}</Button>
          </>
        )}

        {estado.paso === "fallo" && (
          <>
            <StateMark tono="caido" capital={t.errorCap} className="my-rango">
              {t.error}
            </StateMark>
            <Button onClick={otraVez}>{t.again}</Button>
          </>
        )}
      </div>
    </div>
  );
}
