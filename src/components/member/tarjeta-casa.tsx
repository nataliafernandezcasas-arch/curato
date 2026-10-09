"use client";

import Link from "next/link";
import { Photo } from "@/components/member/motion";
import { Row } from "@/components/member/row";
import { translations, type Lang } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/pick-lang";

/** Lo que enseña la tarjeta de una casa. */
export type CasaTarjeta = {
  id: string;
  name: string;
  arrondissement: string | null;
  address: string | null;
  description: string | null;
  description_en: string | null;
  description_es: string | null;
  photos: string[] | null;
  signed_at: string | null;
  category_id: string | null;
  /** La oferta por visita, en euros (migración 043). */
  offer_eur?: number | null;
};

// Las categorías canónicas de la migración 009.
const CATEGORY_BY_ID: Record<string, string> = {
  "00000000-0000-0000-0000-0000000ca701": "hoteles",
  "00000000-0000-0000-0000-0000000ca702": "gastronomia",
  "00000000-0000-0000-0000-0000000ca703": "wellness",
  "00000000-0000-0000-0000-0000000ca704": "belleza",
};
const SLUG_LABEL_KEY = {
  gastronomia: "catGastronomy",
  hoteles: "catHotels",
  wellness: "catWellness",
  belleza: "catBeauty",
} as const;

export function slugDeCategoria(categoryId: string | null): string | null {
  return categoryId ? CATEGORY_BY_ID[categoryId] ?? null : null;
}

export function etiquetaDeCategoria(categoryId: string | null, lang: Lang): string {
  const slug = slugDeCategoria(categoryId);
  const key = slug ? SLUG_LABEL_KEY[slug as keyof typeof SLUG_LABEL_KEY] : null;
  return key ? translations[lang].dashboard[key] : "";
}

/** Una casa firmada hace menos de 45 días es «Nouveau». */
export function esNueva(signedAt: string | null): boolean {
  return Boolean(signedAt) && Date.now() - new Date(signedAt!).getTime() < 45 * 24 * 60 * 60 * 1000;
}

/**
 * La tarjeta de una casa: foto, nombre, distrito, categoría, descripción y
 * dirección. La misma en Adresses y en Mes visites, para que una visita se
 * reconozca por la casa y no por una fila de texto.
 */
export function TarjetaCasa({ casa, lang, href }: { casa: CasaTarjeta; lang: Lang; href?: string }) {
  const t = translations[lang].dashboard;
  const label = etiquetaDeCategoria(casa.category_id, lang);
  const cuerpo = (
    <>
      {casa.photos?.[0] ? (
        <Photo src={casa.photos[0]} alt={casa.name} className="aspect-[4/3] bg-surface-raised" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-surface-raised">
          <p className="text-capitale uppercase tracking-capitale text-text-muted">{label}</p>
        </div>
      )}

      <div className="mt-fila">
        <Row
          name
          label={
            <h3 className="text-sous-titre text-text-primary transition-colors group-hover:text-accent">{casa.name}</h3>
          }
          value={
            // A la derecha, lo que ofrece la casa: es lo que decide. Sin oferta,
            // el distrito, como antes.
            casa.offer_eur ? (
              <span className="text-sous-titre tabular-nums text-accent">{casa.offer_eur.toLocaleString(lang)} €</span>
            ) : casa.arrondissement ? (
              <span className="text-capitale uppercase tracking-capitale text-brume">Paris {casa.arrondissement}</span>
            ) : undefined
          }
        />

        <p className="mt-etiqueta text-legende text-text-secondary">
          {label}
          {casa.offer_eur && casa.arrondissement ? ` · Paris ${casa.arrondissement}` : ""}
          {esNueva(casa.signed_at) && (
            <span className="ml-fila text-capitale uppercase tracking-capitale text-accent">{t.badgeNew}</span>
          )}
        </p>

        {/* La descripción en el idioma del storyteller; si la casa no la ha
            traducido, la francesa. */}
        {casa.description && (
          <p className="mt-bloque line-clamp-3 text-corps text-text-secondary">
            {pickLang({ fr: casa.description, en: casa.description_en, es: casa.description_es }, lang)}
          </p>
        )}

        {casa.address && <p className="mt-bloque text-legende text-text-muted">{casa.address}</p>}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="group block">
      {cuerpo}
    </Link>
  ) : (
    <div>{cuerpo}</div>
  );
}
