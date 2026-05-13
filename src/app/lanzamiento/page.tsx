import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import LaunchForm from "./form";

export const metadata: Metadata = {
  title: "Lancement Curato · 22.07.26 · Paris",
  description: "Vous êtes invité à vivre en exclusivité le lancement de Curato. Mercredi 22 juillet, 19h00 — Paris.",
  alternates: { canonical: "https://curatocollective.com/lanzamiento" },
  openGraph: {
    title: "Vous êtes invité · Lancement Curato",
    description: "Mercredi 22.07.26 · 19h00 · Paris. Pré-inscription ouverte.",
    url: "https://curatocollective.com/lanzamiento",
    siteName: "Curato",
    images: [{ url: "/hero-floral.jpeg", width: 1200, height: 630, alt: "Lancement Curato · 22 juillet, Paris" }],
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vous êtes invité · Lancement Curato",
    description: "Mercredi 22.07.26 · 19h00 · Paris.",
    images: ["/hero-floral.jpeg"],
  },
};

export default function LanzamientoPage() {
  return (
    <main className="min-h-[100dvh] relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/hero-floral.jpeg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[480px] mx-auto px-5 pt-12 pb-20">

        {/* Logo */}
        <Link
          href="/"
          className="inline-block font-serif text-[13px] tracking-[0.45em] uppercase text-champagne/70 hover:text-champagne transition-colors mb-14"
        >
          curato
        </Link>

        {/* Eyebrow */}
        <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/50 mb-5">
          Vous êtes invité · You are invited · Estás invitado
        </p>

        {/* Headline */}
        <h1 className="font-serif text-[36px] md:text-[42px] font-light tracking-[0.05em] leading-[1.15] text-white mb-7">
          Parce que les meilleures{" "}
          <span className="italic text-champagne">connexions se cultivent</span>…
        </h1>

        {/* Body */}
        <p className="font-serif text-[15px] font-light text-white/60 leading-relaxed mb-5">
          Vous avez été sélectionné pour vivre en exclusivité le lancement de{" "}
          <span className="text-champagne">Curato</span> — l'écosystème où les créateurs et les maisons qu'ils aiment se rencontrent.
        </p>

        <p className="font-serif text-[15px] font-light text-white/80 leading-relaxed mb-12 italic">
          Jamais une campagne. Toujours une histoire.
        </p>

        {/* Save the date card */}
        <section className="border border-white/15 bg-white/5 backdrop-blur-sm p-7 mb-10">
          <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/40 mb-5">
            Save the date
          </p>

          <p className="font-serif text-[18px] font-light text-white mb-1">
            Paris
          </p>
          <p className="font-serif text-[12px] text-white/30 mb-5 lowercase tracking-widest">
            mercredi · wednesday · miércoles
          </p>

          <p className="font-serif text-[48px] md:text-[56px] font-light tracking-tight leading-none text-champagne mb-5">
            22.07.2026
          </p>

          <div className="space-y-1.5 pt-4 border-t border-white/10">
            <p className="font-serif text-[13px] text-white/40">
              19h00 · Paris, France
            </p>
            <p className="font-serif text-[11px] text-white/25 tracking-wide">
              Lieu confirmé à l'inscription
            </p>
          </div>
        </section>

        {/* Pre-registration label */}
        <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/40 mb-4">
          Pré-inscription · Pre-registration
        </p>

        <Suspense
          fallback={
            <div className="border border-white/15 bg-white/5 p-7 h-[420px]" />
          }
        >
          <LaunchForm />
        </Suspense>

        <p className="font-serif text-[11px] text-white/25 text-center mt-7 leading-relaxed italic">
          Places limitées. La confirmation vous sera envoyée par email.
        </p>
      </div>
    </main>
  );
}
