"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "storyteller" | "maison" | "recruiter";
type Roles = { storyteller: boolean; maison: boolean; recruiter: boolean };

const SPACES: { role: Role; href: string; label: string }[] = [
  { role: "storyteller", href: "/dashboard/storyteller", label: "Storyteller" },
  { role: "maison", href: "/dashboard/business", label: "Maison" },
  { role: "recruiter", href: "/dashboard/recruiter", label: "Recruiter" },
];

// Cross-links to the other Curato spaces this account holds. Renders nothing if
// the person has only the current role (the common case).
export default function RoleSwitch({ current }: { current: Role }) {
  const [roles, setRoles] = useState<Roles | null>(null);

  useEffect(() => {
    fetch("/api/me/roles", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRoles(d))
      .catch(() => {});
  }, []);

  if (!roles) return null;
  const others = SPACES.filter((s) => s.role !== current && roles[s.role]);
  if (others.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-3">
      <span className="font-serif text-[10px] tracking-[0.25em] uppercase text-white/25">Espaces</span>
      {others.map((s) => (
        <Link
          key={s.role}
          href={s.href}
          className="font-serif text-[11px] tracking-[0.15em] uppercase text-champagne/70 hover:text-champagne transition-colors"
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
