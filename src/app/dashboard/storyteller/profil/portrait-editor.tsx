"use client";

import { useEffect, useId, useState } from "react";
import type { Lang } from "@/lib/i18n/translations";
import { Section } from "@/components/member/section";
import { SlideIn } from "@/components/member/slide-in";
import { StateMark } from "@/components/member/state-mark";
import { Button } from "@/components/member/button";
import { FilePicker } from "@/components/member/file-picker";
import { Choice } from "@/components/member/choice";
import { downscaleImage } from "@/lib/image-downscale";
import { SUBJECTS, SUBJECT_MAX } from "@/lib/photo-subjects";

// Los mismos límites que valida el servidor (creator-portrait.ts). No se
// importan de allí porque ese archivo arrastra el cliente de administración.
const PORTRAIT_MAX = 2;
const ESTILO_MAX = 6;
const BIO_MAX = 240;
const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export type Retrato = { path: string; url: string };

const TEXTOS = {
  fr: {
    back: "Retour",
    kicker: "Ce que voient les maisons",
    title: ["Votre", "portrait"],
    intro: "Une photographie et quelques lignes. C'est sur ça qu'une maison décide de vous ouvrir sa porte.",
    portrait: "Portrait",
    second: "Une seconde",
    add: "Ajouter une photo",
    replace: "Remplacer",
    remove: "Retirer",
    formats: "Deux au plus. JPEG, PNG, WEBP ou HEIC, 3 Mo.",
    inherited: "Votre photo d'Instagram, en attendant la vôtre.",
    bioLabel: "Ma façon de photographier",
    bioHint: "Une phrase, avec vos mots. C'est ce que la maison lit avant de regarder.",
    bioPlaceholder: "Ce que vous aimez photographier, la lumière que vous cherchez, le genre de lieux où vous êtes chez vous.",
    estiloTitle: "Mes photographies",
    estiloHint:
      "Six au plus, celles de votre candidature comprises : gardez-les, retirez-en, ajoutez les vôtres. Les maisons les voient avec votre profil, sans pouvoir les télécharger.",
    estiloAdd: "Ajouter",
    estiloRemove: "Retirer",
    subjects: "Ce que je photographie",
    subjectsHint: "Deux au plus. C'est ce que les maisons lisent sous votre nom.",
    subjectsOver: "Deux au plus : retirez-en pour pouvoir enregistrer.",
    save: "Enregistrer",
    saving: "Un instant…",
    unsaved: "Non enregistré",
    footnote: "Votre portrait remplace la photo d'Instagram. Vos chiffres, eux, restent ceux de votre compte.",
    uploading: "Envoi de la photo…",
    tooLarge: "Cette photo dépasse 3 Mo, même réduite. Essayez-en une autre.",
    badType: "Ce format n'est pas accepté : JPEG, PNG, WEBP ou HEIC.",
    failCap: "Envoi impossible",
    uploadFail: "La photo n'est pas arrivée. Rien de ce que vous aviez n'est perdu. Réessayez.",
    saveFail: "Enregistrement impossible. Vos modifications sont toujours là : réessayez.",
  },
  en: {
    back: "Back",
    kicker: "What houses see",
    title: ["Your", "portrait"],
    intro: "A photograph and a few lines. It's what a house looks at before opening its door to you.",
    portrait: "Portrait",
    second: "A second one",
    add: "Add a photo",
    replace: "Replace",
    remove: "Remove",
    formats: "Two at most. JPEG, PNG, WEBP or HEIC, 3 MB.",
    inherited: "Your Instagram photo, until you choose your own.",
    bioLabel: "How I photograph",
    bioHint: "One sentence, in your words. It's what the house reads before looking.",
    bioPlaceholder: "What you love to photograph, the light you look for, the kind of places where you feel at home.",
    estiloTitle: "My photographs",
    estiloHint:
      "Six at most, your application photos included: keep them, remove some, add your own. Houses see them with your profile, without being able to download them.",
    estiloAdd: "Add",
    estiloRemove: "Remove",
    subjects: "What I photograph",
    subjectsHint: "Two at most. It's what houses read under your name.",
    subjectsOver: "Two at most: remove some to be able to save.",
    save: "Save",
    saving: "One moment…",
    unsaved: "Not saved",
    footnote: "Your portrait replaces your Instagram photo. Your figures stay those of your account.",
    uploading: "Sending the photo…",
    tooLarge: "This photo is over 3 MB, even reduced. Try another one.",
    badType: "This format isn't accepted: JPEG, PNG, WEBP or HEIC.",
    failCap: "Upload failed",
    uploadFail: "The photo didn't arrive. Nothing you had is lost. Try again.",
    saveFail: "Couldn't save. Your changes are still here: try again.",
  },
  es: {
    back: "Volver",
    kicker: "Lo que ven las maisons",
    title: ["Tu", "retrato"],
    intro: "Una fotografía y unas líneas. Es con eso con lo que una maison decide abrirte la puerta.",
    portrait: "Retrato",
    second: "Una segunda",
    add: "Añadir una foto",
    replace: "Cambiar",
    remove: "Quitar",
    formats: "Dos como máximo. JPEG, PNG, WEBP o HEIC, 3 MB.",
    inherited: "Tu foto de Instagram, mientras no elijas la tuya.",
    bioLabel: "Mi manera de fotografiar",
    bioHint: "Una frase, con tus palabras. Es lo que la maison lee antes de mirar.",
    bioPlaceholder: "Lo que te gusta fotografiar, la luz que buscas, el tipo de lugares donde te sientes en casa.",
    estiloTitle: "Mis fotografías",
    estiloHint:
      "Seis como máximo, las de tu candidatura incluidas: quédatelas, quita alguna o añade las tuyas. Las maisons las ven con tu perfil, sin poder descargarlas.",
    estiloAdd: "Añadir",
    estiloRemove: "Quitar",
    subjects: "Lo que fotografío",
    subjectsHint: "Dos como máximo. Es lo que las maisons leen bajo tu nombre.",
    subjectsOver: "Dos como máximo: quita alguna para poder guardar.",
    save: "Guardar",
    saving: "Un momento…",
    unsaved: "Sin guardar",
    footnote: "Tu retrato sustituye a la foto de Instagram. Tus cifras siguen siendo las de tu cuenta.",
    uploading: "Enviando la foto…",
    tooLarge: "Esta foto pasa de 3 MB, incluso reducida. Prueba con otra.",
    badType: "Este formato no se acepta: JPEG, PNG, WEBP o HEIC.",
    failCap: "No se pudo enviar",
    uploadFail: "La foto no llegó. No se ha perdido nada de lo que tenías. Vuelve a intentarlo.",
    saveFail: "No se pudo guardar. Tus cambios siguen aquí: vuelve a intentarlo.",
  },
};

/**
 * Mon portrait et ma voix (16b): el retrato y la frase que ven las casas.
 *
 * Hasta dos fotografías en 4:5, nunca un círculo: en esta dirección de arte una
 * foto se enmarca como una lámina. La frase, 240 caracteres. Sobrescriben el
 * avatar y la bio de Instagram; las cifras siguen viniendo de la cuenta.
 *
 * Se edita sin guardar y se guarda con un botón, porque cambiar la cara que ve
 * una casa merece un gesto deliberado.
 */
export function PortraitEditor({
  lang,
  initial,
  onClose,
  onSaved,
}: {
  lang: Lang;
  initial: { portraits: Retrato[]; bio: string; subjects: string[]; estilo: Retrato[]; inherited: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const bioId = useId();

  const [portraits, setPortraits] = useState<Retrato[]>(initial.portraits);
  const [bio, setBio] = useState(initial.bio);
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [estilo, setEstilo] = useState<Retrato[]>(initial.estilo);
  const [subiendoEstilo, setSubiendoEstilo] = useState(false);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<{ cap?: string; texto: string } | null>(null);

  const temasCambiados = [...subjects].sort().join("|") !== [...initial.subjects].sort().join("|");
  // Quien trae más de dos de antes puede guardar sin tocarlas; si las toca,
  // tiene que dejar dos como mucho.
  const temasDeMas = temasCambiados && subjects.length > SUBJECT_MAX;
  const estiloCambiado = estilo.map((p) => p.path).join("|") !== initial.estilo.map((p) => p.path).join("|");
  const cambiado =
    bio.trim() !== initial.bio.trim() ||
    temasCambiados ||
    estiloCambiado ||
    portraits.map((p) => p.path).join("|") !== initial.portraits.map((p) => p.path).join("|");

  // Escape vuelve, y la página de debajo no se mueve mientras esto está encima.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  async function subir(files: FileList | null, hueco: number) {
    const original = files?.[0];
    if (!original) return;
    setError(null);
    if (!ACCEPT.split(",").includes(original.type.toLowerCase())) {
      setError({ texto: t.badType });
      return;
    }
    setSubiendo(hueco);
    try {
      const file = await downscaleImage(original);
      if (file.size > MAX_BYTES) {
        setError({ texto: t.tooLarge });
        return;
      }
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/storyteller/perfil", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.path || !body.url) {
        setError(
          body.error === "size" ? { texto: t.tooLarge } : body.error === "format" ? { texto: t.badType } : { cap: t.failCap, texto: t.uploadFail }
        );
        return;
      }
      setPortraits((prev) => {
        const next = [...prev];
        next[hueco] = { path: body.path, url: body.url };
        return next.filter(Boolean).slice(0, PORTRAIT_MAX);
      });
    } catch {
      setError({ cap: t.failCap, texto: t.uploadFail });
    } finally {
      setSubiendo(null);
    }
  }

  /** Una foto de estilo más, al final de las que ya hay. */
  async function subirEstilo(files: FileList | null) {
    const original = files?.[0];
    if (!original) return;
    setError(null);
    if (!ACCEPT.split(",").includes(original.type.toLowerCase())) {
      setError({ texto: t.badType });
      return;
    }
    setSubiendoEstilo(true);
    try {
      const file = await downscaleImage(original);
      if (file.size > MAX_BYTES) {
        setError({ texto: t.tooLarge });
        return;
      }
      const form = new FormData();
      form.set("file", file);
      form.set("tipo", "estilo");
      const res = await fetch("/api/storyteller/perfil", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.path || !body.url) {
        setError(
          body.error === "size" ? { texto: t.tooLarge } : body.error === "format" ? { texto: t.badType } : { cap: t.failCap, texto: t.uploadFail }
        );
        return;
      }
      setEstilo((prev) => [...prev, { path: body.path, url: body.url }].slice(0, ESTILO_MAX));
    } catch {
      setError({ cap: t.failCap, texto: t.uploadFail });
    } finally {
      setSubiendoEstilo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/storyteller/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraits: portraits.map((p) => p.path),
          bio,
          ...(temasCambiados ? { subjects } : {}),
          ...(estiloCambiado ? { estilo: estilo.map((p) => p.path) } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch {
      setError({ texto: t.saveFail });
    } finally {
      setGuardando(false);
    }
  }

  // Dos huecos: lo que ya hay, y uno vacío para añadir mientras quepa.
  const huecos = Math.min(PORTRAIT_MAX, portraits.length + 1);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-surface">
      <SlideIn>
        <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col">
          <header
            className="sticky top-0 z-10 px-pagina backdrop-blur-md"
            style={{ backgroundColor: "rgba(25,24,23,0.92)", paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[52px] items-center text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
            >
              {t.back}
            </button>
          </header>

          <div className="flex-1 px-pagina pb-seccion pt-rango">
            <p className="mb-bloque text-capitale uppercase tracking-capitale text-text-secondary">{t.kicker}</p>
            <h1 className="mb-fila text-titre uppercase tracking-titre text-text-primary">
              {t.title[0]}
              <br />
              {t.title[1]}
            </h1>
            <p className="mb-seccion max-w-[36ch] text-corps text-text-secondary">{t.intro}</p>

            <Section title={t.portrait} hint={t.formats}>
              <div className="grid grid-cols-2 gap-bloque">
                {Array.from({ length: huecos }).map((_, i) => {
                  const actual = portraits[i];
                  // Sin retrato propio, el primer hueco enseña la foto de
                  // Instagram, que es la que ve hoy la casa.
                  const heredada = i === 0 && !actual ? initial.inherited : null;
                  const foto = actual?.url ?? heredada;
                  return (
                    <div key={i}>
                      {foto ? (
                        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-raised">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto} alt="" className={`h-full w-full object-cover ${subiendo === i ? "opacity-45" : ""}`} />
                        </div>
                      ) : (
                        // El hueco que espera una foto es cristal con la forma de
                        // lo que va dentro: radio 16, no la píldora.
                        <FilePicker
                          accept={ACCEPT}
                          disabled={subiendo !== null}
                          onFiles={(f) => subir(f, i)}
                          className="flex aspect-[4/5] flex-col items-center justify-center gap-bloque rounded-2xl border border-[rgba(245,239,228,0.24)] bg-[rgba(245,239,228,0.08)] px-fila text-center backdrop-blur-md transition-colors duration-200 ease-curato hover:bg-[rgba(245,239,228,0.14)]"
                        >
                          <span className="text-titre font-light text-accent">+</span>
                          <span className="text-capitale uppercase tracking-capitale text-text-primary">
                            {subiendo === i ? t.uploading : i === 0 ? t.add : t.second}
                          </span>
                        </FilePicker>
                      )}

                      {heredada && <p className="mt-bloque text-legende text-text-secondary">{t.inherited}</p>}

                      {foto && (
                        <div className="mt-bloque flex flex-wrap items-center gap-x-fila">
                          <FilePicker
                            accept={ACCEPT}
                            disabled={subiendo !== null}
                            onFiles={(f) => subir(f, i)}
                            className="flex min-h-11 items-center text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:text-text-primary"
                          >
                            {subiendo === i ? t.uploading : t.replace}
                          </FilePicker>
                          {actual && (
                            <button
                              type="button"
                              onClick={() => setPortraits((prev) => prev.filter((_, j) => j !== i))}
                              className="flex min-h-11 items-center text-capitale uppercase tracking-capitale text-text-secondary transition-colors duration-200 ease-curato hover:text-copper-vif"
                            >
                              {t.remove}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            <section className="mb-seccion">
              {/* El contador va en la fila de la etiqueta: es un dato, no un
                  aviso, y el campo no deja pasarse. */}
              <div className="mb-bloque flex items-baseline justify-between gap-fila">
                <label htmlFor={bioId} className="text-capitale uppercase tracking-capitale text-accent">
                  {t.bioLabel}
                </label>
                <span className="text-legende tabular-nums text-text-secondary">
                  {bio.length} / {BIO_MAX}
                </span>
              </div>
              <textarea
                id={bioId}
                value={bio}
                maxLength={BIO_MAX}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.bioPlaceholder}
                className="w-full min-w-0 resize-none border-0 border-b border-transparent bg-transparent py-bloque text-champ font-light italic text-text-primary outline-none transition-colors duration-200 ease-curato placeholder:not-italic placeholder:text-text-muted focus:border-accent"
              />
              <p className="mt-etiqueta max-w-[46ch] text-legende text-text-secondary">{t.bioHint}</p>
            </section>

            {/* Las fotos que enseñan cómo mira, en el orden en que la casa las
                ve en el dossier. Llegan con las de la candidatura: se quitan,
                se añaden, seis como máximo. */}
            <Section title={t.estiloTitle} hint={t.estiloHint}>
              <div className="grid grid-cols-3 gap-bloque">
                {estilo.map((f) => (
                  <div key={f.path} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-raised">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEstilo((prev) => prev.filter((x) => x.path !== f.path))}
                      aria-label={t.estiloRemove}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(245,239,228,0.28)] bg-[rgba(20,20,20,0.55)] text-corps text-text-primary backdrop-blur-md"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {estilo.length < ESTILO_MAX && (
                  <FilePicker
                    accept={ACCEPT}
                    disabled={subiendoEstilo}
                    onFiles={subirEstilo}
                    className="flex aspect-[4/5] flex-col items-center justify-center gap-etiqueta rounded-2xl border border-[rgba(245,239,228,0.24)] bg-[rgba(245,239,228,0.08)] px-bloque text-center backdrop-blur-md transition-colors duration-200 ease-curato hover:bg-[rgba(245,239,228,0.14)]"
                  >
                    <span className="text-sous-titre font-light text-accent">+</span>
                    <span className="text-capitale uppercase tracking-capitale text-text-primary">
                      {subiendoEstilo ? t.uploading : t.estiloAdd}
                    </span>
                  </FilePicker>
                )}
              </div>
            </Section>

            <section className="mb-seccion">
              <p className="mb-bloque text-capitale uppercase tracking-capitale text-accent">{t.subjects}</p>
              {SUBJECTS.map((s) => {
                const marcada = subjects.includes(s.slug);
                return (
                  <Choice
                    key={s.slug}
                    checked={marcada}
                    onChange={(on) =>
                      setSubjects((prev) =>
                        on ? (prev.length >= SUBJECT_MAX ? prev : [...prev, s.slug]) : prev.filter((x) => x !== s.slug)
                      )
                    }
                  >
                    {s[lang] ?? s.fr}
                  </Choice>
                );
              })}
              <p className={`mt-etiqueta max-w-[46ch] text-legende ${temasDeMas ? "text-copper-vif" : "text-text-secondary"}`}>
                {temasDeMas ? t.subjectsOver : t.subjectsHint}
              </p>
            </section>

            {error && (
              <StateMark tono="caido" capital={error.cap ?? t.failCap}>
                {error.texto}
              </StateMark>
            )}
          </div>

          <footer
            className="sticky bottom-0 z-10 px-pagina pt-fila backdrop-blur-md"
            style={{
              backgroundColor: "rgba(20,20,20,0.92)",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex flex-col gap-fila">
              {cambiado && <p className="text-capitale uppercase tracking-capitale text-copper-vif">{t.unsaved}</p>}
              <Button full onClick={guardar} disabled={!cambiado || temasDeMas || guardando || subiendo !== null || subiendoEstilo}>
                {guardando ? t.saving : t.save}
              </Button>
              <p className="max-w-[46ch] text-legende text-text-secondary">{t.footnote}</p>
            </div>
          </footer>
        </div>
      </SlideIn>
    </div>
  );
}
