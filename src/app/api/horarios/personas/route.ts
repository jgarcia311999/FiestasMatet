import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { personas } from "@/db/schema";

export const dynamic = "force-dynamic";

const PersonaSchema = z.object({
  nombre: z.string().trim().min(1).max(140),
  activo: z.boolean().optional(),
  orden: z.number().int().nullable().optional(),
});

async function assertCommissionAuth() {
  const cookie = (await cookies()).get("commission_auth")?.value;
  if (!cookie) return false;

  const pass = process.env.INTRANET_PASS || "";
  const secret = process.env.SESSION_SECRET || "";
  const expected = crypto.createHash("sha256").update(pass + secret).digest("hex");
  return cookie === expected;
}

function createCalendarToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req: Request) {
  try {
    if (!(await assertCommissionAuth())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = PersonaSchema.parse(await req.json().catch(() => ({})));
    const [persona] = await db
      .insert(personas)
      .values({
        nombre: body.nombre,
        activo: body.activo ?? true,
        orden: body.orden ?? null,
        calendarToken: createCalendarToken(),
      })
      .returning();

    return NextResponse.json({ ok: true, persona });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await assertCommissionAuth())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const id = z.number().int().parse(json?.id);
    const body = PersonaSchema.partial().parse(json?.persona ?? {});
    const [persona] = await db
      .update(personas)
      .set({
        ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
        ...(body.activo !== undefined ? { activo: body.activo } : {}),
        ...(body.orden !== undefined ? { orden: body.orden } : {}),
      })
      .where(eq(personas.id, id))
      .returning();

    if (!persona) return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, persona });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error inesperado" }, { status: 400 });
  }
}
