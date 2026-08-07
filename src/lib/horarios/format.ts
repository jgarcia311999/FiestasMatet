import type { Persona, Turno, TurnoFormValues } from "@/types/horarios";

const collator = new Intl.Collator("es", { sensitivity: "base" });

export function comparePersonas(a: Persona, b: Persona) {
  const orderA = a.orden ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.orden ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return collator.compare(a.nombre, b.nombre);
}

export function compareTurnos(a: Pick<Turno, "fecha" | "orden" | "hora_inicio" | "acto">, b: Pick<Turno, "fecha" | "orden" | "hora_inicio" | "acto">) {
  if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
  if (a.orden !== b.orden) return a.orden - b.orden;
  if (a.hora_inicio !== b.hora_inicio) return a.hora_inicio.localeCompare(b.hora_inicio);
  return collator.compare(a.acto, b.acto);
}

export function formatDiaFecha(turno: Pick<Turno, "dia" | "fecha">) {
  if (turno.dia.trim()) return turno.dia;
  const [year, month, day] = turno.fecha.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const label = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatHora(turno: Pick<Turno, "hora_inicio" | "hora_fin">) {
  const inicio = turno.hora_inicio.slice(0, 5);
  const fin = turno.hora_fin?.slice(0, 5);
  return fin ? `${inicio} - ${fin}` : inicio;
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function emptyTurnoForm(nextOrder: number, date = ""): TurnoFormValues {
  return {
    fecha: date,
    dia: "",
    hora_inicio: "",
    hora_fin: "",
    acto: "",
    tipo: "acto",
    persona_1_id: "",
    persona_2_id: "",
    apoyo_id: "",
    apoyo_2_id: "",
    orden: nextOrder,
  };
}

export function turnoToForm(turno: Turno): TurnoFormValues {
  return {
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
    orden: turno.orden,
  };
}
