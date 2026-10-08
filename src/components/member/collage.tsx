"use client";

import { useState } from "react";
import { Viewer } from "./viewer";

export type Pieza = "alta" | "pequena" | "ancha";

/**
 * El dibujo del collage, en una cuadrícula de dos columnas.
 *
 * Se repite un bloque de cuatro: una foto alta a un lado, dos pequeñas
 * apiladas al otro y una ancha debajo. Cada bloque llena exactamente dos
 * columnas por tres filas, así que no queda ningún hueco. El final se cierra
 * igual: una foto sobrante va ancha; dos, altas una junto a la otra; tres,
 * una alta y dos pequeñas. Los bloques alternan de lado para que no se vea
 * la plantilla.
 */
export function piezasDelCollage(n: number): Pieza[] {
  const out: Pieza[] = [];
  const completos = Math.floor(n / 4);
  for (let b = 0; b < completos; b++) out.push("alta", "pequena", "pequena", "ancha");
  const resto = n % 4;
  if (resto === 1) out.push("ancha");
  if (resto === 2) out.push("alta", "alta");
  if (resto === 3) out.push("alta", "pequena", "pequena");
  return out;
}

const CLASE: Record<Pieza, string> = {
  alta: "row-span-2",
  pequena: "",
  ancha: "col-span-2",
};

/**
 * Las fotos de una casa como collage: todas recortadas a su hueco, sin los
 * espacios vacíos que dejaba el mosaico en columnas cuando una columna
 * acababa antes que la otra. Al tocar una, se abre en grande dentro de la app.
 */
export function Collage({ photos }: { photos: string[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  if (photos.length === 0) return null;
  const piezas = piezasDelCollage(photos.length);

  // Cada bloque de cuatro se refleja: la alta, una vez a la izquierda y otra
  // a la derecha. Con grid-flow-dense las pequeñas rellenan el otro lado.
  return (
    <>
      <div className="grid grid-flow-row-dense grid-cols-2 auto-rows-[132px] gap-1.5 sm:auto-rows-[220px]">
        {photos.map((url, i) => {
          const pieza = piezas[i];
          const derecha = pieza === "alta" && Math.floor(i / 4) % 2 === 1 && photos.length - i > 2;
          return (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setAbierta(i)}
              className={`overflow-hidden rounded-xl bg-surface-raised ${CLASE[pieza]} ${derecha ? "col-start-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 ease-curato hover:scale-105"
              />
            </button>
          );
        })}
      </div>
      <Viewer photos={photos} index={abierta} onClose={() => setAbierta(null)} />
    </>
  );
}
