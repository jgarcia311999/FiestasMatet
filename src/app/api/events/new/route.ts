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

// Inserta el nuevo evento en el array export const fiestas[ : Fiesta[] ] = [ ... ];
function appendEventToFile(tsSource: string, newEvent: Evento): string {
  // Regex robusta: permite espacios, salto de línea, y tipo opcional `: Fiesta[]`
  const re = /export\s+const\s+fiestas\s*(?::\s*Fiesta\s*\[\s*\]\s*)?=\s*\[([\s\S]*?)\]\s*;?/m;
  const match = tsSource.match(re);
  if (!match) {
    throw new Error(
      "No se pudo localizar el array exportado 'fiestas'. Asegúrate de que exista `export const fiestas: Fiesta[] = [ ... ];` o `export const fiestas = [ ... ];`"
    );
  }

  const inside = match[1]; // contenido actual del array sin corchetes

  // Serializamos el nuevo objeto manteniendo claves explícitas (evita undefined)
  const e = newEvent;
  const objLine = `  {\n`+
    `    title: ${JSON.stringify(e.title ?? "")},\n`+
    `    img: ${JSON.stringify(e.img ?? "")},\n`+
    `    description: ${JSON.stringify(e.description ?? "")},\n`+
    `    date: ${JSON.stringify(e.date ?? "")},\n`+
    `    time: ${JSON.stringify(e.time ?? "")},\n`+
    `    location: ${JSON.stringify(e.location ?? "")}\n`+
    `  }`;

  let newInside: string;
  const trimmed = inside.trim();
  if (trimmed === "") {
    // Array vacío
    newInside = `\n${objLine}\n`;
  } else {
    // Asegura coma final en el último elemento existente
    const hasTrailingComma = /,\s*$/.test(trimmed);
    const insideWithComma = hasTrailingComma ? inside : inside.replace(/\s*$/, ",\n");
    newInside = insideWithComma + objLine + "\n";
  }

  // Sustituimos el bloque completo preservando el resto del fichero
  return tsSource.replace(re, (full) => full.replace(match[1], newInside));
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
    // Debug ligero (solo en desarrollo)
    if (process.env.NODE_ENV !== "production") {
      console.log("[events/new] tsSource length:", tsSource.length);
    }

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
    console.error("/api/events/new error:", err);
    return NextResponse.json({ error: msg, code: "EVENTS_NEW_ERROR" }, { status: 500 });
  }
}