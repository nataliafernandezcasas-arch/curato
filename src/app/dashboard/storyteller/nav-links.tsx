import type { NavLink } from "../dashboard-nav";

type T = { navAddresses: string; navVisits: string; navProfile: string };

/** The storyteller's four places, in the order they appear in the menu. */
export function STORYTELLER_LINKS(
  t: T,
  current: "addresses" | "visits" | "profile" | "reglages"
): NavLink[] {
  return [
    { href: "/dashboard/storyteller", label: t.navAddresses, active: current === "addresses" },
    { href: "/dashboard/storyteller/visits", label: t.navVisits, active: current === "visits" },
    { href: "/dashboard/storyteller/profil", label: t.navProfile, active: current === "profile" },
  ];
}
