import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { githubGetFile, githubPutFile } from "@/lib/github";

export const runtime = "nodejs";

type MatchKey = { title: string; date?: string; time?: string };
type Body = { match: MatchKey; action?: "toggle"|"add"|"remove" };

function expectedCookieValue() {
  const pass = (process.env.INTRANET_PASS || "").trim();
  const secret = (process.env.SESSION_SECRET || "").trim();
  return crypto.createHash("sha256").update(pass + secret).digest("hex");
}

// Igual que en update/delete (regex flexible)
function findArraySegments(tsSource: string) {
  const re = /export\s+const\s+fiestas(?:\s*:\s*[\w\[\]\s<>|&?,.]+)?\s*=\s*\[/m;
  const match = tsSource.match(re);
  if (!match || typeof match.index !== "number") throw new Error("No se encontró el array 'fiestas'.");
  const start = match.index;
  const open = tsSource.indexOf("[", start);
  const close = tsSource.indexOf("];", open);
  if (open === -1 || close === -1) throw new Error("Array 'fiestas' incompleto.");
  return {
    before: tsSource.slice(0, open + 1),
    inside: tsSource.slice(open + 1, close),
    after: tsSource.slice(close),
  };
}

// Como en update/delete
function splitTopLevelObjects(inside: string): string[] {
  const out: string[] = [];
  let depth = 0, buf = "";
  for (let i = 0; i < inside.length; i++) {
    const ch = inside[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) { out.push(buf); buf = ""; continue; }
    buf += ch;
  }
  const last = buf.trim();
  if (last) out.push(buf);
  return out.map(s => s.trim()).filter(Boolean);
}

function extractString(objText: string, field: string): string | undefined {
  const re = new RegExp(field + String.raw`\s*:\s*"(.*?)"`);
  const m = objText.match(re);
  return m ? m[1] : undefined;
}

function upsertAttendees(objText: string, user: string, act: "toggle"|"add"|"remove"): string {
  // busca attendees: ["A","B"] o no presente
  const hasField = /attendees\s*:/.test(objText);
  if (!hasField) {
    const insertPos = objText.lastIndexOf("}");
    const before = objText.slice(0, insertPos).trimEnd();
    const needsComma = /\{$/.test(before) ? "" : ",";
    const arr = act === "remove" ? [] : [user];
    return `${before}${needsComma} attendees: ${JSON.stringify(arr)}${objText.slice(insertPos)}`;
  }

  // extraer array existente (versión simple)
  const m = objText.match(/attendees\s*:\s*\[([^\]]*)\]/);
  const raw = m?.[1] ?? "";
  const current = raw.split(",").map(s => s.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
  const set = new Set(current);
  if (act === "toggle") { set.has(user) ? set.delete(user) : set.add(user); }
  if (act === "add") set.add(user);
  if (act === "remove") set.delete(user);
  const arrText = JSON.stringify(Array.from(set));
  return objText.replace(/attendees\s*:\s*\[[^\]]*\]/, `attendees: ${arrText}`);
}

function applyAttend(inside: string, match: MatchKey, user: string, action: "toggle"|"add"|"remove") {
  const parts = splitTopLevelObjects(inside);
  let updated = false;
  const mapped = parts.map(p => {
    const t = extractString(p,"title");
    const d = extractString(p,"date");
    const ti = extractString(p,"time");
    const ok =
      (t || "") === (match.title || "") &&
      (match.date ? (d || "") === match.date : true) &&
      (match.time ? (ti || "") === match.time : true);
    if (!updated && ok) {
      updated = true;
      return upsertAttendees(p, user, action);
    }
    return p;
  });
  return { updated, newInside: mapped.length ? "\n  " + mapped.map(s => s.replace(/^\s*/,"  ")).join(",\n  ") + "\n" : "" };
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get("commission_auth")?.value || "";
    if (auth !== expectedCookieValue()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = cookieStore.get("commission_user")?.value || "";
    if (!user) return NextResponse.json({ error: "Usuario no identificado" }, { status: 400 });

    const body = await req.json() as Body;
    const match = body?.match;
    const action = body?.action || "toggle";
    if (!match?.title) return NextResponse.json({ error: "match.title requerido" }, { status: 400 });

    const { content, sha, encoding } = await githubGetFile();
    if (encoding !== "base64") throw new Error("Encoding inesperado.");
    const ts = Buffer.from(content, "base64").toString("utf8");

    const { before, inside, after } = findArraySegments(ts);
    const { updated, newInside } = applyAttend(inside, match, user, action);
    if (!updated) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    const newTs = before + newInside + after;
    let msg = "";
    if (action === "add") {
      msg = `${user} se apuntó a "${match.title}"`;
    } else if (action === "remove") {
      msg = `${user} canceló asistencia a "${match.title}"`;
    } else {
      msg = `${user} cambió asistencia a "${match.title}"`;
    }
    await githubPutFile({ newContent: newTs, sha, message: msg, author: { name: "Fiestas Matet Bot", email: "bot@matet.local" } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}