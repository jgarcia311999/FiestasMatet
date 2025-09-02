"use client";

import { fiestas } from "@/data/fiestas";
import { useState, useRef } from "react";
import type { Fiesta } from "@/data/fiestas";

type LocalFiesta = Fiesta & { attendees?: string[] };
import { getCookie } from "cookies-next";

export default function HorariosPage() {
  const [items, setItems] = useState<LocalFiesta[]>(() => [...(fiestas as LocalFiesta[])]);
  // Fecha de corte: mostrar desde hace 2 días (calendario) en zona Europe/Madrid
  const TZ = "Europe/Madrid";
  function ymdInTZ(d: Date, tz: string) {
    // 'en-CA' => YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
  const twoDaysAgoYMD = ymdInTZ(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), TZ);
  // Filtramos: mostrar eventos futuros y los de hace hasta 2 días (no 48h, días naturales)
  // Luego ordenamos por fecha (YYYY-MM-DD) y hora (HH:MM), vacíos al final
  const eventosOrdenados = items
    .filter((ev) => {
      // Exigimos fecha para poder comparar; si no hay fecha, no se muestra
      if (!ev.date) return false;
      return ev.date >= twoDaysAgoYMD; // incluye hoy y futuros, y los de los últimos 2 días naturales
    })
    .sort((a, b) => {
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

  // --- Attendance logic ---
  function getCurrentUser(): string | null {
    // Cookie principal usada en el login
    const c = (getCookie("commission_user") ?? getCookie("usuario"));
    return typeof c === "string" && c.trim() ? (c as string) : null;
  }


  function toggleAttend(ev: { title?: string; date?: string; time?: string }) {
    const user = getCurrentUser();
    if (!user) {
      alert("No se pudo identificar tu usuario. Inicia sesión.");
      return { desired: null as null | boolean, key: "" };
    }
    const key = makeKey(ev);
    let desired: boolean = false;
    setItems(prev => {
      const idx = prev.findIndex(it => makeKey(it) === key);
      if (idx === -1) return prev;
      const curr = prev[idx];
      const set = new Set(curr.attendees ?? []);
      const currently = set.has(user);
      desired = !currently; // estado deseado tras el toggle
      if (currently) set.delete(user); else set.add(user);
      const next = [...prev];
      next[idx] = { ...curr, attendees: Array.from(set) } as LocalFiesta;
      return next;
    });
    return { desired, key };
  }


  function handleAttendClick(ev: { title?: string; date?: string; time?: string }) {
    const result = toggleAttend(ev);
    if (result.desired === null) return;
    const payload = { title: ev.title || "", date: ev.date || "", time: ev.time || "" };
    (async () => {
      try {
        const res = await fetch("/api/events/attend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match: payload, action: "toggle" }),
        });
        type AttendResponse = { ok?: boolean; action?: string; error?: string };
        const data: AttendResponse = await res.json().catch((): AttendResponse => ({}));
        if (!res.ok) {
          // rollback local si falla
          toggleAttend(ev);
          alert(data?.error || "No se pudo guardar la asistencia");
          return;
        }

        const userNow = getCurrentUser();
        // Sincronizamos la UI con la acción efectiva aplicada por el servidor
        if (data?.action === "add" && userNow) {
          setItems(prev => prev.map(it => {
            if (makeKey(it) !== makeKey(ev)) return it;
            const set = new Set([...(it.attendees ?? []), userNow]);
            return { ...it, attendees: Array.from(set) } as LocalFiesta;
          }));
        } else if (data?.action === "remove" && userNow) {
          setItems(prev => prev.map(it => {
            if (makeKey(it) !== makeKey(ev)) return it;
            return { ...it, attendees: (it.attendees ?? []).filter(u => u !== userNow) } as LocalFiesta;
          }));
        } else if (data?.action === "noop") {
          // El servidor no aplicó cambios: revertimos el optimista
          toggleAttend(ev);
          // (opcional) alert("No se aplicó ningún cambio");
        }
      } catch (e) {
        // rollback local por error de red
        toggleAttend(ev);
        alert("Error de red al guardar asistencia");
      }
    })();
  }

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
            const user = getCurrentUser();
            const isAttending = !!(user && asistentes.includes(user));
            return (
              <li key={makeKey(ev)} className="py-3">
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

                    {/* Action buttons: trash, pencil, check */}
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
                      <button
                        type="button"
                        aria-label="Confirmar"
                        onClick={() => handleAttendClick(ev)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${isAttending ? 'bg-green-500 text-white border-green-600' : 'border-[#0C2335]/30 hover:bg-[#0C2335]/5'}`}
                      >
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
