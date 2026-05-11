// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import fallbackEvents from "../../../../events.json";
import { formatInTimeZone } from "date-fns-tz";

// Evita cache en desarrollo/producción; siempre datos frescos
export const dynamic = "force-dynamic";
// Si usas Neon serverless en Edge, puedes activar esto:
// export const runtime = "edge";

const TZ = "Europe/Madrid";

type FallbackEvent = {
  id: number;
  title: string;
  starts_at: string;
  location?: string;
  provisional?: boolean;
  attendees?: string[] | null;
  tags?: string[] | null;
};

function normalizeRows(
  rows: Array<{
    id: number;
    title: string;
    location?: string | null;
    provisional?: boolean | null;
    attendees?: unknown;
    startsAt: string | Date;
    tags?: string[] | null;
  }>
) {
  return rows.map((event) => {
    const startsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
    return {
      ...event,
      location: event.location ?? "",
      provisional: !!event.provisional,
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      tags: Array.isArray(event.tags) ? event.tags : [],
      startsAt: startsAt.toISOString(),
      date: formatInTimeZone(startsAt, TZ, "yyyy-MM-dd"),
      time: formatInTimeZone(startsAt, TZ, "HH:mm"),
    };
  });
}

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const [{ db }, { events }] = await Promise.all([
        import("../../../db/client.js"),
        import("../../../db/schema.js"),
      ]);

      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          location: events.location,
          provisional: events.provisional,
          attendees: events.attendees,
          startsAt: events.startsAt,
          tags: events.tags,
        })
        .from(events);

      const normalized = normalizeRows(rows).sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );

      return NextResponse.json({ events: normalized });
    }

    const normalizedFallback = normalizeRows(
      (fallbackEvents as FallbackEvent[]).map((event) => ({
        id: event.id,
        title: event.title,
        location: event.location ?? "",
        provisional: event.provisional ?? false,
        attendees: event.attendees ?? [],
        startsAt: event.starts_at,
        tags: event.tags ?? [],
      }))
    );

    return NextResponse.json({ events: normalizedFallback });
  } catch (err: unknown) {
    const normalizedFallback = normalizeRows(
      (fallbackEvents as FallbackEvent[]).map((event) => ({
        id: event.id,
        title: event.title,
        location: event.location ?? "",
        provisional: event.provisional ?? false,
        attendees: event.attendees ?? [],
        startsAt: event.starts_at,
        tags: event.tags ?? [],
      }))
    );

    return NextResponse.json({
      events: normalizedFallback,
      source: "fallback",
      warning: err instanceof Error ? err.message : "No se pudieron obtener los eventos desde la base de datos",
    });
  }
}
