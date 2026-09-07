/**
 * La fila estrecha.
 *
 * Toda fila del producto es una rejilla de dos columnas: la etiqueta cede, el
 * valor nunca. Es la regla que arregla de una vez la agenda semanal, el nombre
 * junto a las cifras y las pestañas, que son los tres sitios donde hoy la
 * página se desplaza en horizontal.
 *
 * Sin borde y sin línea: lo que separa una fila de la siguiente es el aire y el
 * objetivo táctil de 44 px, no un recuadro.
 */
export function Row({
  label,
  value,
  aside,
  name = false,
  className,
}: {
  label: React.ReactNode;
  /** Cifra, hora o estado. Nunca se comprime ni se parte. */
  value?: React.ReactNode;
  /** Un tercer dato baja a su propia línea bajo la etiqueta. */
  aside?: React.ReactNode;
  /** Un nombre propio parte a dos líneas. Cortarlo es una falta de respeto. */
  name?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-fila ${className ?? ""}`}
    >
      <div className="min-w-0">
        <div className={name ? "break-words" : "truncate"}>{label}</div>
        {aside && <div className="mt-etiqueta min-w-0 truncate">{aside}</div>}
      </div>
      {value != null && (
        <div className="shrink-0 text-right tabular-nums">{value}</div>
      )}
    </div>
  );
}
