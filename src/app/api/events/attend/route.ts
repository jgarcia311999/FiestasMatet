import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { z } from "zod";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const TZ = "Europe/Madrid";

const MatchSchema = z.union([
  z.object({ id: z.union([z.string(), z.number()]) }),
  z.object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

const Payload = z.object({
  match: MatchSchema,
  action: z.literal("toggle"),
});

async function findEventId(match: z.infer<typeof MatchSchema>): Promise<number | null> {
  if ("id" in match) {
    const parsedId = typeof match.id === "string" ? Number(match.id) : match.id;
    const [row] = await db.select({ id: events.id }).from(events).where(eq(events.id, parsedId)).limit(1);
    return row?.id ?? null;
  }
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(sql`
      ${events.title} = ${match.title}
      AND to_char(${events.startsAt}, 'YYYY-MM-DD') = ${match.date}
      AND to_char(${events.startsAt}, 'HH24:MI') = ${match.time}
    `)
    .limit(1);
  return row?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { match } = Payload.parse(body);

    // Next.js 13.4+ cookies() is sync, but `await` also works (it just returns the same value).
    // In older versions where cookies() returns a Promise, `await` resolves it.
    const jar = await (cookies() as unknown as Promise<ReadonlyRequestCookies> | ReadonlyRequestCookies);
    const user =
      jar.get("commission_user")?.value?.trim() ||
      jar.get("usuario")?.value?.trim() ||
      "";

    if (!user) {
      return NextResponse.json({ error: "No autenticado", action: "noop" }, { status: 401 });
    }

    const id = await findEventId(match);
    if (!id) return NextResponse.json({ error: "Evento no encontrado", action: "noop" }, { status: 404 });

    const [row] = await db
      .select({ attendees: events.attendees })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    const current = Array.isArray(row?.attendees) ? (row!.attendees as string[]) : [];
    const set = new Set(current);
    const had = set.has(user);
    let action: "add" | "remove" | "noop" = "noop";

    if (had) { set.delete(user); action = "remove"; }
    else { set.add(user); action = "add"; }

    const nextArr = Array.from(set);

    await db.update(events).set({ attendees: nextArr as unknown as string[] }).where(eq(events.id, id));

    return NextResponse.json({ ok: true, action });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado", action: "noop" }, { status: 400 });
  }
}