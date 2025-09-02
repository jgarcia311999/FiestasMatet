"use client";
import { useEffect, useState } from "react";
import { ideasData as initialIdeas } from "@/data/ideas";
import type { IdeaSection, IdeasData } from "@/data/ideas.types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function IdeasPage() {
  const [data, setData] = useState<IdeasData>(initialIdeas); // IdeasData = IdeaSection[]
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const isEditing = (key: string) => editingKey === key;

  async function saveToGitHub(next: IdeasData, message: string): Promise<boolean> {
    setPending(true);
    const prev = data;
    setData(next); // Optimistic UI
    try {
      const res = await fetch("/api/ideas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: next, message }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Error ${res.status}`);
      }
      return true;
    } catch (err: unknown) {
      setData(prev); // rollback
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
      return false;
    } finally {
      setPending(false);
    }
  }

  function startEdit(sectionKey: string) {
    setEditingKey(sectionKey);
  }

  function cancelEdit() {
    setEditingKey(null);
    setError(null);
  }

  function updateSectionTitle(sectionKey: string, title: string) {
    setData((d) => d.map((s) => (s.key === sectionKey ? { ...s, title } : s)));
  }

  function addItem(sectionKey: string) {
    setData((d) =>
      d.map((s) =>
        s.key === sectionKey
          ? { ...s, items: [...s.items, { id: uid(), text: "" }] }
          : s
      )
    );
  }

  function updateItem(sectionKey: string, itemId: string, text: string) {
    setData((d) =>
      d.map((s) =>
        s.key === sectionKey
          ? {
              ...s,
              items: s.items.map((it) => (it.id === itemId ? { ...it, text } : it)),
            }
          : s
      )
    );
  }

  function removeItem(sectionKey: string, itemId: string) {
    setData((d) =>
      d.map((s) =>
        s.key === sectionKey
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
          : s
      )
    );
  }

  async function saveSection(sectionKey: string) {
    const section = data.find((s) => s.key === sectionKey);
    const msg = section ? `chore(ideas): update "${section.title}"` : "chore(ideas): update ideas";
    const ok = await saveToGitHub(data, msg);
    if (ok) setEditingKey(null);
  }

  async function addSection() {
    const key = `sec-${uid()}`;
    const next: IdeaSection = { key, title: "Nuevo apartado", items: [] };
    const updated = [...data, next];
    setEditingKey(key);
    const ok = await saveToGitHub(updated, `chore(ideas): add section "${next.title}"`);
    if (!ok) setEditingKey(key);
  }

  const pageBg = "#FFD966";

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
      <div className="mx-auto max-w-3xl px-4 py-6 text-[#0C2335]">
        <h1 className="text-[36px] font-serif leading-none mb-4">Ideas</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={addSection}
            className="rounded-md border border-[#0C2335] px-3 py-1 text-sm"
            disabled={pending}
          >
            + Añadir apartado
          </button>
          {pending && <span className="text-sm">Guardando…</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>

        <div className="space-y-6">
          {data.map((sec) => (
            <section key={sec.key} className="rounded-2xl bg-white/70 p-4">
              <div className="flex items-center justify-between">
                {isEditing(sec.key) ? (
                  <input
                    value={sec.title}
                    onChange={(e) => updateSectionTitle(sec.key, e.target.value)}
                    className="text-xl font-semibold bg-transparent border-b border-[#0C2335] outline-none w-full mr-2"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{sec.title}</h2>
                )}

                <button
                  onClick={() => (isEditing(sec.key) ? saveSection(sec.key) : startEdit(sec.key))}
                  className="ml-2 rounded-md border border-[#0C2335] px-2 py-1 text-sm"
                  aria-label={isEditing(sec.key) ? "Guardar" : "Editar"}
                >
                  {isEditing(sec.key) ? "Guardar" : "✏️"}
                </button>
                {isEditing(sec.key) && (
                  <button onClick={cancelEdit} className="ml-2 rounded-md border border-gray-400 px-2 py-1 text-sm">
                    Cancelar
                  </button>
                )}
              </div>

              <ul className="mt-3 space-y-2">
                {sec.items.map((it) => (
                  <li key={it.id} className="flex items-start gap-2">
                    {isEditing(sec.key) ? (
                      <>
                        <textarea
                          value={it.text}
                          onChange={(e) => updateItem(sec.key, it.id, e.target.value)}
                          className="w-full rounded-md bg-white/80 border border-[#0C2335]/30 p-2 text-sm"
                          rows={2}
                          placeholder="Escribe tu idea…"
                        />
                        <button
                          type="button"
                          aria-label="Eliminar"
                          onClick={() => removeItem(sec.key, it.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="text-[15px] leading-snug">• {it.text}</span>
                    )}
                  </li>
                ))}
              </ul>

              {isEditing(sec.key) && (
                <div className="mt-3">
                  <button onClick={() => addItem(sec.key)} className="rounded-md border border-[#0C2335] px-3 py-1 text-sm">
                    + Añadir idea
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>

        <p className="mt-6 text-xs opacity-70">Toca ✏️ para editar un apartado. Cambios guardados en GitHub.</p>
      </div>
    </div>
  );
}