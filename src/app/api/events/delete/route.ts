import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { githubGetFile, githubPutFile } from "@/lib/github";

export const runtime = "nodejs"; // usar Node runtime

type DeletePayload = {
  title: string;
  date?: string;
  time?: string;
};

function expectedCookieValue() {
  const pass = (process.env.INTRANET_PASS || "").trim();
  const secret = (process.env.SESSION_SECRET || "").trim();
  return crypto.createHash("sha256").update(pass + secret).digest("hex");
}

// Localiza el array exportado (soporta tipado y sin tipar) y devuelve sus partes
function findArraySegments(tsSource: string) {
  // Buscar: export const fiestas [: tipo opcional] = [
  const re = /export\s+const\s+fiestas(?:\s*:\s*[\w\[\]\s<>|&?,.]+)?\s*=\s*\[/m;
  const match = tsSource.match(re);
  if (!match || typeof match.index !== "number") {
    throw new Error("No se encontró la declaración del array 'fiestas'.");
  }
  const start = match.index;
  const openBracket = tsSource.indexOf("[", start);
  const closeBracket = tsSource.indexOf("];", openBracket);
  if (openBracket === -1 || closeBracket === -1) {
    throw new Error("No se pudo localizar el array 'fiestas' completo.");
  }
  const before = tsSource.slice(0, openBracket + 1);
  const inside = tsSource.slice(openBracket + 1, closeBracket);
  const after = tsSource.slice(closeBracket);
  return { before, inside, after };
}

// Separa objetos de nivel superior por comas respetando llaves anidadas
function splitTopLevelObjects(inside: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < inside.length; i++) {
    const ch = inside[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  const last = buf.trim();
  if (last) out.push(buf);
  return out.map(s => s.trim()).filter(s => s.length > 0);
}

// Extrae valores (muy simple) de title/date/time dentro del objeto como texto
function extractField(objText: string, field: "title" | "date" | "time"): string | undefined {
  const re = new RegExp(field + String.raw`\s*:\s*"([^"]*)"`);
  const m = objText.match(re);
  return m ? m[1] : undefined;
}

function removeMatchingObject(inside: string, key: DeletePayload) {
  const parts = splitTopLevelObjects(inside);
  let removed = false;
  const kept: string[] = [];
  for (const p of parts) {
    const t = extractField(p, "title");
    const d = extractField(p, "date");
    const ti = extractField(p, "time");
    const titleEq = (t || "") === (key.title || "");
    const dateEq = (key.date ? (d || "") === key.date : true); // si no viene date, no lo usamos
    const timeEq = (key.time ? (ti || "") === key.time : true);
    if (!removed && titleEq && dateEq && timeEq) {
      removed = true;
      // Comentamos la línea en lugar de eliminarla
      const commented = p.split("\n").map(line => "// " + line).join("\n");
      kept.push(commented);
      continue;
    }
    kept.push(p);
  }
  return { removed, newInside: kept.length ? "\n  " + kept.map(s => s.replace(/^\s*/,"  ")).join(",\n  ") + "\n" : "" };
}

export async function POST(req: Request) {
  try {
    // 1) Auth por cookie
    const cookieStore = await cookies();
    const cookie = cookieStore.get("commission_auth")?.value || "";
    if (cookie !== expectedCookieValue()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2) Payload
    const payload = (await req.json()) as DeletePayload;
    if (!payload.title) {
      return NextResponse.json({ error: "title requerido" }, { status: 400 });
    }

    // 3) Leer archivo desde GitHub
    const { content, sha, encoding } = await githubGetFile();
    if (encoding !== "base64") throw new Error("Encoding inesperado en GitHub.");
    const tsSource = Buffer.from(content, "base64").toString("utf8");

    // 4) Quitar el objeto
    const { before, inside, after } = findArraySegments(tsSource);
    const { removed, newInside } = removeMatchingObject(inside, payload);
    if (!removed) {
      return NextResponse.json({ error: "No se encontró un evento que coincida con title/date/time" }, { status: 404 });
    }

    const newTs = before + newInside + after;

    // 5) Commit
    const msg = `chore(events): delete "${payload.title}"${payload.date ? ` (${payload.date}${payload.time ? " " + payload.time : ""})` : ""}`;
    await githubPutFile({ newContent: newTs, sha, message: msg, author: { name: "Fiestas Matet Bot", email: "bot@matet.local" } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}