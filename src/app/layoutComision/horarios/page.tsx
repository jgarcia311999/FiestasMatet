"use client";

import { fiestas } from "@/data/fiestas";
import { useState, useRef } from "react";
import type { Fiesta } from "@/data/fiestas";

export default function HorariosPage() {
  const [items, setItems] = useState<Fiesta[]>(() => [...fiestas]);
  // Ordenamos por fecha (YYYY-MM-DD) y luego por hora (HH:MM); vacíos al final
  const eventosOrdenados = [...items].sort((a, b) => {
    const ad = a.date || "";
    const bd = b.date || "";
    if (ad && bd && ad !== bd) return ad.localeCompare(bd);
    if (!ad && bd) return 1;
    if (ad && !bd) return -1;
    const at = a.time || "";
    const bt = b.time || "";
    if (at && bt && at !== bt) return at.localeCompare(bt);
    if (!at && bt) return 1;
    if (at && !bt) return -1;
    return (a.title || "").localeCompare(b.title || "");
  });

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [removed, setRemoved] = useState<Record<string, true>>({});
  const makeKey = (e: { title?: string; date?: string; time?: string }) => `${e.title || ""}|${e.date || ""}|${e.time || ""}`;

  // Toast de borrado y deshacer
  const [toast, setToast] = useState<{ show: boolean; text: string; key: string | null }>({ show: false, text: "", key: null });
  const toastTimerRef = useRef<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<{ key: string; title: string; payload: { title: string; date: string; time: string } } | null>(null);

  // --- Edit Modal State ---
  const [editOpen, setEditOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<{ title: string; date: string; time: string } | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; img: string; description: string; date: string; time: string; location: string }>({
    title: "",
    img: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const prevEditRef = useRef<Fiesta | null>(null);

  function openEdit(ev: { title?: string; img?: string; description?: string; date?: string; time?: string; location?: string }) {
    const match = { title: ev.title || "", date: ev.date || "", time: ev.time || "" };
    setEditMatch(match);
    setEditForm({
      title: ev.title || "",
      img: ev.img || "",
      description: ev.description || "",
      date: ev.date || "",
      time: ev.time || "",
      location: ev.location || "",
    });
    // snapshot previo para revertir si falla
    const found = items.find(it => (it.title||"")===match.title && (it.date||"")===match.date && (it.time||"")===match.time) || null;
    prevEditRef.current = found ? { ...found } as Fiesta : null;
    setEditOpen(true);
  }

  function closeEdit() { setEditOpen(false); }

  async function saveEdit() {
    if (!editMatch) return;
    setSavingEdit(true);
    // Optimistic update: aplicar cambios en local inmediatamente
    setItems(prev => {
      const idx = prev.findIndex(it => (it.title||"")===editMatch.title && (it.date||"")===editMatch.date && (it.time||"")===editMatch.time);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...editForm } as Fiesta;
      return next;
    });
    try {
      const res = await fetch("/api/events/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match: editMatch, patch: editForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // rollback
        if (prevEditRef.current) {
          setItems(prev => {
            const idx = prev.findIndex(it => (it.title||"")===editMatch.title && (it.date||"")===editMatch.date && (it.time||"")===editMatch.time);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...prevEditRef.current! } as Fiesta;
            return next;
          });
        }
        alert(data.error || "No se pudo guardar");
        setSavingEdit(false);
        return;
      }
      setSavingEdit(false);
      setEditOpen(false);
    } catch (err) {
      // rollback
      if (prevEditRef.current) {
        setItems(prev => {
          const idx = prev.findIndex(it => (it.title||"")===editMatch.title && (it.date||"")===editMatch.date && (it.time||"")===editMatch.time);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...prevEditRef.current! } as Fiesta;
          return next;
        });
      }
      alert("Error inesperado al guardar");
      setSavingEdit(false);
    }
  }

  function showDeleteToast(title: string, key: string) {
    // Clear previous timer if any
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ show: true, text: `${title || "(Sin título)"} ha sido borrado`, key });
    // Auto-hide after 5s
    toastTimerRef.current = window.setTimeout(() => {
      setToast(t => ({ ...t, show: false }));
      toastTimerRef.current = null;
    }, 5000);
  }

  // Solo revierte el borrado localmente, no revierte el comentario de GitHub.
  function undoDelete() {
    if (!toast.key) return;
    // Cancelar borrado pendiente
    if (deleteTimerRef.current) { window.clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
    pendingRef.current = null;

    setRemoved(prev => {
      const copy = { ...prev };
      delete copy[toast.key as string];
      return copy;
    });
    if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null; }
    setToast({ show: false, text: "", key: null });
  }

  async function handleDelete(ev: { title?: string; date?: string; time?: string }) {
    if (!confirm("¿Seguro que quieres borrar este evento?")) return;

    // Limpiar timers previos si los hubiera
    if (toastTimerRef.current) { window.clearTimeout(toastTimerRef.current); toastTimerRef.current = null; }
    if (deleteTimerRef.current) { window.clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }

    const payload = { title: ev.title || "", date: ev.date || "", time: ev.time || "" };
    const key = makeKey(payload);

    // Ocultamos inmediatamente en UI y mostramos toast
    setRemoved(prev => ({ ...prev, [key]: true }));
    showDeleteToast(payload.title, key);
    setOpenIndex(null);

    // Guardamos como borrado pendiente (para poder deshacer)
    pendingRef.current = { key, title: payload.title, payload };

    // Programamos el borrado real para dentro de 5s
    deleteTimerRef.current = window.setTimeout(async () => {
      // Si ya no hay pendiente (se deshizo), no hacemos nada
      if (!pendingRef.current || pendingRef.current.key !== key) return;
      try {
        const res = await fetch("/api/events/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || "No se pudo borrar");
          // Revertimos en UI si falló el commit
          setRemoved(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
        }
      } catch (err) {
        alert("Error inesperado al borrar");
        setRemoved(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
      } finally {
        // Limpieza
        pendingRef.current = null;
        if (deleteTimerRef.current) { window.clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
      }
    }, 5000);

    // También programamos el auto-hide del toast a 5s (si no se deshace)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(t => ({ ...t, show: false }));
      toastTimerRef.current = null;
    }, 5000);
  }

  return (
    <main className="min-h-screen bg-[#E85D6A] text-[#0C2335]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-[80px] leading-none font-semibold break-words">Horarios</h1>

        {/* Listado: fecha - hora, nombre */}
        <ul className="mt-6 divide-y divide-[#0C2335]/10">
          {eventosOrdenados.filter(ev => !removed[makeKey(ev)]).map((ev, idx) => {
            const fechaHora = ev.date && ev.time
              ? `${ev.date} - ${ev.time}`
              : ev.date || ev.time || "—";
            const isOpen = openIndex === idx;
            const asistentes = (ev as { attendees?: string[] }).attendees ?? [];
            return (
              <li key={`${ev.title}-${ev.date}-${ev.time}-${idx}`} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm whitespace-nowrap">{fechaHora}</span>
                    <span className="text-base font-medium truncate">{ev.title || "(Sin título)"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-2 pl-2 text-sm space-y-2">
                    <p className="opacity-90"><span className="font-semibold">Descripción:</span> {ev.description?.trim() || "Sin descripción"}</p>
                    <p className="opacity-90"><span className="font-semibold">Lugar:</span> {ev.location?.trim() || "Sin lugar"}</p>
                    <p className="opacity-90">
                      <span className="font-semibold">Asistirá:</span>{" "}
                      {asistentes.length > 0 ? (
                        <span>{asistentes.join(", ")}</span>
                      ) : (
                        <span className="italic">de momento nadie...</span>
                      )}
                    </p>

                    {/* Action buttons: trash, pencil, check (no functionality yet) */}
                    <div className="pt-1 flex items-center gap-3 justify-end">
                      {/* Trash */}
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(ev)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>

                      {/* Pencil */}
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => openEdit(ev)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>

                      {/* Check */}
                      <button type="button" aria-label="Confirmar" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0C2335]/30 hover:bg-[#0C2335]/5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} aria-hidden="true" />
          <div className="absolute inset-0 bg-[#E85D6A] text-[#0C2335] md:rounded-t-xl md:top-12 md:h-[calc(100%-3rem)] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#0C2335]/20 bg-[#E85D6A] px-4 py-3">
              <h3 className="font-semibold text-lg">Editar evento</h3>
              <button onClick={closeEdit} className="rounded border border-[#0C2335]/30 px-2 py-1 text-sm hover:bg-[#0C2335]/5">Cerrar</button>
            </div>

            <div className="p-4">
              <form className="grid grid-cols-1 gap-3 max-w-2xl">
                <label className="text-sm">Título
                  <input
                    value={editForm.title}
                    onChange={(e)=>setEditForm({...editForm, title: e.target.value})}
                    className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">Fecha
                    <input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm, date: e.target.value})} className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]" />
                  </label>
                  <label className="text-sm">Hora
                    <input type="time" value={editForm.time} onChange={e=>setEditForm({...editForm, time: e.target.value})} className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]" />
                  </label>
                </div>

                <label className="text-sm">Lugar
                  <input value={editForm.location} onChange={e=>setEditForm({...editForm, location: e.target.value})} className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]" />
                </label>

                <label className="text-sm">Descripción
                  <textarea value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} rows={4} className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]" />
                </label>

                <label className="text-sm">Imagen (URL)
                  <input value={editForm.img} onChange={e=>setEditForm({...editForm, img: e.target.value})} className="mt-1 w-full rounded border border-[#0C2335]/30 bg-[#E85D6A] px-3 py-2 text-sm text-[#0C2335]" placeholder="/bannerGenerico.png" />
                </label>

                <div className="flex justify-end items-center gap-3 pt-2">
                  {savingEdit && <span className="text-xs opacity-80">Guardando…</span>}
                  <button type="button" onClick={closeEdit} disabled={savingEdit} className="rounded border border-[#0C2335]/30 px-3 py-2 text-sm hover:bg-[#0C2335]/5 disabled:opacity-60">Cancelar</button>
                  <button type="button" onClick={saveEdit} disabled={savingEdit} className="rounded bg-[#0C2335] text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Toast de borrado con deshacer */}
      {toast.show && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-full bg-[#0C2335] text-white px-4 py-2 shadow-lg">
            <span className="text-sm">{toast.text}</span>
            <button
              type="button"
              onClick={undoDelete}
              className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
            >
              Deshacer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/*
--- BEGIN ORIGINAL PAGE (commented out for redesign) ---
"use client";
import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
import * as FIESTAS from "@/data/fiestas";


type EventoBase = {
  title: string;
  img?: string;
  description?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  location?: string;
};

type EventoRow = { id: string } & EventoBase;

function isEventoBase(obj: unknown): obj is EventoBase {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Partial<EventoBase>;
  return typeof e.title === "string" && (
    typeof e.date === "string" || typeof e.time === "string"
  );
}

export default function HorariosPageOriginal() {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  const [eventosState, setEventosState] = useState<EventoRow[]>(() => {
    const base = readEventos();
    return base.length ? base : [{ id: "ev-1", title: "", img: "", description: "", date: "", time: "", location: "" }];
  });

  // Modal editor móvil para eventos
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const originalRef = useRef<{ title?: string; date?: string; time?: string } | null>(null);
  const selectedEvento = eventosState.find(e => e.id === selectedId) || null;
  function openEvento(id: string) {
    const ev = eventosState.find(e => e.id === id);
    if (ev) {
      originalRef.current = { title: ev.title, date: ev.date, time: ev.time };
    } else {
      originalRef.current = null;
    }
    setSelectedId(id);
  }
  function closeEvento() { setSelectedId(null); }
  function addAndOpen() {
    const id = `ev-${eventosState.length + 1}`;
    setEventosState(prev => [...prev, { id, title: "", img: "", description: "", date: "", time: "", location: "" }]);
    setSelectedId(id);
  }

  const deleteEvento = useCallback(async (ev: EventoRow) => {
    if (!confirm("¿Seguro que quieres borrar este evento?")) return;
    try {
      const res = await fetch("/api/events/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: ev.title, date: ev.date, time: ev.time }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al borrar");
        return;
      }
      setEventosState(prev => prev.filter(e => e.id !== ev.id));
      closeEvento();
    } catch (err) {
      alert("Error inesperado al borrar");
    }
  }, []);

  const saveEvento = useCallback(async () => {
    if (!selectedEvento) return;
    try {
      const match = originalRef.current ?? { title: selectedEvento.title, date: selectedEvento.date, time: selectedEvento.time };
      const patch = {
        title: selectedEvento.title,
        img: selectedEvento.img,
        description: selectedEvento.description,
        date: selectedEvento.date,
        time: selectedEvento.time,
        location: selectedEvento.location,
      };
      const res = await fetch("/api/events/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al guardar");
        return;
      }
      // Actualizamos el original a los nuevos valores y cerramos modal
      originalRef.current = { title: selectedEvento.title, date: selectedEvento.date, time: selectedEvento.time };
      closeEvento();
    } catch (err) {
      alert("Error inesperado al guardar");
    }
  }, [selectedEvento]);

  const matchesFilter = (text: string) => !q || text.toLowerCase().includes(q.toLowerCase());

  const eventos = useMemo(() => {
    const filtered = eventosState.filter(ev => {
      const inText = matchesFilter(`${ev.title} ${ev.location ?? ""} ${ev.description ?? ""}`);
      const date = ev.date ?? "";
      const inDesde = !desde || (date && date >= desde);
      const inHasta = !hasta || (date && date <= hasta);
      return inText && inDesde && inHasta;
    });

    // Orden: por fecha ascendente (YYYY-MM-DD), luego por hora ascendente (HH:MM). Vacíos al final.
    return [...filtered].sort((a, b) => {
      const ad = a.date ?? "";
      const bd = b.date ?? "";
      if (ad && bd && ad !== bd) return ad.localeCompare(bd);
      if (!ad && bd) return 1;   // a sin fecha va después
      if (ad && !bd) return -1;  // b sin fecha va después
      const at = a.time ?? "";
      const bt = b.time ?? "";
      if (at && bt && at !== bt) return at.localeCompare(bt);
      if (!at && bt) return 1;   // a sin hora va después
      if (at && !bt) return -1;  // b sin hora va después
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [q, desde, hasta, eventosState]);

  function addEmptyRow() {
    setEventosState(prev => [...prev, { id: `ev-${prev.length+1}`, title: "", img: "", description: "", date: "", time: "", location: "" }]);
  }
  function updateEvento(id: string, patch: Partial<EventoBase>) {
    setEventosState(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#E7DAD1] px-4 py-6 md:mx-0 md:rounded-lg overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-black">Horarios</h1>
          <div className="flex gap-2">
            <button className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">Exportar CSV</button>
            <button className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">Imprimir</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2 rounded border border-gray-300 bg-white p-3">
          <div className="flex flex-col">
            <label className="text-xs text-black">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="acto/puesto/responsable…"
              className="rounded border border-gray-300 px-3 py-2 text-sm text-black"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black">Desde</label>
            <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm text-black" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black">Hasta</label>
            <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm text-black" />
          </div>
          <div className="ml-auto">
            <Link
              href="/layoutComision/horarios/nuevo"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              ➕ Nuevo
            </Link>
          </div>
        </div>
        <p className="text-xs text-black mb-2">Nota: los cambios se guardan en memoria (se perderán al recargar) hasta que conectemos persistencia.</p>

        <div>
          <ul className="divide-y divide-gray-200 rounded border border-gray-300 bg-white">
            {eventos.map(ev => (
              <li key={ev.id}>
                <button
                  onClick={() => openEvento(ev.id)}
                  className="w-full text-left px-4 py-3 active:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-black">{ev.title || "(Sin título)"}</div>
                    <div className="text-sm text-black">{ev.date || "—"}{ev.time ? ` · ${ev.time}` : ""}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selectedEvento && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={closeEvento} aria-hidden="true" />
              <div className="absolute inset-0 bg-white md:rounded-t-xl md:top-12 md:h-[calc(100%-3rem)] overflow-auto">
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                  <h3 className="font-semibold">Editar evento</h3>
                  <button onClick={closeEvento} className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50">Cerrar</button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm text-black">Título
                      <input
                        value={selectedEvento.title}
                        onChange={e=>updateEvento(selectedEvento.id,{ title: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm text-black">Fecha
                        <input
                          type="date"
                          value={selectedEvento.date ?? ""}
                          onChange={e=>updateEvento(selectedEvento.id,{ date: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                        />
                      </label>
                      <label className="text-sm text-black">Hora
                        <input
                          type="time"
                          value={selectedEvento.time ?? ""}
                          onChange={e=>updateEvento(selectedEvento.id,{ time: e.target.value })}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                        />
                      </label>
                    </div>

                    <label className="text-sm text-black">Lugar
                      <input
                        value={selectedEvento.location ?? ""}
                        onChange={e=>updateEvento(selectedEvento.id,{ location: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                      />
                    </label>

                    <label className="text-sm text-black">Descripción
                      <textarea
                        value={selectedEvento.description ?? ""}
                        onChange={e=>updateEvento(selectedEvento.id,{ description: e.target.value })}
                        rows={4}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                      />
                    </label>

                    <label className="text-sm text-black">Imagen (URL)
                      <input
                        value={selectedEvento.img ?? ""}
                        onChange={e=>updateEvento(selectedEvento.id,{ img: e.target.value })}
                        placeholder="/bannerGenerico.png o URL completa"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
                      />
                    </label>
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <button
                      onClick={() => deleteEvento(selectedEvento)}
                      className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={saveEvento}
                      className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function readEventos(): EventoRow[] {
  const mod = FIESTAS as unknown as Record<string, unknown>;
  const values = Object.values(mod);
  const candidateArrays: unknown[][] = values.filter(Array.isArray) as unknown[][];

  for (const arr of candidateArrays) {
    if (arr.length === 0) continue;
    const first = arr[0];
    if (isEventoBase(first)) {
      return (arr as unknown[]).map((item, idx) => ({ id: `ev-${idx + 1}`, ...(item as EventoBase) }));
    }
  }
  return [];
}

--- END ORIGINAL PAGE ---
*/