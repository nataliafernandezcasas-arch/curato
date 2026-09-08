"use client";

/**
 * Una opción que se marca: una casilla de consentimiento o una respuesta.
 *
 * La casilla del sistema operativo se va. En su lugar, un punto: hueco cuando
 * no está marcado, lleno de champagne cuando sí. Un círculo no es una caja, y
 * el punto es exactamente el mismo gesto que usa el resto del producto para
 * decir "esto es tuyo y está activo".
 *
 * La fila entera es el objetivo táctil, no la palabra ni el punto. Nadie
 * debería tener que apuntar a catorce píxeles con el pulgar.
 */
export function Choice({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`group grid w-full min-h-11 grid-cols-[auto_minmax(0,1fr)] items-start gap-fila py-bloque text-left ${className ?? ""}`}
    >
      <span
        aria-hidden
        className={`mt-1 block h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-200 ease-curato ${
          checked
            ? "border-accent bg-accent"
            : "border-text-muted bg-transparent group-hover:border-accent"
        }`}
      />
      <span
        className={`text-corps transition-colors duration-200 ease-curato ${
          checked ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
        }`}
      >
        {children}
      </span>
    </button>
  );
}
