import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { ideaSections, ideaItems } from "@/db/schema";

export async function GET() {
  const cookieStore = await cookies();
  const pass =
    cookieStore.get("commission_session") ??
    cookieStore.get("intranet_session") ??
    cookieStore.get("session") ??
    cookieStore.get("commission_auth") ??
    cookieStore.get("commission_user");
  if (!pass) {
    const debug = process.env.NODE_ENV !== "production" ? { cookies: cookieStore.getAll().map(c => c.name) } : undefined;
    return NextResponse.json({ error: "Unauthorized", ...debug }, { status: 401 });
  }

  const sections = await db.select().from(ideaSections);
  const items = await db.select().from(ideaItems);
  const grouped = sections.map(sec => ({
    key: sec.key,
    title: sec.title,
    items: items.filter(it => it.sectionKey === sec.key).map(it => ({ id: String(it.id), text: it.text }))
  }));

  return NextResponse.json({ data: grouped });
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const pass =
    cookieStore.get("commission_session") ??
    cookieStore.get("intranet_session") ??
    cookieStore.get("session") ??
    cookieStore.get("commission_auth") ??
    cookieStore.get("commission_user");
  if (!pass) {
    const debug = process.env.NODE_ENV !== "production" ? { cookies: cookieStore.getAll().map(c => c.name) } : undefined;
    return NextResponse.json({ error: "Unauthorized", ...debug }, { status: 401 });
  }

  const payload = (await req.json()) as { data: { key: string; title: string; items: { id: string; text: string }[] }[] };
  if (!Array.isArray(payload.data)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Limpiar tablas
  await db.delete(ideaItems);
  await db.delete(ideaSections);

  // Insertar secciones e items
  for (const sec of payload.data) {
    await db.insert(ideaSections).values({ key: sec.key, title: sec.title });
    if (Array.isArray(sec.items)) {
      for (const it of sec.items) {
        await db.insert(ideaItems).values({ sectionKey: sec.key, text: it.text });
      }
    }
  }

  return NextResponse.json({ ok: true });
}