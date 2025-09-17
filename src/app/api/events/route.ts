// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";

// Evita cache en desarrollo/producción; siempre datos frescos
export const dynamic = "force-dynamic";
// Si usas Neon serverless en Edge, puedes activar esto:
// export const runtime = "edge";

const TZ = "Europe/Madrid";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        img: events.img,
        description: events.description,
        location: events.location,
        provisional: events.provisional,
        attendees: events.attendees,
        startsAt: events.startsAt,
      })
      .from(events)
      .orderBy(asc(events.startsAt));

    // Devuelve las filas con startsAt como string y añade date/time normalizados en zona Madrid
    const normalized = rows.map((e) => ({
      ...e,
      startsAt: String(e.startsAt),
      date: formatInTimeZone(e.startsAt, TZ, "yyyy-MM-dd"),
      time: formatInTimeZone(e.startsAt, TZ, "HH:mm"),
    }));

    return NextResponse.json({ events: normalized });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron obtener los eventos" },
      { status: 500 }
    );
  }
}