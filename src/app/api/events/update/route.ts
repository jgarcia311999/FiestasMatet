import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { githubGetFile, githubPutFile } from "@/lib/github";

export const runtime = "nodejs"; // asegurar Node runtime

type MatchKey = { title: string; date?: string; time?: string };

type Patch = {
  title?: string;
  img?: string;
  description?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  location?: string;
};

function expectedCookieValue() {
  const pass = (process.env.INTRANET_PASS || "").trim();
  const secret = (process.env.SESSION_SECRET || "").trim();
  return crypto.createHash("sha256").update(pass + secret).digest("hex");
}

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

function extractField(objText: string, field: "title" | "date" | "time" | "img" | "description" | "location"): string | undefined {
  const re = new RegExp(field + String.raw`\s*:\s*"([^"]*)"`);
  const m = objText.match(re);
  return m ? m[1] : undefined;
}

function replaceField(objText: string, field: keyof Patch, value: string | undefined) {
  // Si value es undefined, no tocamos el campo
  if (typeof value === "undefined") return objText;
  const hasField = new RegExp(field + String.raw`\s*:`).test(objText);
  const serialized = `${field}: ${JSON.stringify(value)}`;
  if (hasField) {
    // Reemplaza el valor existente
    const re = new RegExp(field + String.raw`\s*:\s*"([^"]*)"`);
    return objText.replace(re, serialized);
  }
  // Insertar antes del cierre '}' con una coma si hace falta
  const insertPos = objText.lastIndexOf("}");
  if (insertPos === -1) return objText; // inválido, lo dejamos
  const before = objText.slice(0, insertPos).trimEnd();
  const needsComma = /\{$/.test(before) ? "" : ",";
  const after = objText.slice(insertPos);
  return `${before}${needsComma} ${serialized}${after}`;
}

function applyPatch(objText: string, patch: Patch): string {
  let t = objText;
  t = replaceField(t, "title", patch.title);
  t = replaceField(t, "img", patch.img);
  t = replaceField(t, "description", patch.description);
  t = replaceField(t, "date", patch.date);
  t = replaceField(t, "time", patch.time);
  t = replaceField(t, "location", patch.location);
  return t;
}

function updateMatchingObject(inside: string, match: MatchKey, patch: Patch) {
  const parts = splitTopLevelObjects(inside);
  let updated = false;
  const mapped = parts.map(p => {
    const t = extractField(p, "title");
    const d = extractField(p, "date");
    const ti = extractField(p, "time");
    const titleEq = (t || "") === (match.title || "");
    const dateEq = match.date ? (d || "") === match.date : true;
    const timeEq = match.time ? (ti || "") === match.time : true;
    if (!updated && titleEq && dateEq && timeEq) {
      updated = true;
      // Mantener indentación básica
      const base = p.replace(/^\s+|\s+$/g, "");
      const patched = applyPatch(base, patch);
      return patched;
    }
    return p;
  });
  return { updated, newInside: mapped.length ? "\n  " + mapped.map(s => s.replace(/^\s*/,"  ")).join(",\n  ") + "\n" : "" };
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
    const body = await req.json();
    const match = (body?.match || {}) as MatchKey;
    const patch = (body?.patch || {}) as Patch;
    if (!match?.title) {
      return NextResponse.json({ error: "match.title requerido" }, { status: 400 });
    }

    // 3) Leer archivo
    const { content, sha, encoding } = await githubGetFile();
    if (encoding !== "base64") throw new Error("Encoding inesperado en GitHub.");
    const tsSource = Buffer.from(content, "base64").toString("utf8");

    // 4) Actualizar
    const { before, inside, after } = findArraySegments(tsSource);
    const { updated, newInside } = updateMatchingObject(inside, match, patch);
    if (!updated) {
      return NextResponse.json({ error: "No se encontró un evento que coincida con title/date/time" }, { status: 404 });
    }

    const newTs = before + newInside + after;

    // 5) Commit
    const titleForMsg = patch.title || match.title;
    const msg = `chore(events): update "${titleForMsg}"`;
    await githubPutFile({ newContent: newTs, sha, message: msg, author: { name: "Fiestas Matet Bot", email: "bot@matet.local" } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
