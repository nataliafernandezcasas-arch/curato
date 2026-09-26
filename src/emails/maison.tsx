import { Capital, COLOR, Corps, Enlace, Filas, FONT, Nota, SITE, Shell, Titre } from "./shell";

// ── Engagement signé (maison) ──────────────────────────────────────────────
// Lleva el acuerdo firmado en PDF y repite las condiciones en el cuerpo, como
// constancia.
export function EngagementSigne(p: {
  heading: string;
  intro: string;
  maisonName: string;
  terms: string[];
  signatory: string;
  signedByLabel: string;
  whenLabel: string;
  dateLabel: string;
  confirmNote: string;
}) {
  return (
    <Shell preview={p.intro}>
      <Capital>{p.heading}</Capital>
      <Titre mayusculas>{p.maisonName}</Titre>
      <Corps>{p.intro}</Corps>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        {...{ bgcolor: COLOR.fondo }}
        style={{ margin: "16px 0 8px", backgroundColor: COLOR.fondo }}
      >
        <tbody>
          {p.terms.map((term, i) => (
            <tr key={i}>
              <td style={{ padding: "0 14px 12px 0", verticalAlign: "top", fontFamily: FONT, fontSize: 12, color: COLOR.champagne }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td style={{ padding: "0 0 12px", fontFamily: FONT, fontSize: 12, lineHeight: 1.65, color: COLOR.tinta }}>{term}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Filas
        filas={[
          [p.signedByLabel, p.signatory],
          [p.dateLabel, p.whenLabel],
        ]}
      />
      <Nota>{p.confirmNote}</Nota>
    </Shell>
  );
}

// ── Nouvelle maison (Curato) ───────────────────────────────────────────────
export function NouvelleMaison(p: { maisonName: string; signatory: string; whenLabel: string; planLabel: string }) {
  return (
    <Shell preview={`${p.maisonName} vient de signer son engagement.`}>
      <Capital>Nouvelle maison</Capital>
      <Titre mayusculas>{p.maisonName}</Titre>
      <Corps>vient d&apos;ouvrir son compte et de signer son engagement Curato.</Corps>
      <Filas
        filas={[
          ["Signé par", p.signatory],
          ["Formule", p.planLabel],
          ["Date", p.whenLabel],
        ]}
      />
    </Shell>
  );
}

// ── Demande reçue (maison) ─────────────────────────────────────────────────
// La casa no recibía nada cuando alguien le pedía una visita: se enteraba solo
// si abría la app, y el plazo de respuesta corría igual. El asunto dice quién
// quiere venir y cuándo, para que se entienda sin abrir.
export function DemandeRecue(p: {
  creatorName: string;
  creatorHandle: string | null;
  maisonName: string;
  whenLabel: string;
  partySize: number;
  note: string | null;
}) {
  return (
    <Shell preview={`${p.creatorName} souhaite venir ${p.whenLabel}.`}>
      <Capital>Nouvelle demande de visite</Capital>
      <Titre mayusculas>{p.creatorName}</Titre>
      <Corps>
        {p.creatorHandle ? `@${p.creatorHandle} ` : ""}souhaite venir chez {p.maisonName}. Vous décidez, vous seule.
      </Corps>
      <Filas
        filas={[
          ["Quand", p.whenLabel],
          ["Personnes", String(p.partySize)],
        ]}
      />
      {p.note ? <Corps color={COLOR.tinta}>« {p.note} »</Corps> : null}
      <Enlace href={`${SITE}/dashboard/business?section=demandes`}>Voir la demande</Enlace>
      <Nota>
        Répondez sous quarante-huit heures. Un refus compte comme une visite offerte dans votre minimum du mois, et une
        demande laissée sans réponse compte aussi.
      </Nota>
    </Shell>
  );
}
