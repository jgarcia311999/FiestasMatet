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

export default function HorariosPage() {
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

        {/* Filtros */}
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
          {/* Listado móvil: solo fecha y título */}
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

          {/* Modal de edición móvil (full-screen) */}
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