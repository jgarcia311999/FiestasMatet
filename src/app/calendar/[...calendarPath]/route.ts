import { NextResponse } from "next/server";
import { normalizeCalendarMode } from "@/lib/horarios/calendar-filter";
import { generateCalendar, getPersonaByCalendarToken } from "@/lib/horarios/personal-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ calendarPath?: string[] }> }) {
  try {
    const { calendarPath = [] } = await params;
    const fileName = calendarPath[0] ?? "";
    const token = fileName.endsWith(".ics") ? fileName.slice(0, -4) : "";

    if (!/^[a-f0-9]{32,96}$/i.test(token)) {
      return NextResponse.json({ error: "Calendario no encontrado" }, { status: 404 });
    }

    const persona = await getPersonaByCalendarToken(token);
    if (!persona) {
      return NextResponse.json({ error: "Calendario no encontrado" }, { status: 404 });
    }

    const url = new URL(req.url);
    const mode = normalizeCalendarMode(url.searchParams.get("modo"));
    const ics = await generateCalendar(persona.id, mode, url.origin);

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="turnos-${token.slice(0, 8)}.ics"`,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo generar el calendario" },
      { status: 500 }
    );
  }
}
