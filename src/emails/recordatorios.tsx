import { Capital, COLOR, Corps, Enlace, Filas, Nota, Shell, SITE, Titre } from "./shell";

const PALABRAS = ["aucune", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const enLetra = (n: number) => PALABRAS[n] ?? String(n);

// ── Il vous reste six heures (storyteller) ─────────────────────────────────
// Se envía una sola vez, a falta de seis horas del plazo, y solo si las
// stories no han llegado a la app. Sin fotografía y sin cuenta atrás que
// corra: la cifra de horas se lee, no se anima, como en la app.
export type SeisHorasProps = { firstName: string; maisonName: string; whenLabel: string; horas: number };

export function SeisHoras(p: SeisHorasProps) {
  const horas = `${enLetra(p.horas)} heure${p.horas > 1 ? "s" : ""}`;
  return (
    <Shell preview={`Il vous reste ${horas} pour publier vos deux stories de ${p.maisonName}.`}>
      <Capital color={COLOR.copper}>{horas.charAt(0).toUpperCase() + horas.slice(1)}</Capital>
      <Titre>Il vous reste {horas}{p.firstName ? `, ${p.firstName}` : ""}.</Titre>
      <Corps>
        Votre visite chez {p.maisonName}, le {p.whenLabel}, attend encore ses deux stories. Nous ne les avons pas reçues
        dans l&apos;application.
      </Corps>
      <Corps>
        Une fois publiées, ajoutez-les dans Mes visites avec leur portée : c&apos;est ce que la maison reçoit en retour.
      </Corps>
      <Enlace href={`${SITE}/dashboard/storyteller/visits`}>Ajouter mes stories</Enlace>
      <Nota>C&apos;est le seul rappel que nous vous enverrons pour cette visite.</Nota>
    </Shell>
  );
}

export function seisHorasTexto(p: SeisHorasProps): string {
  const horas = `${enLetra(p.horas)} heure${p.horas > 1 ? "s" : ""}`;
  return [
    `Il vous reste ${horas}${p.firstName ? `, ${p.firstName}` : ""}.`,
    "",
    `Votre visite chez ${p.maisonName}, le ${p.whenLabel}, attend encore ses deux stories. Nous ne les avons pas reçues dans l'application.`,
    "",
    "Une fois publiées, ajoutez-les dans Mes visites avec leur portée : c'est ce que la maison reçoit en retour.",
    "",
    `Ajouter mes stories : ${SITE}/dashboard/storyteller/visits`,
    "",
    "C'est le seul rappel que nous vous enverrons pour cette visite.",
    "",
    "Curato · Paris",
  ].join("\n");
}

// ── Stories manquantes (Curato) ────────────────────────────────────────────
// Un solo correo por pasada de la tarea, con todas las visitas cuyo plazo acaba
// de vencer sin stories: es la señal para que Operations haga el seguimiento.
export type StoriesManquantesProps = { visitas: { storyteller: string; maison: string; whenLabel: string }[] };

export function StoriesManquantes(p: StoriesManquantesProps) {
  const n = p.visitas.length;
  return (
    <Shell preview={`${n} visite${n > 1 ? "s" : ""} sans stories après 24 heures.`}>
      <Capital color={COLOR.copper}>Stories manquantes</Capital>
      <Titre>
        {n > 1 ? `${enLetra(n).charAt(0).toUpperCase() + enLetra(n).slice(1)} visites` : "Une visite"} sans stories
      </Titre>
      <Corps>Le délai de 24 heures est passé et ces storytellers n&apos;ont pas ajouté leurs stories dans l&apos;application.</Corps>
      <Filas filas={p.visitas.map((v) => [`${v.storyteller} · ${v.maison}`, v.whenLabel])} />
      <Enlace href={`${SITE}/admin/reservations`}>Voir les réservations</Enlace>
    </Shell>
  );
}
