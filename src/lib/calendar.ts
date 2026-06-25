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
