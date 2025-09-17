"use client";

import { useState, useRef, useEffect } from "react";
import { getCookie } from "cookies-next";
import Link from "next/link";

// Tipos y helpers para leer desde la API/BD
export type EventApi = {
  id?: number | string;
  title?: string;
  img?: string;
  description?: string;
  location?: string;
  provisional?: boolean;
  attendees?: string[] | null;
  // algunos GET pueden devolver startsAt; otros, date/time ya formateados
  startsAt?: string | null;
  date?: string | null;
  time?: string | null;
};

type LocalFiesta = {
  id?: number | string;
  title?: string;
  img?: string;
  description?: string;
  location?: string;
  provisional?: boolean;
  attendees?: string[];
  date?: string; // YYYY-MM-DD en zona Europe/Madrid
  time?: string; // HH:MM en texto, ya normalizado, sin UTC
};

const TZ = "Europe/Madrid";

function toYMD(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toHM(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/^([0-9]{2}):([0-9]{2}).*$/, "$1:$2");
}

function formatHHMMMadrid(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function fromApi(ev: EventApi): LocalFiesta {
  // Si ya vienen date/time, las usamos; si no, derivamos de startsAt SIN aplicar zonas
  let date = ev.date ?? undefined;
  let time = ev.time ?? undefined;
  if ((!date || !time) && ev.startsAt) {
    const s = String(ev.startsAt).trim();
    // Intenta extraer YYYY-MM-DD y HH:MM de forma textual (soporta " ", "T" y sufijos Z/±HH:MM)
    const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?$/);
    if (m) {
      date = date ?? m[1];
      time = time ?? m[2];
    } else {
      // Fallback: si no coincide el patrón, intenta parsear como Date y formatear en zona Madrid
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        date = date ?? toYMD(d, TZ);
        time = time ?? toHM(d, TZ);
      }
    }
  }
  return {
    id: ev.id,
    title: ev.title ?? "",
    img: ev.img ?? "",
    description: ev.description ?? "",
    location: ev.location ?? "",
    provisional: ev.provisional ?? false,
    attendees: Array.isArray(ev.attendees) ? (ev.attendees as string[]) : [],
    date,
    time,
  };
}

export default function HorariosPage() {
  const [items, setItems] = useState<LocalFiesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Aviso post-guardado: lectura ligera de query param sin hooks de Next
  const [savingNotice, setSavingNotice] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("justSaved")) {
      setSavingNotice(true);
      // Limpia la query de la URL sin recargar la página
      const url = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", url);
      // Oculta el aviso tras 3s
      const t = window.setTimeout(() => setSavingNotice(false), 3000);
      return () => window.clearTimeout(t);
    }
  }, []);
  // Fecha de corte: mostrar desde hace 2 días (calendario) en zona Europe/Madrid
  function ymdInTZ(d: Date, tz: string) { return toYMD(d, tz); }
  const twoDaysAgoYMD = ymdInTZ(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), TZ);
  // --- Cargar datos desde la API ---
  async function fetchEvents() {
    try {
      setError(null);
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No se pudieron cargar los eventos");
      }
      const data = await res.json();
      const list: EventApi[] = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
      setItems(list.map(fromApi));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);
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

  // --- Selección múltiple para borrar ---
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function toggleSelect(key: string) {
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function clearSelection() {
    setSelected({});
  }

  // --- Borrado múltiple (secuencial para evitar conflictos de escritura) ---
  async function handleBulkDelete() {
    if (selectedCount === 0 || bulkDeleting) return;
    if (!confirm(`¿Borrar ${selectedCount} evento(s)?`)) return;

    setBulkDeleting(true);

    const keys = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

    // Optimista: ocultar todos en UI
    setRemoved(prev => {
      const copy = { ...prev };
      for (const k of keys) copy[k] = true;
      return copy;
    });

    // Construimos payloads con los items actuales (clave basada en title|date|time)
    const payloads = items
      .map(it => ({ title: it.title || "", date: it.date || "", time: it.time || "" }))
      .filter(p => keys.includes(`${p.title}|${p.date}|${p.time}`));

    const failed: { key: string; title: string }[] = [];

    // Ejecutar en serie para evitar colisiones en la edición del fichero remoto/DB
    for (const p of payloads) {
      const key = `${p.title}|${p.date}|${p.time}`;
      try {
        const res = await fetch("/api/events/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        if (!res.ok) {
          failed.push({ key, title: p.title });
        }
      } catch {
        failed.push({ key, title: p.title });
      }
    }

    if (failed.length) {
      // Revertimos los que no se pudieron borrar
      setRemoved(prev => {
        const copy = { ...prev };
        for (const f of failed) delete copy[f.key];
        return copy;
      });
      const okCount = selectedCount - failed.length;
      const names = failed.map(f => f.title || "(Sin título)").slice(0, 3).join(", ");
      const extra = failed.length > 3 ? ` y ${failed.length - 3} más` : "";
      setToast({ show: true, text: `Se borraron ${okCount} y fallaron ${failed.length}${names ? `: ${names}` : ""}${extra}`, key: null });
    } else {
      setToast({ show: true, text: `Se borraron ${selectedCount} evento(s)`, key: null });
    }

    // Salir de modo selección y limpiar
    setSelectMode(false);
    clearSelection();
    setBulkDeleting(false);
    await fetchEvents();
  }

  // Toast de borrado y deshacer
  const [toast, setToast] = useState<{ show: boolean; text: string; key: string | null }>({ show: false, text: "", key: null });
  const toastTimerRef = useRef<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<{ key: string; title: string; payload: { title: string; date: string; time: string } } | null>(null);

  // --- Edit Modal State ---
  const [editOpen, setEditOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<{ title: string; date: string; time: string } | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; img: string; description: string; date: string; time: string; location: string; provisional: boolean }>({
  title: "",
  img: "",
  description: "",
  date: "",
  time: "",
  location: "",
  provisional: false,
});
  const [savingEdit, setSavingEdit] = useState(false);
  const prevEditRef = useRef<LocalFiesta | null>(null);

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
          body: JSON.stringify({
            match: payload,
            // Preferir id si viene de la API para evitar fallos de coincidencia
            id: (ev as { id?: number | string }).id ?? null,
            // Enviar también la marca exacta como está en la BBDD (timestamp sin zona con segundos)
            startsAt: payload.date && payload.time ? `${payload.date} ${payload.time}:00` : null,
            action: "toggle",
          }),
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
        // Asegura estado fuente de verdad tras toggle de asistencia
        await fetchEvents();
      } catch (e) {
        // rollback local por error de red
        toggleAttend(ev);
        alert("Error de red al guardar asistencia");
      }
    })();
  }

  function openEdit(ev: { title?: string; img?: string; description?: string; date?: string; time?: string; location?: string; provisional?: boolean }) {
    const match = { title: ev.title || "", date: ev.date || "", time: ev.time || "" };
    setEditMatch(match);
    setEditForm({
  title: ev.title || "",
  img: ev.img || "",
  description: ev.description || "",
  date: ev.date || "",
  time: ev.time || "",
  location: ev.location || "",
  provisional: ev.provisional ?? false,
});
    // snapshot previo para revertir si falla
    const found = items.find(it => (it.title||"")===match.title && (it.date||"")===match.date && (it.time||"")===match.time) || null;
    prevEditRef.current = found ? { ...found } as LocalFiesta : null;
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
      next[idx] = { ...next[idx], ...editForm } as LocalFiesta;
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
            next[idx] = { ...prevEditRef.current! } as LocalFiesta;
            return next;
          });
        }
        alert(data.error || "No se pudo guardar");
        setSavingEdit(false);
        return;
      }
// Sincroniza desde la BD para evitar estados viejos y claves desfasadas
await fetchEvents();
setSavingEdit(false);
setEditOpen(false);
setEditMatch(null);
prevEditRef.current = null;    
} catch (err) {
      // rollback
      if (prevEditRef.current) {
        setItems(prev => {
          const idx = prev.findIndex(it => (it.title||"")===editMatch.title && (it.date||"")===editMatch.date && (it.time||"")===editMatch.time);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...prevEditRef.current! } as LocalFiesta;
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
} else {
  // Refrescar lista tras borrar en servidor
  await fetchEvents();
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
        {savingNotice && (
          <div className="mb-4 rounded-lg border border-[#0C2335]/20 bg-white/80 px-4 py-2 text-sm text-[#0C2335]">
            Evento creado
          </div>
        )}
        <h1 className="text-[80px] leading-none font-semibold break-words">Horarios</h1>

        {loading && (
          <div className="mt-4 rounded-lg border border-[#0C2335]/20 bg-white/80 px-4 py-2 text-sm text-[#0C2335]">Cargando eventos…</div>
        )}
        {!loading && error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-white/80 px-4 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          {!selectMode ? (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="rounded border border-[#0C2335]/30 px-3 py-1.5 text-sm hover:bg-[#0C2335]/5"
            >
              Seleccionar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setSelectMode(false); clearSelection(); }}
                className="rounded border border-[#0C2335]/30 px-3 py-1.5 text-sm hover:bg-[#0C2335]/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || bulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 rounded bg-[#0C2335] text-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {bulkDeleting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4"/>
                  </svg>
                )}
                Eliminar seleccionados ({selectedCount})
              </button>
            </>
          )}
        </div>

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
                <div className="flex items-start gap-2">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={!!selected[makeKey(ev)]}
                      onChange={() => toggleSelect(makeKey(ev))}
                      className="mt-1 h-4 w-4 accent-[#0C2335]"
                      aria-label="Seleccionar evento"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm whitespace-nowrap">{fechaHora}</span>
                      <span className="text-base font-medium truncate">{ev.title || "(Sin título)"}</span>
                    </div>
                  </button>
                </div>
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
                    {!selectMode && (
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
                    )}
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

                <div className="flex items-center gap-2">
  <input
    id="edit-provisional"
    type="checkbox"
    checked={!!editForm.provisional}
    onChange={(e)=>setEditForm({...editForm, provisional: e.target.checked})}
    className="h-4 w-4 border"
  />
  <label htmlFor="edit-provisional" className="text-sm font-semibold">Provisional</label>
</div>

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
      
    {/* Floating add button */}
    <Link
      href="/layoutComision/horarios/nuevo"
      aria-label="Añadir nuevo horario"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#0C2335] text-white shadow-lg flex items-center justify-center hover:opacity-90"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Link>
    </main>
  );
}
