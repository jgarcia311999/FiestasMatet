import type { Turno } from "@/types/horarios";

export type CalendarMode = "todo" | "mis-turnos";

export function isTurnoPersona(turno: Pick<Turno, "persona_1_id" | "persona_2_id" | "apoyo_id">, personaId: number) {
  return [turno.persona_1_id, turno.persona_2_id, turno.apoyo_id].includes(personaId);
}

export function filterTurnosForCalendar(turnos: Turno[], personaId: number, mode: CalendarMode) {
  if (mode === "mis-turnos") return turnos.filter((turno) => isTurnoPersona(turno, personaId));
  return turnos;
}

export function normalizeCalendarMode(value: string | null): CalendarMode {
  return value === "mis-turnos" || value === "solo" ? "mis-turnos" : "todo";
}
