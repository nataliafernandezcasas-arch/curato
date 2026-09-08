/**
 * Una sección de una pantalla.
 *
 * Sustituye al recuadro: lo que separa un bloque del siguiente son 48 px de
 * aire y una capital en champagne, no un borde. La capital nunca pasa de cuatro
 * palabras, y la instrucción va en tinta al 65 %, que es contraste de lectura,
 * no de decoración.
 */
export function Section({
  title,
  hint,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  /** Una sola cosa que hacer, a la derecha del título. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-seccion ${className ?? ""}`}>
      {(title || action) && (
        <div className="mb-bloque flex items-baseline justify-between gap-fila">
          {title && (
            <h2 className="text-capitale uppercase tracking-capitale text-accent">{title}</h2>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {hint && <p className="mb-fila text-legende text-text-secondary">{hint}</p>}
      {children}
    </section>
  );
}
