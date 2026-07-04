import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TZ = "Europe/Madrid";

function normalizeRows(
  rows: Array<{
    id: number;
    title: string;
    location?: string | null;
    visible?: boolean | null;
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
      visible: !!event.visible,
      provisional: !!event.provisional,
      attendees: Array.isArray(event.attendees) ? event.attendees : [],
      tags: Array.isArray(event.tags) ? event.tags : [],
      startsAt: startsAt.toISOString(),
      date: formatInTimeZone(startsAt, TZ, "yyyy-MM-dd"),
      time: formatInTimeZone(startsAt, TZ, "HH:mm"),
    };
  });
}

async function canIncludeHidden() {
  const includeHiddenCookie = (await cookies()).get("commission_auth")?.value;
  if (!includeHiddenCookie) return false;

  const pass = process.env.INTRANET_PASS || "";
  const secret = process.env.SESSION_SECRET || "";
  const expected = crypto.createHash("sha256").update(pass + secret).digest("hex");
  return includeHiddenCookie === expected;
}

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL no esta configurada. Horarios solo funciona con la BBDD real." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const wantsHidden = searchParams.get("includeHidden") === "1";
    const includeHidden = wantsHidden && (await canIncludeHidden());

    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        location: events.location,
        visible: events.visible,
        provisional: events.provisional,
        attendees: events.attendees,
        startsAt: events.startsAt,
        tags: events.tags,
      })
      .from(events);

    const rows = includeHidden ? await baseQuery : await baseQuery.where(eq(events.visible, true));

    const normalized = normalizeRows(rows).sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    return NextResponse.json({ events: normalized });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron obtener los eventos desde la base de datos" },
      { status: 500 }
    );
  }
}
