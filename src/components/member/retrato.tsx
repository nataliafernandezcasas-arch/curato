/**
 * La cara de un storyteller en una lista: su retrato o, si no subió ninguno,
 * sus iniciales. Redonda y pequeña, para ir junto al nombre sin quitarle sitio.
 */
export function Retrato({ src, nombre, size = 40 }: { src: string | null | undefined; nombre: string; size?: number }) {
  const iniciales =
    nombre
      .replace(/^@/, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised text-capitale tracking-capitale text-text-secondary"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nombre} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{iniciales}</span>
      )}
    </span>
  );
}
