import { Capital, Corps, Enlace, Filas, Nota, Shell, SITE, Titre } from "./shell";

// ── Candidature reçue ──────────────────────────────────────────────────────
export function CandidatureRecue(p: { name: string; type: "creator" | "business" }) {
  const nombre = p.name.split(" ")[0];
  return (
    <Shell preview="Nous avons bien reçu votre candidature.">
      <Capital>Candidature reçue</Capital>
      <Titre>Merci, {nombre}.</Titre>
      <Corps>
        Nous avons bien reçu votre candidature en tant que {p.type === "creator" ? "créateur" : "maison"}. Notre équipe
        examine chaque profil avec attention.
      </Corps>
      <Nota>Si votre candidature est retenue, vous recevrez un e-mail avec vos accès.</Nota>
    </Shell>
  );
}

// ── Candidature acceptée ───────────────────────────────────────────────────
export function CandidatureAcceptee(p: { to: string; name: string; type: "creator" | "business" }) {
  const nombre = p.name.split(" ")[0];
  return (
    <Shell preview={`Bienvenue dans Curato, ${nombre}.`}>
      <Capital>Acceptée</Capital>
      <Titre>Bienvenue dans Curato, {nombre}.</Titre>
      <Corps>
        {p.type === "creator"
          ? "Vous faites maintenant partie de notre réseau de créateurs. Découvrez les adresses sélectionnées et utilisez votre crédit mensuel pour vivre des expériences authentiques."
          : "Votre maison fait maintenant partie de l'écosystème Curato. Recevez des créateurs qui vous ont choisie, pas des campagnes."}
      </Corps>
      <Enlace href={`${SITE}/auth/sign-in`}>Accéder à Curato</Enlace>
      <Nota>Connectez-vous avec {p.to}. Jamais une campagne. Toujours une histoire.</Nota>
    </Shell>
  );
}

// ── Lancement ──────────────────────────────────────────────────────────────
export function Lancement(p: { name: string }) {
  const nombre = (p.name || "").split(" ")[0] || "";
  return (
    <Shell preview="Votre inscription au lancement de Curato est enregistrée.">
      <Capital>Vous êtes inscrit</Capital>
      <Titre>À bientôt{nombre ? `, ${nombre}` : ""}.</Titre>
      <Corps>
        Nous avons bien enregistré votre inscription au lancement de Curato. Vous serez prévenu par e-mail dès que la date
        sera confirmée.
      </Corps>
      <Filas
        filas={[
          ["Lancement", "Paris"],
          ["Date", "confirmée prochainement"],
        ]}
      />
      <Nota>Places limitées. La confirmation définitive vous sera envoyée avec tous les détails.</Nota>
    </Shell>
  );
}

// ── Mot de passe ───────────────────────────────────────────────────────────
export function MotDePasse(p: { resetUrl: string }) {
  return (
    <Shell preview="Choisissez un nouveau mot de passe. Le lien expire dans une heure.">
      <Capital>Réinitialisation</Capital>
      <Titre>Nouveau mot de passe</Titre>
      <Corps>
        Vous avez demandé à réinitialiser votre mot de passe Curato. Le lien ci-dessous est valable une heure.
      </Corps>
      <Enlace href={p.resetUrl}>Choisir un nouveau mot de passe</Enlace>
      <Nota>Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</Nota>
    </Shell>
  );
}
