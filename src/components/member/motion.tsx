"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * El movimiento de la zona de miembro.
 *
 * En una marca silenciosa el movimiento tiene que ser casi imperceptible. El
 * texto no viaja: aparece asentándose, y baja, no sube. Nada rebota, nada gira,
 * ninguna caja escala. La cuenta atrás se lee, no corre.
 *
 * El sitio público tiene su propio juego en `components/home/motion.tsx`, más
 * expresivo porque ahí hay que seducir a quien no conoce Curato. Aquí dentro ya
 * es miembro.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** El texto se asienta: 420 ms, opacidad y 8 px de bajada. */
export function riseVariants(reduce: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : -8 },
    shown: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0.12 : 0.42,
        // Escalonado de 70 ms, cortado al cuarto: una lista de veinte no puede
        // tardar segundo y medio en aparecer entera.
        delay: reduce ? 0 : Math.min(i, 3) * 0.07,
        ease: EASE,
      },
    }),
  };
}

/** La foto se acerca: 900 ms desde 1.04. Una vez, al entrar en pantalla. */
export function photoVariants(reduce: boolean): Variants {
  return {
    hidden: { opacity: 0, scale: reduce ? 1 : 1.04 },
    shown: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduce ? 0.12 : 0.9, ease: EASE },
    },
  };
}

/** Los paneles: 260 ms al abrir, 140 ms al cerrar. Se va más rápido de lo que llega. */
export const panelTransition = { duration: 0.26, ease: EASE };
export const panelExitTransition = { duration: 0.14, ease: EASE };

const VIEWPORT = { once: true, margin: "-10%" } as const;
const IMMEDIATE_VIEWPORT = { once: true, amount: 0 } as const;

// Los tipos se crean una vez. Creándolos dentro del render, `motion[as]`
// devuelve un componente nuevo en cada pasada, React lo trata como otro tipo y
// remonta el subárbol entero: la animación vuelve a empezar y nunca termina.
const TAGS = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
} as const;

/**
 * Un elemento que se asienta al entrar en pantalla.
 *
 * `index` escalona hermanos. `as` deja usar el elemento correcto: un título
 * sigue siendo un h1 aunque se anime.
 *
 * `immediate` es para pantallas que no hacen scroll, como las de entrada. El
 * revelado normal espera a que el elemento entre un 10 % dentro de la ventana,
 * y en una pantalla sin scroll lo que nace por debajo de esa línea no entra
 * jamás: se queda invisible para siempre. Ahí se anima al montar y punto.
 */
export function Rise({
  children,
  index = 0,
  className,
  as = "div",
  immediate = false,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: keyof typeof TAGS;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const Component = TAGS[as];

  const hidden = { opacity: 0, y: reduce ? 0 : -8 };
  const shown = {
    opacity: 1,
    y: 0,
    transition: {
      duration: reduce ? 0.12 : 0.42,
      // Escalonado de 70 ms, cortado al cuarto: una lista de veinte no puede
      // tardar segundo y medio en aparecer entera.
      delay: reduce ? 0 : Math.min(index, 3) * 0.07,
      ease: EASE,
    },
  };

  // Los dos caminos revelan al entrar en pantalla, y a propósito. Lo que
  // cambia es el umbral: el normal espera a que el elemento entre un 10 %
  // dentro de la ventana, que es lo correcto para una lista larga; `immediate`
  // se contenta con que asome un píxel, que es lo que necesita una pantalla sin
  // scroll, donde lo que nace por debajo de esa línea del 10 % no entraría
  // jamás y se quedaría invisible para siempre.
  return (
    <Component
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={immediate ? IMMEDIATE_VIEWPORT : VIEWPORT}
    >
      {children}
    </Component>
  );
}

/** Una fotografía que se acerca al entrar. Nunca en hover: en un móvil no hay hover. */
export function Photo({
  src,
  alt = "",
  className,
  imgClassName,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={`overflow-hidden ${className ?? ""}`}
      variants={photoVariants(reduce)}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClassName ?? ""}`} />
    </motion.div>
  );
}
