import type { NavLink } from "../dashboard-nav";

export type MaisonSection = "profile" | "roster" | "visitors" | "directory" | "billing";

type T = { tabProfile: string; tabRoster: string; tabVisitors: string; tabDirectory: string };

const SECTIONS: string[] = ["profile", "roster", "visitors", "directory", "billing"];

export function isMaisonSection(value: string | null): value is MaisonSection {
  return !!value && SECTIONS.includes(value);
}

/**
 * The maison's five sections.
 *
 * They used to be a row of buttons inside the page. Five of them never fit
 * across a phone, so the row ran off the right edge and took the page with it.
 * They are links now: the top bar on a laptop, the menu on a phone, and each
 * one carries its own address, so the back button and a shared link both work.
 */
export function MAISON_LINKS(t: T, current: MaisonSection | "reglages"): NavLink[] {
  const at = (section: MaisonSection) =>
    section === "profile" ? "/dashboard/business" : `/dashboard/business?section=${section}`;

  return [
    { href: at("profile"), label: t.tabProfile, active: current === "profile" },
    { href: at("roster"), label: t.tabRoster, active: current === "roster" },
    { href: at("visitors"), label: t.tabVisitors, active: current === "visitors" },
    { href: at("directory"), label: t.tabDirectory, active: current === "directory" },
    { href: at("billing"), label: "Facturation", active: current === "billing" },
  ];
}
