export const TURNO_TIPOS = ["cobro", "barra", "acto", "misa", "procesion", "noche", "otros"] as const;

export type TurnoTipo = (typeof TURNO_TIPOS)[number];

export type Persona = {
  id: number;
  nombre: string;
  activo: boolean;
  orden: number | null;
};

export type Turno = {
  id: number;
  fecha: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string | null;
  fecha_hora_inicio: string | null;
  fecha_hora_fin: string | null;
  acto: string;
  tipo: TurnoTipo;
  persona_1_id: number | null;
  persona_2_id: number | null;
  apoyo_id: number | null;
  orden: number;
  persona_1: Persona | null;
  persona_2: Persona | null;
  apoyo: Persona | null;
};

export type TurnoFormValues = {
  fecha: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  acto: string;
  tipo: TurnoTipo;
  persona_1_id: string;
  persona_2_id: string;
  apoyo_id: string;
  orden: number;
};

export type TurnoInsert = Omit<TurnoFormValues, "persona_1_id" | "persona_2_id" | "apoyo_id" | "hora_fin"> & {
  persona_1_id: number | null;
  persona_2_id: number | null;
  apoyo_id: number | null;
  hora_fin: string | null;
};
