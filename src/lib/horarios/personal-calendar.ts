import { db } from "@/db/client";
import { personas, turnos } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { filterTurnosForCalendar, isTurnoPersona, type CalendarMode } from "@/lib/horarios/calendar-filter";
import { formatMadridTime } from "@/lib/horarios/date-utils";
import { buildIcsCalendar, type IcsEvent } from "@/lib/horarios/ics-core";
import type { Persona, Turno, TurnoTipo } from "@/types/horarios";

function normalizeTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function normalizeDateTime(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function buildTurnos(rows: Array<typeof turnos.$inferSelect>, people: Persona[]): Turno[] {
  const peopleById = new Map(people.map((persona) => [persona.id, persona]));
  return rows.map((turno) => ({
    id: turno.id,
    fecha: turno.fecha,
    dia: turno.dia,
    hora_inicio: normalizeTime(turno.horaInicio) ?? "",
    hora_fin: normalizeTime(turno.horaFin),
    fecha_hora_inicio: normalizeDateTime(turno.fechaHoraInicio),
    fecha_hora_fin: normalizeDateTime(turno.fechaHoraFin),
    acto: turno.acto,
    tipo: turno.tipo as TurnoTipo,
    persona_1_id: turno.persona1Id,
    persona_2_id: turno.persona2Id,
    apoyo_id: turno.apoyoId,
    orden: turno.orden,
    persona_1: turno.persona1Id ? peopleById.get(turno.persona1Id) ?? null : null,
    persona_2: turno.persona2Id ? peopleById.get(turno.persona2Id) ?? null : null,
    apoyo: turno.apoyoId ? peopleById.get(turno.apoyoId) ?? null : null,
  }));
}

export async function getPersonaByCalendarToken(token: string) {
  const [persona] = await db
    .select({
      id: personas.id,
      nombre: personas.nombre,
      activo: personas.activo,
      orden: personas.orden,
    })
    .from(personas)
    .where(eq(personas.calendarToken, token))
    .limit(1);

  return persona ?? null;
}

async function readCalendarTurnos() {
  const [peopleRows, turnoRows] = await Promise.all([
    db
      .select({
        id: personas.id,
        nombre: personas.nombre,
        activo: personas.activo,
        orden: personas.orden,
      })
      .from(personas)
      .orderBy(sql`${personas.orden} nulls last`, personas.nombre),
    db.select().from(turnos).orderBy(turnos.fechaHoraInicio, turnos.fecha, turnos.orden),
  ]);

  return buildTurnos(turnoRows, peopleRows as Persona[]);
}

function describePersonalTurno(turno: Turno, personaId: number, origin: string) {
  const colleague = [turno.persona_1, turno.persona_2]
    .filter((persona) => persona && persona.id !== personaId)
    .map((persona) => persona!.nombre)
    .join(", ");

  return [
    `Entrada: ${turno.fecha_hora_inicio ? formatMadridTime(turno.fecha_hora_inicio) : turno.hora_inicio}`,
    turno.fecha_hora_fin ? `Salida: ${formatMadridTime(turno.fecha_hora_fin)}` : "",
    `Persona 1: ${turno.persona_1?.nombre ?? "-"}`,
    `Persona 2: ${turno.persona_2?.nombre ?? "-"}`,
    colleague ? `Compañero: ${colleague}` : "",
    turno.apoyo ? `Apoyo: ${turno.apoyo.nombre}` : "",
    `Tipo de acto: ${turno.tipo}`,
    "",
    "Consulta el horario actualizado:",
    `${origin}/horarios`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function describeGeneralTurno(turno: Turno, origin: string) {
  return [`${turno.dia}`, `Tipo de acto: ${turno.tipo}`, "", "Horario actualizado:", `${origin}/horarios`].join("\n");
}

function toIcsEvent(turno: Turno, persona: Persona, origin: string): IcsEvent | null {
  if (!turno.fecha_hora_inicio) return null;
  const isPersonal = isTurnoPersona(turno, persona.id);
  const startsAt = new Date(turno.fecha_hora_inicio);
  const endsAt = turno.fecha_hora_fin ? new Date(turno.fecha_hora_fin) : null;

  return {
    uid: `turno-${turno.id}-${isPersonal ? persona.id : "general"}@fiestasmatet`,
    startsAt,
    endsAt,
    summary: isPersonal ? `TURNO FIESTAS MATET · ${turno.acto}` : turno.acto,
    description: isPersonal ? describePersonalTurno(turno, persona.id, origin) : describeGeneralTurno(turno, origin),
    location: "Matet",
    url: `${origin}/horarios`,
    alarm: isPersonal ? { minutesBefore: 30, description: `Turno Fiestas Matet: ${turno.acto}` } : undefined,
  };
}

export async function generateCalendar(personaId: number, mode: CalendarMode, origin: string) {
  const people = await db
    .select({
      id: personas.id,
      nombre: personas.nombre,
      activo: personas.activo,
      orden: personas.orden,
    })
    .from(personas)
    .where(eq(personas.id, personaId))
    .limit(1);

  const persona = people[0];
  if (!persona) throw new Error("Persona no encontrada");

  const turnosRows = await readCalendarTurnos();
  const calendarTurnos = filterTurnosForCalendar(turnosRows, persona.id, mode);
  const events = calendarTurnos
    .map((turno) => toIcsEvent(turno, persona, origin))
    .filter((event): event is IcsEvent => event !== null);

  return buildIcsCalendar({
    name: mode === "mis-turnos" ? `Turnos de ${persona.nombre} · Fiestas Matet` : `${persona.nombre} · Fiestas Matet`,
    description:
      mode === "mis-turnos"
        ? "Turnos personales de la comision de fiestas de Matet"
        : "Actos de fiestas de Matet con turnos personales destacados",
    events,
  });
}
