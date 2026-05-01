"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";
import MidiLogo from "../midi-logo";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/creadores", label: "Creadores" },
    { href: "/comercios", label: "Comercios" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" aria-label="Midi Pass" className="inline-flex items-baseline gap-1.5 text-text-primary">
          <MidiLogo className="h-[14px] w-auto self-center" />
          <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition-all duration-300 ${
                path === l.href
                  ? "text-text-primary bg-surface-hover"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-2" />
          <Link href="/auth/sign-in" className="text-[13px] font-semibold text-white bg-text-primary px-4 py-1.5 rounded-lg hover:bg-accent transition-all duration-300 active:scale-[0.97]">
            Sign In
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/auth/sign-in" className="text-[12px] font-semibold text-white bg-text-primary px-3.5 py-1.5 rounded-lg active:scale-[0.97]">
            Sign In
          </Link>
          <button onClick={() => setOpen(!open)} className="text-text-primary p-1">
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-surface border-t border-border px-5 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block text-[15px] font-medium py-2.5 px-3 rounded-lg transition-all ${
                path === l.href
                  ? "text-text-primary bg-surface-hover"
                  : "text-text-secondary"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
