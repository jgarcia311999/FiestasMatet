import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
// @ts-expect-error: date-fns-tz typings do not expose zonedTimeToUtc correctly
import zonedTimeToUtc from "date-fns-tz/zonedTimeToUtc";

export const dynamic = "force-dynamic";
// export const runtime = "edge"; // opcional si usas Edge

const TZ = "Europe/Madrid";

// Permite strings vacíos y los convierte a undefined
const EmptyToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("")]).transform((v) => (v === "" ? undefined : v));

const CreateSchema = z
  .object({
    title: z.string().trim().min(1, "Título requerido"),
    img: EmptyToUndef(z.string().trim().min(1)).optional(),
    description: EmptyToUndef(z.string()).optional(),
    // O bien nos mandan startsAt directamente, o bien date+time
    startsAt: z.union([z.string(), z.date()]).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    location: EmptyToUndef(z.string()).optional(),
    provisional: z.boolean().optional(),
    attendees: z.array(z.string()).optional(),
  })
  .refine(
    (v) => !!v.startsAt || (!!v.date && !!v.time),
    {
      message: "Debes enviar startsAt o (date y time)",
      path: ["startsAt"],
    }
  );

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const body = CreateSchema.parse(json);

    // Componer startsAt en SQL si llega date+time; si llega startsAt, lo usamos tal cual
    let startsAtValue: SQL | Date;
    if (body.date && body.time) {
      const dateTime = `${body.date}T${body.time}:00`;
      startsAtValue = zonedTimeToUtc(dateTime, TZ);
    } else if (body.startsAt) {
      // Aceptamos string o Date; Drizzle soporta Date para timestamptz
      const dt = typeof body.startsAt === "string" ? new Date(body.startsAt) : body.startsAt;
      // Si dt no es válida, lanzamos error explícito
      if (isNaN(dt.getTime())) throw new Error("startsAt inválido");
      startsAtValue = dt;
    } else {
      // TS no puede inferir la garantía del refine de Zod: añadimos else explícito
      throw new Error("Debes enviar startsAt o (date y time)");
    }

    const [inserted] = await db
      .insert(events)
      .values({
        title: body.title,
        img: body.img ?? "",
        description: body.description ?? "",
        startsAt: startsAtValue,
        location: body.location ?? "",
        provisional: body.provisional ?? false,
        attendees: body.attendees ?? [],
      })
      .returning({
        id: events.id,
        title: events.title,
        img: events.img,
        description: events.description,
        startsAt: events.startsAt,
        location: events.location,
        provisional: events.provisional,
        attendees: events.attendees,
        date: sql<string>`to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'YYYY-MM-DD')`,
        time: sql<string>`to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'HH24:MI')`,
      });

    return NextResponse.json({ ok: true, event: inserted });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 400 }
    );
  }
}