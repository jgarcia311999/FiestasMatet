import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ideasData } from "@/data/ideas";
import type { IdeasData } from "@/data/ideas.types";
import { githubGetFile, githubPutFile } from "@/lib/github";

process.env.EVENTS_FILE_PATH = "src/data/ideas.ts";

function serializeIdeasTs(data: IdeasData): string {
  const body = JSON.stringify(data, null, 2);
  return `import type { IdeasData } from "./ideas.types";\n\nexport const ideasData: IdeasData = ${body} as const;\n\nexport default ideasData;\n`;
}

export async function GET() {
  // autenticación básica: mismo cookie que usas en intranet
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
  return NextResponse.json(ideasData);
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

  const payload = (await req.json()) as { data: IdeasData; message?: string };
  // Validación mínima
  if (!Array.isArray(payload.data)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 1) Lee el fichero actual (opcional si no lo necesitas)
  const current = await githubGetFile();

  // 2) Serializa a TS
  const newContent = serializeIdeasTs(payload.data);

  // 3) Commit
  const msg = payload.message ?? "chore(ideas): update ideas";
  await githubPutFile({
    newContent,
    sha: current.sha,
    message: msg,
  });

  return NextResponse.json({ ok: true });
}