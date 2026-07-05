const PRODID = "-//Fiestas Matet//Calendario de fiestas//ES";
const CALENDAR_NAME = "Fiestas de Matet 2026";
const CALENDAR_TEST_NAME = "Fiestas de Matet 2026 · Prueba";
const CALENDAR_COLOR = "#A61F24";
const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

export type CalendarEventRow = {
  id: number;
  title: string;
  calendarTitle?: string | null;
  location: string | null;
  startsAt: string | Date;
  provisional: boolean | null;
};

function formatUtcIcs(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildCalendarIcs(rows: CalendarEventRow[], origin: string) {
  const body = rows
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map((event) => {
      const startsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
      const endsAt = new Date(startsAt.getTime() + DEFAULT_EVENT_DURATION_MS);
      const summary = event.calendarTitle?.trim() || event.title;
      const notes = [
        event.title.trim(),
        event.location?.trim() ? `Lugar: ${event.location.trim()}` : "",
        event.provisional ? "Horario provisional." : "",
      ]
        .filter(Boolean)
        .join("\n");
      return [
        "BEGIN:VEVENT",
        `UID:evento-${event.id}@fiestasmatet`,
        `DTSTAMP:${formatUtcIcs(new Date())}`,
        `DTSTART:${formatUtcIcs(startsAt)}`,
        `DTEND:${formatUtcIcs(endsAt)}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `LOCATION:${escapeIcsText(event.location ?? "Matet")}`,
        `DESCRIPTION:${escapeIcsText(notes)}`,
        `URL:${origin}/calendar`,
        `STATUS:${event.provisional ? "TENTATIVE" : "CONFIRMED"}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${CALENDAR_NAME}`,
    "X-WR-CALDESC:Programa de fiestas de Matet con actualizacion automatica",
    "X-WR-TIMEZONE:Europe/Madrid",
    `COLOR:${CALENDAR_COLOR}`,
    `X-APPLE-CALENDAR-COLOR:${CALENDAR_COLOR}`,
    body,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function buildTestCalendarIcs(origin: string) {
  const startsAt = new Date("2026-08-06T18:00:00.000Z");
  const endsAt = new Date("2026-08-06T20:00:00.000Z");

  const body = [
    "BEGIN:VEVENT",
    "UID:evento-prueba-fiesta-matet-2026@fiestasmatet",
    `DTSTAMP:${formatUtcIcs(new Date())}`,
    `DTSTART:${formatUtcIcs(startsAt)}`,
    `DTEND:${formatUtcIcs(endsAt)}`,
    `SUMMARY:${escapeIcsText("Prueba calendario Matet")}`,
    `LOCATION:${escapeIcsText("Matet")}`,
    `DESCRIPTION:${escapeIcsText("Evento de prueba para validar la importacion en iPhone.")}`,
    `URL:${origin}/calendar`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${CALENDAR_TEST_NAME}`,
    "X-WR-CALDESC:Calendario de prueba de Fiestas de Matet",
    "X-WR-TIMEZONE:Europe/Madrid",
    `COLOR:${CALENDAR_COLOR}`,
    `X-APPLE-CALENDAR-COLOR:${CALENDAR_COLOR}`,
    body,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
