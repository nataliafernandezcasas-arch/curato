import { Img } from "@react-email/components";
import { Capital, COLOR, Corps, Enlace, Nota, Shell, SITE, Titre } from "./shell";

// Antes de la visita (migración 046): confirmar que se va, el código QR una
// hora antes, y a la casa, que alguien canceló.

// Las reglas, dichas igual en el correo que en la página de confirmar.
export const REGLA =
  "En cas d'absence, ou d'annulation moins de 24 heures avant, le crédit de la visite est perdu. Une absence sans prévenir peut entraîner la suspension de votre accès à Curato.";

// ── Vous venez toujours ? (storyteller) ────────────────────────────────────
export type ConfirmerVenueProps = {
  firstName: string;
  maisonName: string;
  whenLabel: string;
  reservaId: string;
  /** El segundo aviso, 6 h antes, si no contestó al primero. */
  recordatorio?: boolean;
};

export function ConfirmerVenue(p: ConfirmerVenueProps) {
  const enlace = `${SITE}/dashboard/storyteller/visits/${p.reservaId}/confirmer`;
  return (
    <Shell preview={`${p.maisonName} vous attend ${p.whenLabel}. Confirmez votre venue.`}>
      <Capital color={p.recordatorio ? COLOR.copper : COLOR.champagne}>
        {p.recordatorio ? "Sans réponse" : "Votre visite approche"}
      </Capital>
      <Titre>Vous venez toujours{p.firstName ? `, ${p.firstName}` : ""} ?</Titre>
      <Corps>
        {p.maisonName} vous attend {p.whenLabel}. Dites-lui que vous venez, ou libérez la table si vous ne pouvez plus.
      </Corps>
      <Enlace href={enlace}>Confirmer ou annuler</Enlace>
      <Nota>{REGLA}</Nota>
    </Shell>
  );
}

export function confirmerVenueTexto(p: ConfirmerVenueProps): string {
  return [
    `Vous venez toujours${p.firstName ? `, ${p.firstName}` : ""} ?`,
    "",
    `${p.maisonName} vous attend ${p.whenLabel}. Dites-lui que vous venez, ou libérez la table si vous ne pouvez plus.`,
    "",
    `Confirmer ou annuler : ${SITE}/dashboard/storyteller/visits/${p.reservaId}/confirmer`,
    "",
    REGLA,
    "",
    "Curato · Paris",
  ].join("\n");
}

// ── Votre code de visite (storyteller, 1 h antes) ──────────────────────────
export type CodeDeVisiteProps = {
  firstName: string;
  maisonName: string;
  whenLabel: string;
  address: string | null;
  /** La imagen del código, firmada (src/app/api/visite/tarjeta). */
  tarjetaUrl: string;
  /** El código en texto, por si el correo no carga imágenes. */
  codigo: string;
  reservaId: string;
};

export function CodeDeVisite(p: CodeDeVisiteProps) {
  return (
    <Shell preview={`Votre code pour ${p.maisonName}, ${p.whenLabel} : ${p.codigo}.`}>
      <Capital>À montrer à la maison</Capital>
      <Titre mayusculas>{p.maisonName}</Titre>
      <Corps>
        {p.whenLabel.charAt(0).toUpperCase() + p.whenLabel.slice(1)}
        {p.address ? ` · ${p.address}` : ""}
      </Corps>
      <Img
        src={p.tarjetaUrl}
        alt={`Code de visite ${p.codigo}`}
        width="520"
        style={{ display: "block", width: "100%", maxWidth: 520, height: "auto", border: 0, margin: "8px 0 20px" }}
      />
      <Corps>
        En arrivant, montrez ce code : la maison le scanne, et votre visite est enregistrée. Si la caméra ne le lit pas, la
        maison peut saisir {p.codigo}.
      </Corps>
      <Enlace href={`${SITE}/dashboard/storyteller/visits/${p.reservaId}/code`}>Ouvrir le code dans l&apos;application</Enlace>
    </Shell>
  );
}

export function codeDeVisiteTexto(p: CodeDeVisiteProps): string {
  return [
    `À montrer à la maison : ${p.maisonName}`,
    `${p.whenLabel}${p.address ? ` · ${p.address}` : ""}`,
    "",
    `Votre code de visite : ${p.codigo}`,
    "",
    "En arrivant, montrez ce code : la maison le scanne, et votre visite est enregistrée.",
    "",
    `Ouvrir le code : ${SITE}/dashboard/storyteller/visits/${p.reservaId}/code`,
    "",
    "Curato · Paris",
  ].join("\n");
}

// ── Une visite est annulée (maison) ────────────────────────────────────────
export type VisiteAnnuleeProps = { storyteller: string; whenLabel: string };

export function VisiteAnnulee(p: VisiteAnnuleeProps) {
  return (
    <Shell preview={`${p.storyteller} ne viendra pas ${p.whenLabel}.`}>
      <Capital color={COLOR.copper}>Visite annulée</Capital>
      <Titre>{p.storyteller} ne viendra pas.</Titre>
      <Corps>La visite prévue {p.whenLabel} est annulée. La table est à nouveau libre.</Corps>
      <Enlace href={`${SITE}/dashboard/business/calendrier`}>Voir le calendrier</Enlace>
    </Shell>
  );
}
