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

    // Normaliza las fechas: interpreta `startsAt` como hora local de Europe/Madrid
    // (porque en la BBDD es TIMESTAMP WITHOUT TIME ZONE) y conviértela a UTC ISO.
    const normalized = rows.map((e) => {
      const d = e.startsAt instanceof Date ? e.startsAt : new Date(String(e.startsAt));
      // Interpretamos `d` como hora local de Madrid y lo convertimos a UTC ISO
      const iso = formatInTimeZone(d, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
      return {
        ...e,
        startsAt: new Date(iso).toISOString(),
      };
    });

    return NextResponse.json({ events: normalized });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron obtener los eventos" },
      { status: 500 }
    );
  }
}