import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DateTime } from "luxon";

const TZ = "Europe/Madrid";

const MatchSchema = z.union([
  z.object({ id: z.union([z.string(), z.number()]) }),
  z.object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

const PatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  img: z.string().trim().min(1).or(z.literal("")).optional(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().optional(),
  provisional: z.boolean().optional(),
});

async function findEventId(match: z.infer<typeof MatchSchema>) {
  if ("id" in match) {
    const [row] = await db
      .select({ id: events.id })
      .from(events)
      .where(sql`${events.id}::text = ${String(match.id)}`)
      .limit(1);
    return row?.id ?? null;
  }
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(sql`
      ${events.title} = ${match.title}
      AND to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'YYYY-MM-DD') = ${match.date}
      AND to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'HH24:MI') = ${match.time}
    `)
    .limit(1);
  return row?.id ?? null;
}

async function getLocalDateTimeStringsById(id: number | string) {
  const [row] = await db
    .select({
      date: sql<string>`to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'YYYY-MM-DD')`,
      time: sql<string>`to_char(${events.startsAt} AT TIME ZONE ${sql.raw(`'${TZ}'`)}, 'HH24:MI')`,
    })
    .from(events)
    .where(sql`${events.id}::text = ${String(id)}`)
    .limit(1);
  if (!row) throw new Error("Evento no encontrado al leer fecha/hora");
  return row;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const match = MatchSchema.parse(body?.match);
    const patch = PatchSchema.parse(body?.patch ?? {});
    const id = await findEventId(match);
    if (!id) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    const updateSet: Record<string, unknown> = {};
    if (patch.title !== undefined) updateSet.title = patch.title;
    if (patch.img !== undefined) updateSet.img = patch.img;
    if (patch.description !== undefined) updateSet.description = patch.description;
    if (patch.location !== undefined) updateSet.location = patch.location;
    if (patch.provisional !== undefined) updateSet.provisional = patch.provisional;

    if (patch.date !== undefined || patch.time !== undefined) {
      const curr = await getLocalDateTimeStringsById(id);
      const dateStr = patch.date ?? curr.date;
      const timeStr = patch.time ?? curr.time;
      const dateTime = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: TZ });
      updateSet.startsAt = dateTime.toUTC().toJSDate();
    }

    const [updated] = await db
      .update(events)
      .set(updateSet)
      .where(sql`${events.id}::text = ${String(id)}`)
      .returning({
        id: events.id,
        title: events.title,
        img: events.img,
        description: events.description,
        startsAt: events.startsAt,
        location: events.location,
        provisional: events.provisional,
        attendees: events.attendees,
      });

    return NextResponse.json({ ok: true, event: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}