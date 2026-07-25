"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/types/horarios";
import type { CalendarMode } from "@/lib/horarios/calendar-filter";

async function fetchCalendarToken(personaId: number) {
  const response = await fetch("/api/horarios/calendar-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || "No se pudo preparar el calendario");
  return json.token as string;
}

function buildUrls(token: string, mode: CalendarMode) {
  const modeParam = mode === "mis-turnos" ? "?modo=mis-turnos" : "";
  const httpUrl = `${window.location.origin}/calendar/${token}.ics${modeParam}`;
  const webcalUrl = httpUrl.replace(/^https?:\/\//, "webcal://");
  return { httpUrl, webcalUrl };
}

export function CalendarModal({
  personas,
  selectedPersonaId,
  open,
  onClose,
}: {
  personas: Persona[];
  selectedPersonaId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [personaId, setPersonaId] = useState(selectedPersonaId);
  const [mode, setMode] = useState<CalendarMode>("todo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPersonaId(selectedPersonaId);
      setError(null);
      setCalendarUrl(null);
    }
  }, [open, selectedPersonaId]);

  if (!open) return null;

  async function saveCalendar() {
    if (!personaId) {
      setError("Selecciona una persona.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await fetchCalendarToken(Number(personaId));
      const urls = buildUrls(token, mode);
      setCalendarUrl(urls.httpUrl);
      window.location.href = urls.webcalUrl;
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo preparar el calendario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-3 sm:items-center sm:justify-center">
      <div className="w-full rounded-lg bg-white p-4 text-[#17352C] shadow-xl sm:max-w-md">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-4xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>
            Guardar mis turnos en el calendario
          </h2>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-lg border border-[#17352C]/20 text-xl font-black">
            ×
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-black">¿Quién eres?</span>
          <select value={personaId} onChange={(event) => setPersonaId(event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 bg-white px-3 text-base">
            <option value="">Elige tu nombre</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>{persona.nombre}</option>
            ))}
          </select>
        </label>

        <fieldset className="mt-5 space-y-3">
          <legend className="text-sm font-black">¿Qué quieres guardar?</legend>
          <label className="flex items-start gap-3 rounded-lg border border-[#17352C]/15 p-3">
            <input
              type="radio"
              name="calendar-mode"
              checked={mode === "todo"}
              onChange={() => setMode("todo")}
              className="mt-1 h-5 w-5"
            />
            <span className="font-bold">Todos los actos + mis turnos</span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-[#17352C]/15 p-3">
            <input
              type="radio"
              name="calendar-mode"
              checked={mode === "mis-turnos"}
              onChange={() => setMode("mis-turnos")}
              className="mt-1 h-5 w-5"
            />
            <span className="font-bold">Solo mis turnos</span>
          </label>
        </fieldset>

        {error && <p className="mt-4 rounded-lg bg-[#FDECEC] p-3 text-sm font-bold text-[#B42318]">{error}</p>}

        <button
          type="button"
          disabled={!personaId || loading}
          onClick={saveCalendar}
          className="mt-5 h-12 w-full rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55"
        >
          {loading ? "Preparando..." : "Guardar en mi calendario"}
        </button>

        {calendarUrl && (
          <a href={calendarUrl} className="mt-3 block rounded-lg border border-[#17352C]/20 p-3 text-center text-sm font-black">
            Descargar archivo .ics
          </a>
        )}
      </div>
    </div>
  );
}
