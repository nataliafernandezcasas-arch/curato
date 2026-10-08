// Lo que ofrece una casa por visita, en euros, según su categoría. La casa
// elige dentro de su rango; el storyteller lo gasta libremente en la carta y se
// le descuenta de su crédito del mes (src/lib/credito.ts).

export const CATEGORIA = {
  hotel: "00000000-0000-0000-0000-0000000ca701",
  gastronomia: "00000000-0000-0000-0000-0000000ca702",
  wellness: "00000000-0000-0000-0000-0000000ca703",
  belleza: "00000000-0000-0000-0000-0000000ca704",
} as const;

export type Rango = { min: number; max: number };

const RANGOS: Record<string, Rango> = {
  [CATEGORIA.hotel]: { min: 300, max: 500 },
  [CATEGORIA.gastronomia]: { min: 150, max: 200 },
  [CATEGORIA.wellness]: { min: 75, max: 100 },
  [CATEGORIA.belleza]: { min: 75, max: 100 },
};

/** El rango de una categoría. Sin categoría, el más amplio, para no bloquear. */
export function rangoDe(categoryId: string | null | undefined): Rango {
  return (categoryId && RANGOS[categoryId]) || { min: 75, max: 500 };
}

export function enRango(eur: number, rango: Rango): boolean {
  return Number.isInteger(eur) && eur >= rango.min && eur <= rango.max;
}
