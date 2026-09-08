import Link from "next/link";

/**
 * El botón.
 *
 * Es la única forma cerrada de todo el producto: un borde de 1 px, esquinas
 * rectas, 44 px de alto y una capital dentro. Precisamente porque no hay
 * ninguna otra caja, se reconoce sin que nadie lo explique.
 *
 * El champagne aquí es tinta, no fondo. El bloque relleno que había antes
 * competía con la fotografía y era lo más ruidoso de cada pantalla.
 */
type Common = {
  children: React.ReactNode;
  /** Ocupa el ancho de su columna. En un móvil casi siempre sí. */
  full?: boolean;
  className?: string;
};

const base =
  "inline-flex min-h-11 items-center justify-center border border-[rgba(203,183,143,0.3)] px-fila text-capitale uppercase tracking-capitale text-accent transition-colors duration-200 ease-curato hover:border-accent hover:text-text-primary disabled:pointer-events-none disabled:opacity-45";

export function Button({
  full,
  className,
  children,
  ...button
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...button} className={`${base} ${full ? "w-full" : ""} ${className ?? ""}`}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  full,
  className,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={`${base} ${full ? "w-full" : ""} ${className ?? ""}`}>
      {children}
    </Link>
  );
}
