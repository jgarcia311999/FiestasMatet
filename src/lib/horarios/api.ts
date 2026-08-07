import { comparePersonas, compareTurnos } from "@/lib/horarios/format";
import type { Persona, Turno, TurnoFormValues, TurnoInsert } from "@/types/horarios";

function toTurnoPayload(values: TurnoFormValues): TurnoInsert {
  return {
    fecha: values.fecha,
    dia: values.dia.trim(),
    hora_inicio: values.hora_inicio,
    hora_fin: values.hora_fin || null,
    acto: values.acto.trim(),
    tipo: values.tipo,
    persona_1_id: values.persona_1_id ? Number(values.persona_1_id) : null,
    persona_2_id: values.persona_2_id ? Number(values.persona_2_id) : null,
    apoyo_id: values.apoyo_id ? Number(values.apoyo_id) : null,
    apoyo_2_id: values.apoyo_2_id ? Number(values.apoyo_2_id) : null,
    orden: values.orden,
  };
}

async function requestHorarios<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "No se pudieron cargar los horarios");
  }
  return json as T;
}

async function fetchHorarios() {
  return requestHorarios<{ personas: Persona[]; turnos: Turno[] }>("/api/horarios", { cache: "no-store" });
}

export async function fetchPersonas() {
  const data = await fetchHorarios();
  return data.personas.sort(comparePersonas);
}

export async function fetchTurnos() {
  const data = await fetchHorarios();
  return data.turnos.sort(compareTurnos);
}

export async function createTurno(values: TurnoFormValues) {
  const data = await requestHorarios<{ turno: Turno }>("/api/horarios", {
    method: "POST",
    body: JSON.stringify(toTurnoPayload(values)),
  });
  return data.turno;
}

export async function updateTurno(id: number, values: TurnoFormValues) {
  const data = await requestHorarios<{ turno: Turno }>("/api/horarios", {
    method: "PATCH",
    body: JSON.stringify({ id, turno: toTurnoPayload(values) }),
  });
  return data.turno;
}

export async function deleteTurno(id: number) {
  await requestHorarios<{ ok: true }>("/api/horarios", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function duplicateTurno(turno: Turno) {
  return createTurno({
    fecha: turno.fecha,
    dia: turno.dia,
    hora_inicio: turno.hora_inicio.slice(0, 5),
    hora_fin: turno.hora_fin?.slice(0, 5) ?? "",
    acto: turno.acto,
    tipo: turno.tipo,
    persona_1_id: turno.persona_1_id == null ? "" : String(turno.persona_1_id),
    persona_2_id: turno.persona_2_id == null ? "" : String(turno.persona_2_id),
    apoyo_id: turno.apoyo_id == null ? "" : String(turno.apoyo_id),
    apoyo_2_id: turno.apoyo_2_id == null ? "" : String(turno.apoyo_2_id),
    orden: turno.orden + 1,
  });
}

export async function updateTurnosOrden(updates: Array<Pick<Turno, "id" | "orden">>) {
  await requestHorarios<{ ok: true }>("/api/horarios", {
    method: "PATCH",
    body: JSON.stringify({ action: "reorder", updates }),
  });
}

export async function createPersona(nombre: string, orden: number | null = null) {
  const data = await requestHorarios<{ persona: Persona }>("/api/horarios/personas", {
    method: "POST",
    body: JSON.stringify({ nombre, orden, activo: true }),
  });
  return data.persona;
}

export async function updatePersona(id: number, patch: Partial<Pick<Persona, "nombre" | "activo" | "orden">>) {
  const data = await requestHorarios<{ persona: Persona }>("/api/horarios/personas", {
    method: "PATCH",
    body: JSON.stringify({ id, persona: patch }),
  });
  return data.persona;
}
