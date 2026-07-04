import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/db/client";
import { events } from "@/db/schema";

const BodySchema = z.object({
  visible: z.boolean(),
});

async function isAuthorized() {
  const cookie = (await cookies()).get("commission_auth")?.value;
  if (!cookie) return false;

  const pass = process.env.INTRANET_PASS || "";
  const secret = process.env.SESSION_SECRET || "";
  const expected = crypto.createHash("sha256").update(pass + secret).digest("hex");
  return cookie === expected;
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = BodySchema.parse(await req.json().catch(() => ({})));
    await db.update(events).set({ visible: body.visible });

    return NextResponse.json({ ok: true, visible: body.visible });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 400 }
    );
  }
}
