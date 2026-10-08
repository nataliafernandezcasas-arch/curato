import type { Lang } from "./translations";

// Las palabras sueltas que repiten muchos componentes (botones de cerrar,
// mostrar u ocultar una contraseña, quitar algo de una lista…). Un sitio solo
// para que no acabe cada uno con su propia traducción, o sin ninguna.
export const COMUN: Record<Lang, {
  close: string;
  show: string;
  hide: string;
  remove: string;
  menu: string;
  moveBefore: string;
  moveAfter: string;
}> = {
  fr: { close: "Fermer", show: "Afficher", hide: "Masquer", remove: "Supprimer", menu: "Menu", moveBefore: "Avancer", moveAfter: "Reculer" },
  en: { close: "Close", show: "Show", hide: "Hide", remove: "Remove", menu: "Menu", moveBefore: "Move earlier", moveAfter: "Move later" },
  es: { close: "Cerrar", show: "Mostrar", hide: "Ocultar", remove: "Quitar", menu: "Menú", moveBefore: "Adelantar", moveAfter: "Atrasar" },
};
