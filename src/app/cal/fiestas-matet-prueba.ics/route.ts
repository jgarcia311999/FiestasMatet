import { NextResponse } from "next/server";
import { buildTestCalendarIcs } from "@/lib/calendarIcs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { origin } = new URL(req.url);
  const ics = buildTestCalendarIcs(origin);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="fiestas-matet-prueba.ics"',
      "Cache-Control": "public, max-age=43200",
    },
  });
}
