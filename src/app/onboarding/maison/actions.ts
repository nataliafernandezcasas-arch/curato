"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommitmentLabels } from "@/lib/i18n/commitment";
import type { Lang } from "@/lib/i18n/translations";
import { buildCommitmentPdf } from "@/lib/commitment-pdf";
import { sendMaisonCommitment } from "@/lib/emails";

// Closes the maison commitment step:
//   - Verifies the current user is an active maison (comercio)
//   - Verifies the terms were accepted and a signature name was typed
//   - Records the acceptance timestamp, the typed signatory, and the plan
//   - Emails the maison a branded PDF record of the signed agreement (best-effort)
//
// Returns { ok } or { ok:false, error } so the client can surface a code without
// leaking internals.
export async function signCommitment(input: {
  accepted: boolean;
  signatory: string;
  lang?: Lang;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const signatory = (input.signatory || "").trim();
  if (!input.accepted) return { ok: false, error: "must_accept" };
  if (signatory.length < 2) return { ok: false, error: "must_sign" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "not_authenticated" };

  const admin = createAdminClient();
  const emailLc = user.email.toLowerCase();

  const { data: comercio } = await admin
    .from("comercios")
    .select("id, name, email")
    .eq("email", emailLc)
    .eq("stage", "activo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comercio) return { ok: false, error: "maison_not_found" };

  const acceptedAt = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("comercios")
    .update({
      commitment_accepted_at: acceptedAt,
      commitment_signatory: signatory,
      subscription_plan: "monthly_299",
    })
    .eq("id", comercio.id);

  if (updateErr) {
    // eslint-disable-next-line no-console
    console.error("signCommitment update error", updateErr);
    return { ok: false, error: "db_update_failed" };
  }

  // Email a signed PDF record. Best-effort: a mail/PDF failure must not undo a
  // signature that is already recorded.
  try {
    const lang: Lang = input.lang ?? "fr";
    const l = getCommitmentLabels(lang);
    const maisonName = comercio.name || "Maison";
    const to = comercio.email || user.email;

    const pdfBase64 = await buildCommitmentPdf({
      maisonName,
      signatory,
      acceptedAtIso: acceptedAt,
      title: l.title,
      intro: l.intro,
      terms: l.terms,
      labels: { signedBy: l.signedBy, date: l.dateWord, footer: l.pdfFooter },
      lang,
    });

    const whenLabel = new Date(acceptedAt).toLocaleDateString(lang, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });

    await sendMaisonCommitment({
      to,
      subject: l.emailSubject,
      heading: l.emailHeading,
      intro: l.emailIntro,
      maisonName,
      terms: l.terms,
      signatory,
      signedByLabel: l.signedBy,
      whenLabel,
      dateLabel: l.dateWord,
      confirmNote: l.emailConfirmNote,
      pdfBase64,
      pdfFilename: "curato-engagement.pdf",
    });
  } catch (mailErr) {
    // eslint-disable-next-line no-console
    console.error("signCommitment email/pdf failed:", mailErr);
  }

  return { ok: true };
}
