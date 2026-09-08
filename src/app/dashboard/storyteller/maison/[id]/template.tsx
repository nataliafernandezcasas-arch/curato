import { SlideIn } from "@/components/member/slide-in";

// Un detalle se abre desde la derecha. El template se remonta cuando cambia el
// segmento, así que la animación ocurre al abrir otra maison o al pasar a la
// reserva, y no al volver a pintar la misma pantalla.
export default function Template({ children }: { children: React.ReactNode }) {
  return <SlideIn>{children}</SlideIn>;
}
