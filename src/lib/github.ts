// src/lib/github.ts
import { Buffer } from "node:buffer";

const GH_API = "https://api.github.com";

function getHeaders() {
  const token = process.env.GITHUB_TOKEN || "";
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

type GhFile = { content: string; sha: string; encoding: "base64" };

export async function githubGetFile(): Promise<GhFile> {
  const repo = process.env.GITHUB_REPO!;
  const path = process.env.EVENTS_FILE_PATH!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const res = await fetch(
    `${GH_API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: getHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return { content: json.content, sha: json.sha, encoding: json.encoding };
}

export async function githubPutFile(params: {
  newContent: string; // contenido completo del archivo
  sha: string;        // sha actual
  message: string;    // mensaje de commit
  author?: { name: string; email: string };
}) {
  const repo = process.env.GITHUB_REPO!;
  const path = process.env.EVENTS_FILE_PATH!;
  const branch = process.env.GITHUB_BRANCH || "main";

  const body = {
    message: params.message,
    content: Buffer.from(params.newContent, "utf8").toString("base64"),
    sha: params.sha,
    branch,
    ...(params.author ? { committer: params.author, author: params.author } : {}),
  };

  const res = await fetch(
    `${GH_API}/repos/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${await res.text()}`);
  return res.json();
}