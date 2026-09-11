import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { render } from "@react-email/render";
import { AlerteDemande, DemandeDeclinee, DemandeEnvoyee, VisiteConfirmee } from "./visitas";
import { MaisonValidee } from "./apporteur";
import { SeisHoras, StoriesManquantes } from "./recordatorios";
import { CandidatureRecue, MotDePasse } from "./cuenta";
import {
  sendAvisoStoriesManquantes,
  sendRecordatorioSeisHoras,
  sendRecruiterProspectDecision,
  sendReservationConfirmed,
  sendReservationDeclined,
} from "@/lib/emails";

const PORTADA = "https://www.curatocollective.com/Gastronomie.jpeg";

const CORREOS: [string, ReactElement][] = [
  [
    "visita confirmada",
    createElement(VisiteConfirmee, {
      maisonName: "Maison Marceau",
      address: "18 rue Marceau, Paris 16e",
      whenLabel: "jeudi 22 octobre à 19:30",
      partySize: 2,
      coverUrl: PORTADA,
      googleUrl: "https://calendar.google.com",
    }),
  ],
  ["visita rechazada", createElement(DemandeDeclinee, { firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi 22 octobre à 19:30" })],
  ["demanda enviada", createElement(DemandeEnvoyee, { firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi 22 octobre", partySize: 2 })],
  ["alerta a Curato", createElement(AlerteDemande, { creatorName: "Tereza", creatorHandle: "terezab", maisonName: "Maison Marceau", whenLabel: "jeudi", partySize: 2, note: null })],
  ["maison validada", createElement(MaisonValidee, { recruiterName: "Amélie Durand", maisonName: "Le Comptoir du Marais" })],
  ["seis horas", createElement(SeisHoras, { firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi 22 octobre", horas: 6 })],
  ["stories que faltan", createElement(StoriesManquantes, { visitas: [{ storyteller: "Tereza", maison: "Maison Marceau", whenLabel: "jeudi" }] })],
  ["candidatura recibida", createElement(CandidatureRecue, { name: "Tereza Bolkvadze", type: "creator" })],
  ["contraseña", createElement(MotDePasse, { resetUrl: "https://curatocollective.com/auth/change-password" })],
];

describe("la cáscara de todos los correos", () => {
  it.each(CORREOS)("%s: logotipo con alt, foto de fondo, modo oscuro y ni un botón", async (_nombre, correo) => {
    const html = await render(correo);
    expect(html).toContain('alt="Curato"');
    expect(html).toContain("email-bg-dark.jpg");
    expect(html).toContain('name="color-scheme"');
    expect(html).toMatch(/bgcolor="#1E1E1E"/i);
    expect(html).not.toMatch(/<button/i);
    expect(html).not.toContain("—");
  });

  it("solo la visita confirmada lleva la portada de la casa", async () => {
    const htmls = await Promise.all(CORREOS.map(([, c]) => render(c)));
    expect(htmls.filter((h) => h.includes(PORTADA))).toHaveLength(1);
    expect(htmls[0]).toContain(PORTADA);
  });
});

describe("lo que se manda a Resend", () => {
  let enviados: Record<string, unknown>[];

  beforeEach(() => {
    process.env.RESEND_API_KEY = "clave-de-prueba";
    enviados = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        enviados.push(JSON.parse(String(init.body)));
        return new Response(JSON.stringify({ id: "prueba" }), { status: 200 });
      })
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("el rechazo dice casa y día, con el texto aprobado", async () => {
    await sendReservationDeclined({ to: "t@exemple.fr", firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi 22 octobre à 19:30" });
    expect(enviados[0].subject).toBe("Maison Marceau ne peut pas vous recevoir jeudi");
    expect(enviados[0].from).toBe("Curato <hello@curatocollective.com>");
    expect(enviados[0].text).toContain("Ce refus ne dit rien de vous.");
  });

  it("la confirmación lleva casa, día y hora en el asunto, y el .ics adjunto", async () => {
    await sendReservationConfirmed({
      to: "t@exemple.fr",
      firstName: "Tereza",
      maisonName: "Maison Marceau",
      address: null,
      whenLabel: "jeudi 22 octobre à 19:30",
      googleUrl: "https://calendar.google.com",
      ics: "BEGIN:VCALENDAR",
      start: new Date("2026-10-22T17:30:00.000Z"),
    });
    expect(enviados[0].subject).toBe("Maison Marceau vous attend jeudi à 19:30");
    expect((enviados[0].attachments as { filename: string }[])[0].filename).toBe("reservation-curato.ics");
    expect(enviados[0].text).toContain("24 heures");
  });

  it("el recordatorio dice las horas que quedan", async () => {
    await sendRecordatorioSeisHoras({ to: "t@exemple.fr", firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi", horas: 6 });
    await sendRecordatorioSeisHoras({ to: "t@exemple.fr", firstName: "Tereza", maisonName: "Maison Marceau", whenLabel: "jeudi", horas: 1 });
    expect(enviados[0].subject).toBe("Il vous reste six heures pour publier");
    expect(enviados[1].subject).toBe("Il vous reste 1 heure pour publier");
  });

  it("el aviso a Curato nombra a la persona si es una sola", async () => {
    await sendAvisoStoriesManquantes({ to: "hello@curatocollective.com", visitas: [{ storyteller: "Tereza", maison: "Maison Marceau", whenLabel: "jeudi" }] });
    expect(enviados[0].subject).toBe("Stories manquantes : Tereza chez Maison Marceau");
  });

  it("la maison validada empuja a llamar", async () => {
    await sendRecruiterProspectDecision("a@exemple.fr", { recruiterName: "Amélie", maisonName: "Le Comptoir du Marais", decision: "approved" });
    expect(enviados[0].subject).toBe("Le Comptoir du Marais est validée · à vous de jouer");
    expect(enviados[0].text).toContain("448,50 €");
  });

  it("todo correo lleva su versión en texto plano", async () => {
    await sendRecruiterProspectDecision("a@exemple.fr", { recruiterName: "Amélie", maisonName: "La Maison Rose", decision: "rejected" });
    expect(String(enviados[0].text).length).toBeGreaterThan(40);
    expect(String(enviados[0].html)).toContain("<html");
  });
});
