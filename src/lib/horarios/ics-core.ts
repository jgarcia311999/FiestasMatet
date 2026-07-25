export type IcsAlarm = {
  minutesBefore: number;
  description: string;
};

export type IcsEvent = {
  uid: string;
  startsAt: Date;
  endsAt?: Date | null;
  summary: string;
  description: string;
  location?: string;
  url?: string;
  status?: "CONFIRMED" | "TENTATIVE";
  alarm?: IcsAlarm;
};

const PRODID = "-//Fiestas Matet//Turnos personalizados//ES";
const CALENDAR_COLOR = "#16A34A";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string) {
  const max = 73;
  if (line.length <= max) return line;
  const chunks = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, max)}`);
    rest = rest.slice(max);
  }
  return chunks.join("\r\n");
}

function formatUtcIcs(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function renderEvent(event: IcsEvent, dtstamp: Date) {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatUtcIcs(dtstamp)}`,
    `DTSTART:${formatUtcIcs(event.startsAt)}`,
    event.endsAt ? `DTEND:${formatUtcIcs(event.endsAt)}` : "",
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `LOCATION:${escapeIcsText(event.location ?? "Matet")}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    event.url ? `URL:${escapeIcsText(event.url)}` : "",
    `STATUS:${event.status ?? "CONFIRMED"}`,
  ].filter(Boolean);

  if (event.alarm) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(event.alarm.description)}`,
      `TRIGGER;RELATED=START:-PT${event.alarm.minutesBefore}M`,
      "END:VALARM"
    );
  }

  lines.push("END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

export function buildIcsCalendar({
  name,
  description,
  events,
}: {
  name: string;
  description: string;
  events: IcsEvent[];
}) {
  const dtstamp = new Date();
  const body = events
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((event) => renderEvent(event, dtstamp))
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `X-WR-CALDESC:${escapeIcsText(description)}`,
    "X-WR-TIMEZONE:Europe/Madrid",
    `COLOR:${CALENDAR_COLOR}`,
    `X-APPLE-CALENDAR-COLOR:${CALENDAR_COLOR}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    body,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
