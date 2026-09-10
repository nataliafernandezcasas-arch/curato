/**
 * La marca de estado: una sola anatomía para lo cumplido, lo que tiene plazo y
 * lo que se ha caído.
 *
 * Antes eran dos gramáticas para la misma función: el éxito era una capital
 * suelta y el error un filete con un título de 19 px. Ahora los tres son lo
 * mismo, cambiando solo el color (entrega 4, 10 septies):
 *
 *   1. un filete de 24 × 2 px en el color vivo,
 *   2. una capital en ese mismo color,
 *   3. la frase en tinta plena, nunca en el color del estado: el color dice de
 *      qué tipo es el mensaje, el contenido se lee en tinta.
 *
 * Sin caja y sin fondo. Si hay que reintentar, el botón va debajo.
 */
export type Tono = "cumplido" | "plazo" | "caido";

const COLOR: Record<Tono, { filete: string; capital: string }> = {
  cumplido: { filete: "bg-sauge-vif", capital: "text-sauge-vif" },
  plazo: { filete: "bg-copper-vif", capital: "text-copper-vif" },
  caido: { filete: "bg-burgundy-vif", capital: "text-burgundy-vif" },
};

export function StateMark({
  tono,
  capital,
  children,
  accion,
  className,
}: {
  tono: Tono;
  /** Dos o tres palabras en capital: qué tipo de cosa ha pasado. */
  capital: React.ReactNode;
  /** La frase, en tinta plena. Qué ha pasado y qué no se ha perdido. */
  children?: React.ReactNode;
  /** Un solo botón, debajo, si hay algo que reintentar. */
  accion?: React.ReactNode;
  className?: string;
}) {
  const c = COLOR[tono];
  return (
    <div role={tono === "caido" ? "alert" : "status"} className={className}>
      <span aria-hidden className={`block h-[2px] w-6 ${c.filete}`} />
      <p className={`mt-bloque text-capitale uppercase tracking-capitale ${c.capital}`}>{capital}</p>
      {children && <p className="mt-etiqueta max-w-[46ch] text-corps text-text-primary">{children}</p>}
      {accion && <div className="mt-fila">{accion}</div>}
    </div>
  );
}
