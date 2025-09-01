// src/app/api/events/new/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { githubGetFile, githubPutFile } from "@/lib/github";

export const runtime = "nodejs"; // usamos Node runtime

type Evento = {
  title: string;
  img?: string;
  description?: string;
  date?: string;   // "YYYY-MM-DD"
  time?: string;   // "HH:MM"
  location?: string;
};

// Recalculamos el hash esperado (como en middleware)
function expectedCookieValue() {
  const pass = (process.env.INTRANET_PASS || "").trim();
  const secret = (process.env.SESSION_SECRET || "").trim();
  return crypto.createHash("sha256").update(pass + secret).digest("hex");
}

// Función que inserta el nuevo evento en el array export const fiestas: Fiesta[] = [ ... ];
function appendEventToFile(tsSource: string, newEvent: Evento): string {
  // Soportamos dos variantes del marcador (con y sin tipo)
  const markers = [
    "export const fiestas: Fiesta[] = [",
    "export const fiestas = [",
  ];
  let start = -1;
  let marker = "";
  for (const m of markers) {
    const idx = tsSource.indexOf(m);
    if (idx !== -1) { start = idx; marker = m; break; }
  }
  if (start === -1) {
    throw new Error("No se encontró 'export const fiestas: Fiesta[] = [' ni 'export const fiestas = [' en el archivo.");
  }

  const openBracket = tsSource.indexOf("[", start);
  const closeBracket = tsSource.indexOf("];", openBracket);
  if (openBracket === -1 || closeBracket === -1) {
    throw new Error("No se pudo localizar el array 'fiestas' completo.");
  }

  const before = tsSource.slice(0, openBracket + 1);
  const inside = tsSource.slice(openBracket + 1, closeBracket).trim();
  const after = tsSource.slice(closeBracket);

  const ev = newEvent;
  const line =
    `\n  { title: ${JSON.stringify(ev.title)}, img: ${JSON.stringify(ev.img || "")}, description: ${JSON.stringify(ev.description || "")}, date: ${JSON.stringify(ev.date || "")}, time: ${JSON.stringify(ev.time || "")}, location: ${JSON.stringify(ev.location || "")} },`;

  const newInside = inside ? inside + line : line.slice(1); // si estaba vacío, quita salto inicial
  return before + newInside + "\n" + after;
}

export async function POST(req: Request) {
  try {
    // 1) Verificar cookie de login
    const cookie = (await cookies()).get("commission_auth")?.value || "";
    if (cookie !== expectedCookieValue()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2) Obtener datos del body
    const payload = (await req.json()) as Evento;
    if (!payload.title?.trim()) {
      return NextResponse.json({ error: "title requerido" }, { status: 400 });
    }

    // 3) Leer archivo actual desde GitHub
    const { content, sha, encoding } = await githubGetFile();
    if (encoding !== "base64") throw new Error("Encoding inesperado en GitHub.");
    const tsSource = Buffer.from(content, "base64").toString("utf8");

    // 4) Insertar nuevo evento
    const newTs = appendEventToFile(tsSource, payload);

    // 5) Subir commit a GitHub
    const msg = `chore(events): add "${payload.title}"`;
    await githubPutFile({
      newContent: newTs,
      sha,
      message: msg,
      author: { name: "Fiestas Matet Bot", email: "bot@matet.local" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}