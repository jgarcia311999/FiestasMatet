import { DateTime } from "luxon";

export const HORARIOS_TZ = "Europe/Madrid";

export function localTurnoDateTime(fecha: string, hora: string) {
  const [hour] = hora.split(":").map(Number);
  const base = DateTime.fromISO(`${fecha}T${hora}`, { zone: HORARIOS_TZ });
  return hour < 6 ? base.plus({ days: 1 }) : base;
}

export function turnoDateTimesToUtc(fecha: string, horaInicio: string, horaFin: string) {
  const start = localTurnoDateTime(fecha, horaInicio);
  let end = DateTime.fromISO(`${fecha}T${horaFin}`, { zone: HORARIOS_TZ });
  if (Number(horaInicio.slice(0, 2)) < 6 || end <= DateTime.fromISO(`${fecha}T${horaInicio}`, { zone: HORARIOS_TZ })) {
    end = end.plus({ days: 1 });
  }

  return {
    start: start.toUTC().toJSDate(),
    end: end.toUTC().toJSDate(),
  };
}

export function formatMadridTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: HORARIOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatUtcIcs(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
