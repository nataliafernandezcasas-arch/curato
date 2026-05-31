// /invitacion — Server component that detects ?lang= query param and passes
// it as initialLang to the client. This guarantees the first paint (server
// and client hydration) is in the right language, with no flicker.
//
// URL conventions:
//   /invitacion               → FR (default, no param)
//   /invitacion?lang=en       → EN
//   /invitacion?lang=es       → ES
//
// Backwards compat: all DMs already sent point to /invitacion with no param,
// and they continue to land in FR exactly as before.

import type { Metadata } from "next";
import InvitacionClient from "./invitacion-client";
import type { Lang } from "@/lib/i18n/translations";

export const metadata: Metadata = {
  title: "Invitation · Curato",
  description:
    "Curato sélectionne les créateurs et les maisons sur invitation. Découvrez le programme.",
};

// Next.js 16 passes searchParams as a Promise — we await it server-side to
// read the lang query param before rendering. The cast is safe: we validate
// the value against our Lang union and fall back to "fr" for anything else.
type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { lang: rawLang } = await searchParams;
  const initialLang: Lang =
    rawLang === "en" || rawLang === "es" ? rawLang : "fr";
  return <InvitacionClient initialLang={initialLang} />;
}
