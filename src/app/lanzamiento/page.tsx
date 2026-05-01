import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import LaunchForm from "./form";

export const metadata: Metadata = {
  title: "Lanzamiento Midi Pass · 13.05.26 · Bogotá",
  description: "Has sido seleccionado para vivir en exclusiva el lanzamiento de Midi Pass. Miércoles 13 de mayo, 5:30 p.m. — Amora Vida, Bogotá.",
  alternates: { canonical: "https://pass.midi.io/lanzamiento" },
  openGraph: {
    title: "Estás invitado · Lanzamiento Midi Pass",
    description: "Miércoles 13.05.26 · 5:30 p.m. · Amora Vida, Bogotá. Pre-registro abierto.",
    url: "https://pass.midi.io/lanzamiento",
    siteName: "Midi Pass",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Lanzamiento Midi Pass · 13 mayo, Bogotá" }],
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Estás invitado · Lanzamiento Midi Pass",
    description: "Miércoles 13.05.26 · 5:30 p.m. · Amora Vida, Bogotá.",
    images: ["/api/og"],
  },
};

const VENUE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Cr+12+%23+98-87+Bogot%C3%A1";

export default function LanzamientoPage() {
  return (
    <main className="min-h-[100dvh] bg-surface text-text-primary">
      <div className="max-w-[480px] mx-auto px-5 pt-12 pb-20">
        <Link href="/" aria-label="Midi Pass" className="inline-flex items-center gap-2 text-text-primary mb-14">
          <MidiLogo className="h-5 w-auto" />
          <span className="text-base font-semibold tracking-tight leading-none">Pass</span>
        </Link>

        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-accent mb-5">
          Estás invitado
        </p>

        <h1 className="text-[34px] md:text-[40px] font-extralight tracking-tighter leading-[1.1] text-text-primary mb-7">
          Porque las mejores{" "}
          <span className="font-medium">conexiones se cuidan</span>…
        </h1>

        <p className="text-[15px] text-text-secondary leading-relaxed mb-5">
          Has sido seleccionado para vivir en exclusiva el lanzamiento de{" "}
          <span className="text-text-primary font-medium">Midi Pass</span>; el ecosistema donde tu influencia y las marcas que ya amas, se encuentran.
        </p>

        <p className="text-[15px] text-text-primary font-light leading-relaxed mb-12">
          Tu <span className="font-semibold">influencia</span> tiene valor.{" "}
          <span className="font-semibold">Úsala.</span>
        </p>

        <section className="border border-border rounded-2xl bg-surface-raised p-7 mb-10">
          <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-text-muted mb-5">
            Save the date
          </p>

          <p className="text-[18px] font-light tracking-tight text-text-primary mb-1">
            Amora Vida
          </p>
          <p className="text-[12px] text-text-muted mb-5 lowercase">
            miércoles
          </p>

          <p className="text-[42px] md:text-[48px] font-extralight tracking-tighter leading-none text-text-primary mb-5">
            13.05.2026
          </p>

          <div className="space-y-1.5 pt-4 border-t border-border">
            <a
              href={VENUE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-text-secondary hover:text-accent transition-colors"
            >
              Cr 12 # 98-87 ↗
            </a>
            <p className="text-[13px] text-text-secondary">
              5:30 p.m.
            </p>
          </div>
        </section>

        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-text-muted mb-4">
          Pre-registro
        </p>

        <Suspense fallback={<div className="border border-border rounded-2xl bg-surface-raised p-7 h-[420px]" />}>
          <LaunchForm />
        </Suspense>

        <p className="text-[11px] text-text-muted text-center mt-7 leading-relaxed">
          Cupos limitados. La confirmación de tu lugar llega por email.
        </p>
      </div>
    </main>
  );
}
