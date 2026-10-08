/**
 * La flor de la tarjeta de Curato, abajo a la izquierda y fundida con el
 * burdeos. Es el fondo de las dos pantallas del código de visita: la del
 * storyteller, que lo enseña, y el escáner de la casa, que lo lee.
 */
export function FlorDeFondo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-0 left-0 h-[300px] w-[300px] bg-no-repeat"
      style={{
        backgroundImage: "url(/carte-visite-curato.png)",
        backgroundSize: "auto 300px",
        backgroundPosition: "left bottom",
        opacity: 0.55,
        maskImage: "radial-gradient(circle at 30% 70%, black 35%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(circle at 30% 70%, black 35%, transparent 72%)",
      }}
    />
  );
}

/**
 * Una franja del color de la pantalla bajo la hora y la batería. Al desplazar,
 * el texto pasa por debajo en vez de mezclarse con la barra del sistema.
 */
export function FranjaSuperior({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none sticky top-0 z-10 w-full"
      style={{
        height: "env(safe-area-inset-top, 0px)",
        // No ocupa sitio: el contenido ya deja ese hueco con su propio relleno.
        marginBottom: "calc(-1 * env(safe-area-inset-top, 0px))",
        backgroundColor: color,
      }}
    />
  );
}
