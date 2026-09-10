import type { NavLink } from "../dashboard-nav";

export type MaisonSection = "profile" | "demandes" | "roster" | "visitors" | "directory" | "billing";

type T = { tabProfile: string; tabDemandes: string; tabRoster: string; tabVisitors: string; tabDirectory: string };

const SECTIONS: string[] = ["profile", "demandes", "roster", "visitors", "directory", "billing"];

export function isMaisonSection(value: string | null): value is MaisonSection {
  return !!value && SECTIONS.includes(value);
}

/**
 * The maison's sections.
 *
 * They used to be a row of buttons inside the page. Five of them never fit
 * across a phone, so the row ran off the right edge and took the page with it.
 * They are links now: the top bar on a laptop, the menu on a phone, and each
 * one carries its own address, so the back button and a shared link both work.
 *
 * El orden decide qué va en la barra de abajo: las tres primeras (MAX_DESTINOS)
 * y el resto al menú. Demandes va primera porque es lo único del tablero con
 * plazo y con alguien esperando al otro lado (entrega 4, 10 duodecies). El
 * carnet de casas baja al menú: es pertenencia y se visita una vez al mes. La
 * oferta vive dentro de Ma maison, así que esa es la tercera.
 */
export function MAISON_LINKS(t: T, current: MaisonSection | "reglages"): NavLink[] {
  const at = (section: MaisonSection) =>
    section === "profile" ? "/dashboard/business" : `/dashboard/business?section=${section}`;

  return [
    { href: at("demandes"), label: t.tabDemandes, active: current === "demandes" },
    { href: at("visitors"), label: t.tabVisitors, active: current === "visitors" },
    { href: at("profile"), label: t.tabProfile, active: current === "profile" },
    { href: at("roster"), label: t.tabRoster, active: current === "roster" },
    { href: at("directory"), label: t.tabDirectory, active: current === "directory" },
    { href: at("billing"), label: "Facturation", active: current === "billing" },
  ];
}
