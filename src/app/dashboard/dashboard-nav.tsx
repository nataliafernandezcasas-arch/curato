"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X, Gear } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type NavLink = { href: string; label: string; active?: boolean };

/**
 * The bar across the top of every dashboard.
 *
 * On a laptop everything sits in one row, which is how it has always looked.
 * On a phone that row was wider than the screen: the links, the other spaces,
 * three languages and sign-out could not fit, so the bar scrolled sideways and
 * half of it lived off-screen with nothing to say so.
 *
 * Below `sm` it collapses to the wordmark and one button. Everything that was
 * in the row moves into a panel underneath, stacked, and the page itself never
 * moves horizontally.
 */
export default function DashboardNav({
  links = [],
  eyebrow,
  roleSwitch,
  settingsHref,
  settingsLabel = "Réglages",
  maxWidth = "1200px",
}: {
  links?: NavLink[];
  /** A label instead of links, e.g. "Maison" on the maison dashboard. */
  eyebrow?: string;
  roleSwitch?: React.ReactNode;
  /** Where Réglages lives. Language and signing out moved in there. */
  settingsHref?: string;
  settingsLabel?: string;
  maxWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // A stale open panel over a new page is worse than no panel, and Escape is
  // what anyone reaches for first.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);


  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div
        className="mx-auto flex h-14 w-full items-center justify-between px-5"
        style={{ maxWidth }}
      >
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          {/* Home for a member is their own space, not the page that explains
              what Curato is. In the app that page should never appear at all. */}
          <Link href="/dashboard" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-curato-simple.png"
              alt="curato"
              style={{ height: "12px", width: "auto", display: "block" }}
            />
          </Link>

          {eyebrow && (
            <>
              <div className="h-3 w-px shrink-0 bg-white/10" />
              <span className="truncate font-serif text-[10px] uppercase tracking-[0.3em] text-white/45">
                {eyebrow}
              </span>
            </>
          )}

          {links.length > 0 && (
            <>
              <div className="hidden h-3 w-px bg-white/10 sm:block" />
              <div className="hidden items-center gap-6 sm:flex">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`whitespace-nowrap font-serif text-[12px] tracking-wider transition-colors ${
                      l.active ? "text-champagne" : "text-white/55 hover:text-champagne"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden items-center gap-5 sm:flex">
          {roleSwitch}
          {settingsHref && (
            <Link
              href={settingsHref}
              className="flex items-center gap-1.5 font-serif text-[11px] tracking-wider text-white/55 transition-colors hover:text-champagne"
            >
              <Gear size={14} />
              {settingsLabel}
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
          className="-mr-2 p-2 text-white/70 transition-colors hover:text-champagne sm:hidden"
        >
          {open ? <X size={18} /> : <List size={18} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            // Height animates on a wrapper that owns no padding of its own. Put
            // padding here and the first frame jumps by that amount, which is
            // what makes a slide read as a snap.
            className="overflow-hidden sm:hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-white/10 bg-charcoal-deep/95 px-5 py-5 backdrop-blur-sm">
              <div className="flex flex-col gap-5">
                {links.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={`font-serif text-[13px] tracking-wider transition-colors ${
                          l.active ? "text-champagne" : "text-white/65 hover:text-champagne"
                        }`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}

                {roleSwitch && <div className="flex flex-wrap items-center gap-3">{roleSwitch}</div>}

                {settingsHref && (
                  <Link
                    href={settingsHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 border-t border-white/10 pt-5 font-serif text-[13px] tracking-wider text-white/65 transition-colors hover:text-champagne"
                  >
                    <Gear size={15} />
                    {settingsLabel}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
  );
}
