import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const TZ = "Europe/Madrid";

// Tipo del ID según el schema de Drizzle (evita any)
type EventId = typeof events.$inferSelect["id"];

const Payload = z.union([
  z.object({ id: z.union([z.string(), z.number()]) }),
  z.object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

async function findEventId(match: z.infer<typeof Payload>) {
  if ("id" in match) {
    const [row] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, match.id as EventId))
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const match = Payload.parse(body);
    const id = await findEventId(match);
    if (!id) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    await db.delete(events).where(eq(events.id, id as EventId));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}