"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/translations";
import { Plegable } from "@/components/member/plegable";
import { Row } from "@/components/member/row";
import { Button } from "@/components/member/button";
import { X } from "@/components/member/iconos";

type Persona = { id: string; email: string; nombre: string | null };

const TEXTOS: Record<
  Lang,
  {
    titulo: string;
    intro: string;
    titular: string;
    nombre: string;
    email: string;
    anadir: string;
    anadiendo: string;
    quitar: string;
    soloTitular: string;
    enviado: (e: string) => string;
    errores: Record<string, string>;
  }
> = {
  fr: {
    titulo: "Équipe",
    intro: "Ajoutez les personnes de votre maison qui reçoivent les storytellers : la salle, la direction, la communication. Chacune entre avec son e-mail et voit les demandes, le calendrier et le rapport. La facturation reste au compte de la maison.",
    titular: "Compte de la maison",
    nombre: "Prénom et nom",
    email: "E-mail",
    anadir: "Ajouter à l'équipe",
    anadiendo: "Un instant…",
    quitar: "Retirer de l'équipe",
    soloTitular: "Seul le compte de la maison peut ajouter ou retirer quelqu'un.",
    enviado: (e) => `${e} a reçu un e-mail pour accéder à Curato.`,
    errores: {
      email: "Cette adresse e-mail n'est pas valide.",
      titular: "C'est déjà le compte de la maison.",
      lleno: "L'équipe compte déjà dix personnes.",
      migracion: "L'équipe n'est pas encore disponible. Réessayez plus tard.",
      otro: "Ça n'a pas fonctionné. Réessayez dans un instant.",
    },
  },
  en: {
    titulo: "Team",
    intro: "Add the people at your house who welcome storytellers: front of house, management, communications. Each signs in with their own email and sees requests, the calendar and the report. Billing stays with the house account.",
    titular: "House account",
    nombre: "First and last name",
    email: "Email",
    anadir: "Add to the team",
    anadiendo: "One moment…",
    quitar: "Remove from the team",
    soloTitular: "Only the house account can add or remove someone.",
    enviado: (e) => `${e} has received an email to access Curato.`,
    errores: {
      email: "This email address isn't valid.",
      titular: "That's already the house account.",
      lleno: "The team already has ten people.",
      migracion: "The team isn't available yet. Try again later.",
      otro: "That didn't work. Try again in a moment.",
    },
  },
  es: {
    titulo: "Equipo",
    intro: "Añade a las personas de tu casa que reciben a los storytellers: sala, dirección, comunicación. Cada una entra con su correo y ve las demandas, el calendario y el informe. La facturación se queda en la cuenta de la casa.",
    titular: "Cuenta de la casa",
    nombre: "Nombre y apellido",
    email: "Correo",
    anadir: "Añadir al equipo",
    anadiendo: "Un momento…",
    quitar: "Quitar del equipo",
    soloTitular: "Solo la cuenta de la casa puede añadir o quitar a alguien.",
    enviado: (e) => `${e} ha recibido un correo para entrar en Curato.`,
    errores: {
      email: "Este correo no es válido.",
      titular: "Esa ya es la cuenta de la casa.",
      lleno: "El equipo ya tiene diez personas.",
      migracion: "El equipo aún no está disponible. Vuelve a intentarlo más tarde.",
      otro: "No ha funcionado. Vuelve a intentarlo en un momento.",
    },
  },
};

/** El equipo de la casa, en Réglages (migración 055). */
export function Equipo({ lang }: { lang: Lang }) {
  const t = TEXTOS[lang] ?? TEXTOS.fr;
  const [datos, setDatos] = useState<{ titular: string; esTitular: boolean; equipo: Persona[] } | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/maison/equipo", { cache: "no-store" }).catch(() => null);
    if (res?.ok) setDatos(await res.json());
  }, []);
  useEffect(() => {
    let vivo = true;
    fetch("/api/maison/equipo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d && setDatos(d))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  async function anadir(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    const res = await fetch("/api/maison/equipo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre }),
    }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setEnviando(false);
    if (res?.ok) {
      setAviso({ ok: true, texto: t.enviado(email.trim().toLowerCase()) });
      setEmail("");
      setNombre("");
      void cargar();
    } else {
      setAviso({ ok: false, texto: t.errores[d?.error ?? ""] ?? t.errores.otro });
    }
  }

  async function quitar(id: string) {
    const res = await fetch("/api/maison/equipo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (res?.ok) void cargar();
  }

  if (!datos) return null;

  return (
    <Plegable titulo={t.titulo}>
      <p className="text-legende text-text-secondary">{t.intro}</p>
      <div className="mt-fila">
        <Row
          label={<span className="text-corps text-text-primary">{t.titular}</span>}
          value={<span className="break-all text-legende text-text-secondary">{datos.titular}</span>}
        />
        {datos.equipo.map((p) => (
          <Row
            key={p.id}
            label={
              <span className="block min-w-0">
                <span className="block truncate text-corps text-text-primary">{p.nombre || p.email}</span>
                {p.nombre && <span className="block truncate text-legende text-text-secondary">{p.email}</span>}
              </span>
            }
            value={
              datos.esTitular ? (
                <button type="button" onClick={() => quitar(p.id)} aria-label={t.quitar} className="flex h-11 w-11 items-center justify-center text-text-muted hover:text-copper-vif">
                  <X size={18} />
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      {datos.esTitular ? (
        <form onSubmit={anadir} className="mt-fila space-y-bloque">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t.nombre}
            aria-label={t.nombre}
            autoComplete="off"
            className="campo-cristal"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.email}
            aria-label={t.email}
            autoComplete="off"
            required
            className="campo-cristal"
          />
          <div className="pt-bloque">
            <Button type="submit" disabled={enviando || !email.trim()}>
              {enviando ? t.anadiendo : t.anadir}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-fila text-legende text-text-muted">{t.soloTitular}</p>
      )}
      {aviso && <p className={`mt-fila text-legende ${aviso.ok ? "text-sauge-vif" : "text-copper-vif"}`}>{aviso.texto}</p>}
    </Plegable>
  );
}
