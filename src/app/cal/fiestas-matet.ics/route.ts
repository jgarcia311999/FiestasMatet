import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { buildCalendarIcs } from "@/lib/calendarIcs";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL no esta configurada." },
        { status: 500 }
      );
    }

    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        calendarTitle: events.calendarTitle,
        location: events.location,
        startsAt: events.startsAt,
        provisional: events.provisional,
      })
      .from(events)
      .where(eq(events.visible, true));

    const { origin } = new URL(req.url);
    const ics = buildCalendarIcs(rows, origin);

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="fiestas-matet.ics"',
        "Cache-Control": "public, max-age=43200",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo generar el calendario.",
      },
      { status: 500 }
    );
  }
}
