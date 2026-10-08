// Calendar helpers — Google Calendar "add event" URL + an .ics file string.
// Used by the reservation-confirmed email so storytellers can add the booking
// to Apple Calendar (.ics attachment) or Google Calendar (template link).

export type CalEvent = {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
};

// → "YYYYMMDDTHHMMSSZ" (UTC), the format both Google Calendar and ICS expect.
function toUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(e: CalEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUtcStamp(e.start)}/${toUtcStamp(e.end)}`,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 text escaping for ICS field values.
function escIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(e: CalEvent, uid: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Curato//Reservations//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(e.start)}`,
    `DTEND:${toUtcStamp(e.end)}`,
    `SUMMARY:${escIcs(e.title)}`,
    e.location ? `LOCATION:${escIcs(e.location)}` : "",
    e.description ? `DESCRIPTION:${escIcs(e.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Lo que dura una visita en el calendario: las noches de un hotel, o dos horas. */
export function finDeVisita(start: Date, nights: number | null | undefined): Date {
  return nights ? new Date(start.getTime() + nights * 86400000) : new Date(start.getTime() + 2 * 3600000);
}

/**
 * El evento de una visita, visto desde cada lado: el storyteller apunta la
 * casa a la que va; la casa, a quién recibe y cuántos son.
 */
export function eventoDeVisita(v: {
  lado: "storyteller" | "maison";
  maison: string;
  address: string | null;
  storyteller: string;
  handle: string | null;
  slotStart: string;
  nights: number | null;
  partySize: number;
}): CalEvent {
  const start = new Date(v.slotStart);
  const personas = v.partySize > 1 ? `${v.partySize} personnes` : "1 personne";
  return v.lado === "storyteller"
    ? {
        title: `Curato · ${v.maison}`,
        start,
        end: finDeVisita(start, v.nights),
        location: v.address ?? "",
        description: `Visite Curato chez ${v.maison}, ${personas}. Votre code de visite est dans l'app, le jour même.`,
      }
    : {
        title: `Curato · ${v.storyteller} (${personas})`,
        start,
        end: finDeVisita(start, v.nights),
        location: v.address ?? "",
        description: `Visite Curato : ${v.storyteller}${v.handle ? ` (@${v.handle.replace(/^@/, "")})` : ""}, ${personas}. Scannez son code à l'arrivée.`,
      };
}
