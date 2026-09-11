"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/member/auth-shell";
import { ButtonLink } from "@/components/member/button";
import { StateMark } from "@/components/member/state-mark";
import { useLang } from "@/lib/i18n/LanguageContext";
import { mostrarCodigo, normalizarCodigo } from "@/lib/check-in";

type Estado =
  | { tipo: "enviando" }
  | { tipo: "ok"; maison: string; ya: boolean }
  | { tipo: "aucune"; maison: string }
  | { tipo: "code" }
  | { tipo: "auth" }
  | { tipo: "creator" }
  | { tipo: "error" };

const TEXTOS = {
  fr: {
    title: "Votre visite",
    sending: "Un instant…",
    okCap: "Visite enregistrée",
    ok: (m: string) => `Votre visite chez ${m} est enregistrée. Bonne visite.`,
    ya: (m: string) => `Votre visite chez ${m} était déjà enregistrée.`,
    stories: "Deux stories dans les 24 heures, avec la maison et Curato mentionnées sur chacune.",
    myVisits: "Mes visites",
    noneCap: "Aucune visite aujourd'hui",
    none: (m: string) => `Nous ne trouvons pas de visite confirmée aujourd'hui chez ${m}. Montrez votre réservation depuis Mes visites.`,
    codeCap: "Code inconnu",
    code: (c: string) => `Le code ${c} ne correspond à aucune maison. Vérifiez-le avec la maison.`,
    typeCode: "Saisir le code",
    authCap: "Connexion",
    auth: "Connectez-vous à Curato, puis scannez de nouveau le code de la maison.",
    signIn: "Se connecter",
    creator: "Ce code sert à enregistrer la visite d'un storyteller. Votre compte n'en est pas un.",
    errorCap: "Non enregistrée",
    error: "La connexion s'est interrompue. Scannez de nouveau le code dans un instant.",
  },
  en: {
    title: "Your visit",
    sending: "One moment…",
    okCap: "Visit recorded",
    ok: (m: string) => `Your visit to ${m} is recorded. Enjoy it.`,
    ya: (m: string) => `Your visit to ${m} was already recorded.`,
    stories: "Two stories within 24 hours, with the house and Curato tagged on each.",
    myVisits: "My visits",
    noneCap: "No visit today",
    none: (m: string) => `We can't find a confirmed visit at ${m} today. Show your booking from My visits.`,
    codeCap: "Unknown code",
    code: (c: string) => `The code ${c} doesn't match any house. Check it with the house.`,
    typeCode: "Type the code",
    authCap: "Sign in",
    auth: "Sign in to Curato, then scan the house's code again.",
    signIn: "Sign in",
    creator: "This code records a storyteller's visit. Your account isn't one.",
    errorCap: "Not recorded",
    error: "The connection dropped. Scan the code again in a moment.",
  },
  es: {
    title: "Tu visita",
    sending: "Un momento…",
    okCap: "Visita registrada",
    ok: (m: string) => `Tu visita en ${m} está registrada. Que la disfrutes.`,
    ya: (m: string) => `Tu visita en ${m} ya estaba registrada.`,
    stories: "Dos stories en las 24 horas, con la maison y Curato mencionadas en cada una.",
    myVisits: "Mis visitas",
    noneCap: "Ninguna visita hoy",
    none: (m: string) => `No encontramos una visita confirmada hoy en ${m}. Enseña tu reserva desde Mis visitas.`,
    codeCap: "Código desconocido",
    code: (c: string) => `El código ${c} no corresponde a ninguna maison. Compruébalo con la casa.`,
    typeCode: "Escribir el código",
    authCap: "Acceso",
    auth: "Entra en Curato y vuelve a escanear el código de la maison.",
    signIn: "Entrar",
    creator: "Este código registra la visita de un storyteller. Tu cuenta no lo es.",
    errorCap: "No registrada",
    error: "Se cortó la conexión. Vuelve a escanear el código en un momento.",
  },
};

/**
 * Lo que abre el QR de sala en el móvil del storyteller: registra la visita de
 * hoy y lo dice. Sin botón que pulsar: escanear ya es el gesto.
 */
export default function VisitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const codigo = normalizarCodigo(decodeURIComponent(code));
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [estado, setEstado] = useState<Estado>({ tipo: "enviando" });

  useEffect(() => {
    fetch("/api/visite/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codigo }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok) return setEstado({ tipo: "ok", maison: body.maison, ya: Boolean(body.ya) });
        if (body.error === "aucune") return setEstado({ tipo: "aucune", maison: body.maison });
        if (body.error === "code") return setEstado({ tipo: "code" });
        if (body.error === "auth") return setEstado({ tipo: "auth" });
        if (body.error === "creator") return setEstado({ tipo: "creator" });
        setEstado({ tipo: "error" });
      })
      .catch(() => setEstado({ tipo: "error" }));
  }, [codigo]);

  const visitas = <ButtonLink href="/dashboard/storyteller/visits">{t.myVisits}</ButtonLink>;

  return (
    <AuthShell title={t.title}>
      {estado.tipo === "enviando" && <p className="text-center text-corps text-text-secondary">{t.sending}</p>}

      {estado.tipo === "ok" && (
        <StateMark tono="cumplido" capital={t.okCap} accion={visitas}>
          {estado.ya ? t.ya(estado.maison) : t.ok(estado.maison)} {t.stories}
        </StateMark>
      )}

      {estado.tipo === "aucune" && (
        <StateMark tono="plazo" capital={t.noneCap} accion={visitas}>
          {t.none(estado.maison)}
        </StateMark>
      )}

      {estado.tipo === "code" && (
        <StateMark tono="caido" capital={t.codeCap} accion={<ButtonLink href="/v">{t.typeCode}</ButtonLink>}>
          {t.code(mostrarCodigo(codigo))}
        </StateMark>
      )}

      {estado.tipo === "auth" && (
        <StateMark tono="plazo" capital={t.authCap} accion={<ButtonLink href="/auth/sign-in">{t.signIn}</ButtonLink>}>
          {t.auth}
        </StateMark>
      )}

      {estado.tipo === "creator" && (
        <StateMark tono="plazo" capital={t.codeCap}>
          {t.creator}
        </StateMark>
      )}

      {estado.tipo === "error" && (
        <StateMark tono="caido" capital={t.errorCap}>
          {t.error}{" "}
          <Link href={`/v/${codigo}`} className="text-accent underline underline-offset-4">
            {mostrarCodigo(codigo)}
          </Link>
        </StateMark>
      )}
    </AuthShell>
  );
}
