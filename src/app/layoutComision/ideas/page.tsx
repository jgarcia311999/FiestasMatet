"use client";

import { useEffect, useRef, useState } from "react";
import { ideasData as initialIdeas } from "@/data/ideas";
import type { IdeaSection, IdeasData } from "@/data/ideas.types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function IdeasPage() {
  const [data, setData] = useState<IdeasData>(initialIdeas);
  const [openKey, setOpenKey] = useState<string | null>(null); // acordeón por sección
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast (opcional) para feedback de borrado de sección
  const [toast, setToast] = useState<{ show: boolean; text: string }>({ show: false, text: "" });
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  function showToast(text: string) {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ show: true, text });
    toastTimerRef.current = window.setTimeout(() => setToast({ show: false, text: "" }), 3500);
  }

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

  async function addSection() {
    const key = `sec-${uid()}`;
    const next: IdeaSection = { key, title: "Nuevo apartado", items: [] };
    const updated = [...data, next];
    setOpenKey(key);
    setEditingKey(key);
    const ok = await saveToGitHub(updated, `chore(ideas): add section "${next.title}"`);
    if (!ok) setEditingKey(key);
  }

  function startEdit(sectionKey: string) {
    setEditingKey(sectionKey);
    setOpenKey(sectionKey);
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
      d.map((s) => (s.key === sectionKey ? { ...s, items: [...s.items, { id: uid(), text: "" }] } : s))
    );
  }

  function updateItem(sectionKey: string, itemId: string, text: string) {
    setData((d) =>
      d.map((s) =>
        s.key === sectionKey
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
          : s
      )
    );
  }

  function removeItem(sectionKey: string, itemId: string) {
    setData((d) =>
      d.map((s) => (s.key === sectionKey ? { ...s, items: s.items.filter((it) => it.id !== itemId) } : s))
    );
  }

  async function saveSection(sectionKey: string) {
    const section = data.find((s) => s.key === sectionKey);
    const msg = section ? `chore(ideas): update "${section.title}"` : "chore(ideas): update ideas";
    const ok = await saveToGitHub(data, msg);
    if (ok) setEditingKey(null);
  }

  async function deleteSection(sectionKey: string) {
    if (!confirm("¿Seguro que quieres borrar este apartado y todas sus ideas?")) return;
    const section = data.find((s) => s.key === sectionKey);
    const updated = data.filter((s) => s.key !== sectionKey);
    const ok = await saveToGitHub(updated, `chore(ideas): delete section "${section?.title ?? sectionKey}"`);
    if (ok) {
      if (openKey === sectionKey) setOpenKey(null);
      if (editingKey === sectionKey) setEditingKey(null);
      showToast("Apartado eliminado");
    }
  }


  return (
    <main className="min-h-screen bg-[#FFF5BA] text-[#0C2335]">
      <div className="max-w-5xl mx-auto px-4 py-12 text-[#0C2335]">
        <h1 className="text-[80px] leading-none font-semibold break-words">Ideas</h1>

        <div className="mt-6 flex gap-2">
          <button
            onClick={addSection}
            className="rounded-md border border-[#0C2335]/30 px-3 py-1 text-sm hover:bg-[#0C2335]/5 disabled:opacity-60"
            disabled={pending}
          >
            + Añadir apartado
          </button>
          {pending && <span className="text-sm">Guardando…</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>

        {/* Lista de apartados estilo Horarios (acordeón y divisores) */}
        <ul className="mt-6 divide-y divide-[#0C2335]/10">
          {data.map((sec) => {
            const isOpen = openKey === sec.key;
            return (
              <li key={sec.key} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  {/* Left: title clickable to toggle */}
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : sec.key)}
                    className="text-left flex-1"
                  >
                    <span className="text-base font-medium truncate">{sec.title || "(Sin título)"}</span>
                  </button>

                  {/* Right: when collapsed show count; when open show action buttons */}
                  {!isOpen ? (
                    <span className="text-sm whitespace-nowrap">
                      {sec.items.length} {sec.items.length === 1 ? "idea" : "ideas"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Eliminar sección */}
                      <button
                        type="button"
                        aria-label="Eliminar apartado"
                        onClick={() => deleteSection(sec.key)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>

                      {/* Editar sección (toggle save) */}
                      <button
                        type="button"
                        aria-label="Editar apartado"
                        onClick={() => (isEditing(sec.key) ? saveSection(sec.key) : startEdit(sec.key))}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
                      >
                        {isEditing(sec.key) ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>

                      {isEditing(sec.key) && (
                        <button
                          type="button"
                          aria-label="Cancelar edición"
                          onClick={cancelEdit}
                          className="inline-flex h-7 px-2 py-1 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5 text-xs"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-2 pl-2 text-sm space-y-2">
                    {/* Contenido del apartado */}
                    <div className="space-y-3">
                      {/* Título editable */}
                      {isEditing(sec.key) ? (
                        <input
                          value={sec.title}
                          onChange={(e) => updateSectionTitle(sec.key, e.target.value)}
                          className="text-base font-semibold bg-transparent border-b border-[#0C2335] outline-none w-full"
                        />
                      ) : null}

                      {/* Lista de ideas */}
                      <ul className="divide-y divide-[#0C2335]/10">
                        {sec.items.map((it) => (
                          <li key={it.id} className="flex items-start gap-2 py-2">
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
                                  aria-label="Eliminar idea"
                                  onClick={() => removeItem(sec.key, it.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
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

                      {/* Añadir idea cuando se edita */}
                      {isEditing(sec.key) && (
                        <div>
                          <button
                            onClick={() => addItem(sec.key)}
                            className="rounded-md border border-[#0C2335]/30 px-3 py-1 text-sm hover:bg-[#0C2335]/5"
                          >
                            + Añadir idea
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Toast simple */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-full bg-[#0C2335] text-white px-4 py-2 shadow-lg">
            <span className="text-sm">{toast.text}</span>
          </div>
        </div>
      )}
    </main>
  );
}