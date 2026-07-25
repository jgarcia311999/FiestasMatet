import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { personas } from "@/db/schema";

export const dynamic = "force-dynamic";

const Payload = z.object({
  personaId: z.number().int(),
});

function createCalendarToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export async function POST(req: Request) {
  try {
    const { personaId } = Payload.parse(await req.json().catch(() => ({})));
    const [persona] = await db
      .select({
        id: personas.id,
        calendarToken: personas.calendarToken,
      })
      .from(personas)
      .where(eq(personas.id, personaId))
      .limit(1);

    if (!persona) return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });

    const token = persona.calendarToken ?? createCalendarToken();
    if (!persona.calendarToken) {
      await db.update(personas).set({ calendarToken: token }).where(eq(personas.id, personaId));
    }

    return NextResponse.json({ token });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo crear el enlace" }, { status: 400 });
  }
}
