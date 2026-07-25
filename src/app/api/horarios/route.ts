import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { personas, turnos } from "@/db/schema";
import { localTurnoDateTime } from "@/lib/horarios/date-utils";
import type { Persona, Turno, TurnoTipo } from "@/types/horarios";

export const dynamic = "force-dynamic";

const TIPOS = ["cobro", "barra", "acto", "misa", "procesion", "noche", "otros"] as const;

const TurnoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dia: z.string().trim().min(1).max(80),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fin: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal(""), z.null()]).optional(),
  acto: z.string().trim().min(1).max(220),
  tipo: z.enum(TIPOS),
  persona_1_id: z.union([z.string(), z.number(), z.literal(""), z.null()]).optional(),
  persona_2_id: z.union([z.string(), z.number(), z.literal(""), z.null()]).optional(),
  apoyo_id: z.union([z.string(), z.number(), z.literal(""), z.null()]).optional(),
  orden: z.number().int().optional(),
});

const ReorderSchema = z.object({
  action: z.literal("reorder"),
  updates: z.array(z.object({ id: z.number().int(), orden: z.number().int() })).min(1),
});

function toNullableId(value: string | number | null | undefined) {
  if (value === undefined || value === "" || value === null) return null;
  const id = Number(value);
  if (!Number.isInteger(id)) throw new Error("ID de persona invalido");
  return id;
}

async function assertCommissionAuth() {
  const cookie = (await cookies()).get("commission_auth")?.value;
  if (!cookie) return false;

  const pass = process.env.INTRANET_PASS || "";
  const secret = process.env.SESSION_SECRET || "";
  const expected = crypto.createHash("sha256").update(pass + secret).digest("hex");
  return cookie === expected;
}

function normalizeTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function normalizeDateTime(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function recomputeTurnoEnds() {
  await db.execute(sql`
    WITH next_turnos AS (
      SELECT
        t1.id,
        t1.fecha_hora_inicio AS start_at,
        (
          SELECT min(t2.fecha_hora_inicio)
          FROM ${turnos} t2
          WHERE t2.fecha_hora_inicio > t1.fecha_hora_inicio
        ) AS next_start
      FROM ${turnos} t1
    )
    UPDATE ${turnos} t
    SET
      fecha_hora_fin = CASE
        WHEN next_turnos.next_start IS NOT NULL
          AND next_turnos.next_start - next_turnos.start_at <= interval '4 hours'
        THEN next_turnos.next_start
        ELSE NULL
      END,
      hora_fin = CASE
        WHEN next_turnos.next_start IS NOT NULL
          AND next_turnos.next_start - next_turnos.start_at <= interval '4 hours'
        THEN (next_turnos.next_start AT TIME ZONE 'Europe/Madrid')::time
        ELSE NULL
      END
    FROM next_turnos
    WHERE t.id = next_turnos.id
  `);
}

function buildTurnos(rows: Array<typeof turnos.$inferSelect>, people: Persona[]): Turno[] {
  const peopleById = new Map(people.map((persona) => [persona.id, persona]));

  return rows
    .map((turno) => ({
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
    }))
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.orden !== b.orden) return a.orden - b.orden;
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });
}

async function readHorarios() {
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
    db.select().from(turnos).orderBy(turnos.fecha, turnos.orden, turnos.horaInicio),
  ]);

  const people = peopleRows as Persona[];
  return {
    personas: people,
    turnos: buildTurnos(turnoRows, people),
  };
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL no esta configurada" }, { status: 500 });
    }

    return NextResponse.json(await readHorarios());
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron cargar los horarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await assertCommissionAuth())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = TurnoSchema.parse(await req.json().catch(() => ({})));
    const startsAt = localTurnoDateTime(body.fecha, body.hora_inicio).toUTC().toJSDate();
    const [inserted] = await db
      .insert(turnos)
      .values({
        fecha: body.fecha,
        dia: body.dia,
        horaInicio: body.hora_inicio,
        horaFin: null,
        fechaHoraInicio: startsAt,
        fechaHoraFin: null,
        acto: body.acto,
        tipo: body.tipo,
        persona1Id: toNullableId(body.persona_1_id),
        persona2Id: toNullableId(body.persona_2_id),
        apoyoId: toNullableId(body.apoyo_id),
        orden: body.orden ?? 0,
      })
      .returning();

    await recomputeTurnoEnds();
    return NextResponse.json({ ok: true, turno: inserted, ...(await readHorarios()) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await assertCommissionAuth())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const reorder = ReorderSchema.safeParse(json);

    if (reorder.success) {
      await Promise.all(
        reorder.data.updates.map((item) => db.update(turnos).set({ orden: item.orden }).where(eq(turnos.id, item.id)))
      );
      await recomputeTurnoEnds();
      return NextResponse.json({ ok: true, ...(await readHorarios()) });
    }

    const id = z.number().int().parse(json?.id);
    const body = TurnoSchema.parse(json?.turno ?? {});
    const startsAt = localTurnoDateTime(body.fecha, body.hora_inicio).toUTC().toJSDate();
    const [updated] = await db
      .update(turnos)
      .set({
        fecha: body.fecha,
        dia: body.dia,
        horaInicio: body.hora_inicio,
        horaFin: null,
        fechaHoraInicio: startsAt,
        fechaHoraFin: null,
        acto: body.acto,
        tipo: body.tipo,
        persona1Id: toNullableId(body.persona_1_id),
        persona2Id: toNullableId(body.persona_2_id),
        apoyoId: toNullableId(body.apoyo_id),
        orden: body.orden ?? 0,
      })
      .where(eq(turnos.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    await recomputeTurnoEnds();
    return NextResponse.json({ ok: true, turno: updated, ...(await readHorarios()) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await assertCommissionAuth())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = z.object({ id: z.number().int() }).parse(await req.json().catch(() => ({})));
    await db.delete(turnos).where(eq(turnos.id, id));
    await recomputeTurnoEnds();

    return NextResponse.json({ ok: true, ...(await readHorarios()) });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}
