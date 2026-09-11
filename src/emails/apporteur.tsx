import { Bloque, Capital, COLOR, Corps, Enlace, Shell, SITE, Titre } from "./shell";

const DASH = `${SITE}/dashboard`;
const primero = (name: string) => (name || "").trim().split(" ")[0] || "";

/** Los correos del programa apporteur que no tienen diseño propio. */
export function Aviso(p: {
  capital: string;
  titulo: string;
  parrafos: React.ReactNode[];
  enlace?: { label: string; url: string };
  preview: string;
}) {
  return (
    <Shell preview={p.preview}>
      <Capital>{p.capital}</Capital>
      <Titre mayusculas>{p.titulo}</Titre>
      {p.parrafos.map((t, i) => (
        <Corps key={i}>{t}</Corps>
      ))}
      {p.enlace && <Enlace href={p.enlace.url}>{p.enlace.label}</Enlace>}
    </Shell>
  );
}

// ── Maison validée (apporteur) ─────────────────────────────────────────────
// Este correo existe para una sola cosa: que se descuelgue el teléfono. La
// cifra se repite aunque esté en la app, porque es lo que convierte un aviso en
// una llamada esa misma tarde.
export type MaisonValideeProps = { recruiterName: string; maisonName: string };

export function MaisonValidee(p: MaisonValideeProps) {
  return (
    <Shell preview={`${p.maisonName} est validée : vous pouvez la contacter maintenant.`}>
      <Capital color={COLOR.sauge}>Validée</Capital>
      <Titre mayusculas>{p.maisonName}</Titre>
      <Corps>
        Bonjour {primero(p.recruiterName)}, la maison que vous avez présentée est validée et vous est réservée. Vous pouvez
        la contacter maintenant.
      </Corps>
      <Bloque etiqueta="Si elle signe">
        <Corps>
          149,50 € par mois pendant les trois premiers mois payés, soit 448,50 €. Virement dans les quinze jours qui suivent
          chaque paiement de la maison.
        </Corps>
      </Bloque>
      <Enlace href={DASH}>Voir mon tableau</Enlace>
    </Shell>
  );
}

export function maisonValideeTexto(p: MaisonValideeProps): string {
  return [
    "Validée",
    "",
    p.maisonName,
    "",
    `Bonjour ${primero(p.recruiterName)}, la maison que vous avez présentée est validée et vous est réservée. Vous pouvez la contacter maintenant.`,
    "",
    "Si elle signe : 149,50 € par mois pendant les trois premiers mois payés, soit 448,50 €. Virement dans les quinze jours qui suivent chaque paiement de la maison.",
    "",
    `Voir mon tableau : ${DASH}`,
    "",
    "Curato · Paris",
  ].join("\n");
}
