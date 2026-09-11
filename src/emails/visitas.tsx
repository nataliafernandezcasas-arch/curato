import { Bloque, Capital, COLOR, Corps, Enlace, Filas, Nota, Shell, SITE, Titre } from "./shell";

const PALABRAS = ["", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
export const personnes = (n: number) => `${PALABRAS[n] ?? n} personne${n > 1 ? "s" : ""}`;
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Demande envoyée (storyteller) ──────────────────────────────────────────
export function DemandeEnvoyee(p: { firstName: string; maisonName: string; whenLabel: string; partySize: number }) {
  return (
    <Shell preview={`${p.maisonName} a reçu votre demande pour le ${p.whenLabel}.`}>
      <Capital>Demande envoyée</Capital>
      <Titre>Bien reçu, {p.firstName}.</Titre>
      <Corps>
        Votre demande est partie chez {p.maisonName}. Vous recevrez sa réponse par e-mail : rien n&apos;est confirmé d&apos;ici
        là.
      </Corps>
      <Filas
        filas={[
          ["Maison", p.maisonName],
          ["Quand", p.whenLabel],
          ["Pour", personnes(p.partySize)],
        ]}
      />
    </Shell>
  );
}

// ── Nouvelle demande (Curato) ──────────────────────────────────────────────
export function AlerteDemande(p: {
  creatorName: string;
  creatorHandle: string | null;
  maisonName: string;
  whenLabel: string;
  partySize: number;
  note: string | null;
}) {
  return (
    <Shell preview={`${p.creatorName} demande ${p.maisonName}, ${p.whenLabel}.`}>
      <Capital>Nouvelle demande</Capital>
      <Titre>
        {p.creatorName}
        {p.creatorHandle ? ` · @${p.creatorHandle}` : ""}
      </Titre>
      <Filas
        filas={[
          ["Maison", p.maisonName],
          ["Quand", p.whenLabel],
          ["Pour", personnes(p.partySize)],
        ]}
      />
      {p.note && <Nota>« {p.note} »</Nota>}
      <Enlace href={`${SITE}/admin/reservations`}>Voir la demande</Enlace>
    </Shell>
  );
}

// ── Visite confirmée (storyteller) ─────────────────────────────────────────
// El único correo con fotografía a sangre, y es la portada de la propia casa:
// es el que se guarda y se relee antes de ir. La capital en sauge dice lo
// cumplido sin celebrar nada, y el compromiso de las stories se repite aquí
// porque es el momento de recordarlo.
export type VisiteConfirmeeProps = {
  maisonName: string;
  address: string | null;
  whenLabel: string;
  partySize?: number;
  coverUrl?: string | null;
  googleUrl: string;
};

export function VisiteConfirmee(p: VisiteConfirmeeProps) {
  const detalle = [mayuscula(p.whenLabel), p.partySize ? personnes(p.partySize) : null].filter(Boolean).join(" · ");
  return (
    <Shell preview={`${p.maisonName} vous attend : ${detalle}.`} hero={p.coverUrl ? { src: p.coverUrl, alt: p.maisonName } : null}>
      <Capital color={COLOR.sauge}>C&apos;est confirmé</Capital>
      <Titre mayusculas>{p.maisonName}</Titre>
      <Corps>{detalle}</Corps>
      {p.address && <Corps color={COLOR.secundaria}>{p.address}</Corps>}
      <Bloque etiqueta="Ce que la maison attend">
        <Corps>
          Deux stories dans les 24 heures qui suivent votre visite, avec la maison et Curato mentionnées sur chacune.
        </Corps>
      </Bloque>
      <Enlace href={p.googleUrl}>Ajouter à mon agenda</Enlace>
      <Nota>Le fichier joint, reservation-curato.ics, l&apos;ajoute aussi à Apple Calendar ou à Outlook.</Nota>
    </Shell>
  );
}

export function visiteConfirmeeTexto(p: VisiteConfirmeeProps): string {
  const detalle = [mayuscula(p.whenLabel), p.partySize ? personnes(p.partySize) : null].filter(Boolean).join(" · ");
  return [
    "C'est confirmé",
    "",
    p.maisonName,
    detalle,
    p.address ?? "",
    "",
    "Ce que la maison attend : deux stories dans les 24 heures qui suivent votre visite, avec la maison et Curato mentionnées sur chacune.",
    "",
    `Ajouter à mon agenda : ${p.googleUrl}`,
    "Le fichier joint, reservation-curato.ics, l'ajoute aussi à Apple Calendar ou à Outlook.",
    "",
    "Curato · Paris",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

// ── Autres créneaux (storyteller) ──────────────────────────────────────────
export function AutresCreneaux(p: { firstName: string; maisonName: string; slots: { label: string; url: string }[] }) {
  return (
    <Shell preview={`${p.maisonName} vous propose d'autres créneaux.`}>
      <Capital>Autres créneaux</Capital>
      <Titre>Un autre moment, {p.firstName} ?</Titre>
      <Corps>
        Le créneau demandé chez {p.maisonName} n&apos;était pas disponible. Voici ceux que la maison propose : choisissez
        celui qui vous convient.
      </Corps>
      {p.slots.map((s) => (
        <Enlace key={s.url} href={s.url}>
          {s.label}
        </Enlace>
      ))}
      <Nota>Aucun ne convient ? Vous pouvez proposer une autre date depuis votre espace.</Nota>
    </Shell>
  );
}

// ── Demande déclinée (storyteller) ─────────────────────────────────────────
// Texto aprobado por Natalia (PR #112). No da motivo porque la casa no lo da, y
// no se inventa. Sin fotografía: una imagen bonita encima de un rechazo es de
// mal gusto. Y manda al carnet, no a insistir en la misma casa.
export type DemandeDeclineeProps = { firstName: string; maisonName: string; whenLabel: string };

export function DemandeDeclinee(p: DemandeDeclineeProps) {
  const nombre = p.firstName && p.firstName !== "vous" ? p.firstName : "";
  return (
    <Shell preview={`${p.maisonName} ne pourra pas vous recevoir le ${p.whenLabel}.`}>
      <Capital>Votre demande</Capital>
      <Titre>Ce ne sera pas pour cette fois{nombre ? `, ${nombre}` : ""}.</Titre>
      <Corps>
        {p.maisonName} ne pourra pas vous recevoir le {p.whenLabel}. Rien n&apos;a été déduit de votre budget du mois : il
        reste entier pour une autre adresse.
      </Corps>
      <Enlace href={`${SITE}/dashboard/storyteller`}>Découvrir le carnet</Enlace>
      <Nota>Chaque maison choisit ses visites selon ses propres contraintes. Ce refus ne dit rien de vous.</Nota>
    </Shell>
  );
}

export function demandeDeclineeTexto(p: DemandeDeclineeProps): string {
  const nombre = p.firstName && p.firstName !== "vous" ? `, ${p.firstName}` : "";
  return [
    `Ce ne sera pas pour cette fois${nombre}.`,
    "",
    `${p.maisonName} ne pourra pas vous recevoir le ${p.whenLabel}. Rien n'a été déduit de votre budget du mois : il reste entier pour une autre adresse.`,
    "",
    `Découvrir le carnet : ${SITE}/dashboard/storyteller`,
    "",
    "Chaque maison choisit ses visites selon ses propres contraintes. Ce refus ne dit rien de vous.",
    "",
    "Curato · Paris",
  ].join("\n");
}
