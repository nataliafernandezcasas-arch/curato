"use client";

import { Plegable } from "./plegable";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./button";

/**
 * Borrar la cuenta, al final de Réglages.
 *
 * Apple lo exige a toda app con cuentas (norma 5.1.1 v), aunque en Curato las
 * cuentas se abran por invitación. Dos pasos y no uno: no tiene vuelta atrás, y
 * en un teléfono un toque de más es fácil. Pero sin escribir nada para
 * confirmar: el segundo botón dice exactamente lo que va a pasar.
 *
 * El acceso se cierra en el acto; el resto de los datos lo termina el equipo
 * (ver /api/account/delete), y el texto lo dice en vez de prometer un borrado
 * instantáneo que no es verdad.
 */
const T: Record<Lang, {
  title: string;
  body: string;
  privacy: string;
  start: string;
  confirmBody: string;
  confirm: string;
  cancel: string;
  error: string;
}> = {
  fr: {
    title: "Supprimer le compte",
    body: "Votre accès à Curato est fermé immédiatement, sur tous vos espaces. Vos données sont ensuite effacées ou anonymisées par l'équipe Curato, sauf celles que la loi oblige à conserver.",
    privacy: "Politique de confidentialité",
    start: "Supprimer mon compte",
    confirmBody: "C'est définitif. Vous ne pourrez plus vous connecter avec ce compte.",
    confirm: "Oui, supprimer définitivement",
    cancel: "Annuler",
    error: "La suppression n'a pas abouti. Réessayez, ou écrivez à hello@curatocollective.com.",
  },
  en: {
    title: "Delete account",
    body: "Your access to Curato is closed immediately, across all your spaces. Your data is then deleted or anonymised by the Curato team, except what the law requires us to keep.",
    privacy: "Privacy policy",
    start: "Delete my account",
    confirmBody: "This is permanent. You will no longer be able to sign in with this account.",
    confirm: "Yes, delete permanently",
    cancel: "Cancel",
    error: "The deletion did not go through. Try again, or write to hello@curatocollective.com.",
  },
  es: {
    title: "Borrar la cuenta",
    body: "Tu acceso a Curato se cierra en el acto, en todos tus espacios. Después, el equipo de Curato borra o anonimiza tus datos, salvo los que la ley obliga a conservar.",
    privacy: "Política de privacidad",
    start: "Borrar mi cuenta",
    confirmBody: "No tiene vuelta atrás. Ya no podrás entrar con esta cuenta.",
    confirm: "Sí, borrar para siempre",
    cancel: "Cancelar",
    error: "No se pudo borrar. Vuelve a intentarlo o escribe a hello@curatocollective.com.",
  },
};

export function BorrarCuenta() {
  const { lang } = useLang();
  const t = T[lang];
  const [paso, setPaso] = useState<"inicio" | "confirmar">("inicio");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState(false);

  async function borrar() {
    setBorrando(true);
    setError(false);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      // El usuario ya no existe; esto solo limpia las cookies de este aparato.
      await createClient().auth.signOut().catch(() => {});
      window.location.replace("/auth/sign-in");
    } catch {
      setError(true);
      setBorrando(false);
    }
  }

  return (
    <Plegable titulo={t.title}>
      <p className="mb-fila max-w-prose text-legende text-text-secondary">
        {t.body}{" "}
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-text-primary">
          {t.privacy}
        </Link>
      </p>

      {paso === "inicio" ? (
        <Button onClick={() => setPaso("confirmar")}>{t.start}</Button>
      ) : (
        <div>
          <p className="mb-fila max-w-prose text-legende text-text-primary">{t.confirmBody}</p>
          <div className="flex flex-wrap items-center gap-fila">
            <Button onClick={borrar} disabled={borrando}>
              {t.confirm}
            </Button>
            <button
              type="button"
              onClick={() => setPaso("inicio")}
              disabled={borrando}
              className="min-h-11 text-capitale uppercase tracking-capitale text-text-secondary hover:text-text-primary"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-fila max-w-prose text-legende text-text-primary">{t.error}</p>}
    </Plegable>
  );
}
