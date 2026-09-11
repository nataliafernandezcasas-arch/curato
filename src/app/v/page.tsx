"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/member/auth-shell";
import { Button } from "@/components/member/button";
import { Field } from "@/components/member/field";
import { useLang } from "@/lib/i18n/LanguageContext";
import { esCodigoValido, normalizarCodigo } from "@/lib/check-in";

const TEXTOS = {
  fr: { title: "Votre visite", subtitle: "Le code est affiché par la maison, sous son QR.", label: "Code de la maison", send: "Enregistrer ma visite", hint: "Trois lettres et trois chiffres." },
  en: { title: "Your visit", subtitle: "The house shows the code under its QR.", label: "House code", send: "Record my visit", hint: "Three letters and three digits." },
  es: { title: "Tu visita", subtitle: "La maison enseña el código bajo su QR.", label: "Código de la maison", send: "Registrar mi visita", hint: "Tres letras y tres cifras." },
};

/**
 * Cuando la cámara no lee el QR: el mismo código, tecleado. Es la red de
 * seguridad del QR claro sobre fondo oscuro, que algunos lectores no leen.
 */
export default function VisiteManuellePage() {
  const { lang } = useLang();
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const router = useRouter();
  const [valor, setValor] = useState("");
  const codigo = normalizarCodigo(valor);

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (esCodigoValido(codigo)) router.push(`/v/${codigo}`);
        }}
        className="space-y-rango"
      >
        <Field
          label={t.label}
          hint={t.hint}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="MRC 418"
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
        />
        <Button type="submit" full disabled={!esCodigoValido(codigo)}>
          {t.send}
        </Button>
      </form>
    </AuthShell>
  );
}
