import { Capital, COLOR, Corps, Filas, FONT, Nota, Shell, Titre } from "./shell";

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
