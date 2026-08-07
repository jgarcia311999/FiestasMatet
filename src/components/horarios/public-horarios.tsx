"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPersonas, fetchTurnos } from "@/lib/horarios/api";
import { compareTurnos, formatDiaFecha, formatHora } from "@/lib/horarios/format";
import type { Turno } from "@/types/horarios";
import { HORARIOS_QUERY_KEY, PERSONAS_QUERY_KEY } from "./use-horarios-realtime";
import { CalendarModal } from "./calendar-modal";
import { HorariosAccessPanel, useHorariosAccess } from "./horarios-access";

const EMPTY_TURNOS: Turno[] = [];

function includesPersona(turno: Turno, personaId: string) {
  return [turno.persona_1_id, turno.persona_2_id, turno.apoyo_id, turno.apoyo_2_id].includes(Number(personaId));
}

export function PublicHorarios() {
  const { accessGranted, checkingAccess, grantAccess } = useHorariosAccess();

  if (checkingAccess) {
    return <main className="min-h-screen bg-[#F7F3E8]" />;
  }

  if (!accessGranted) {
    return <HorariosAccessPanel onAccessGranted={grantAccess} />;
  }

  return <PublicHorariosContent />;
}

function PublicHorariosContent() {
  const [personaId, setPersonaId] = useState("");
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const turnosQuery = useQuery({ queryKey: HORARIOS_QUERY_KEY, queryFn: fetchTurnos, refetchInterval: 10_000 });
  const personasQuery = useQuery({ queryKey: PERSONAS_QUERY_KEY, queryFn: fetchPersonas, refetchInterval: 30_000 });

  const turnos = turnosQuery.data ?? EMPTY_TURNOS;
  const personas = (personasQuery.data ?? []).filter((persona) => persona.activo);

  const filteredTurnos = useMemo(() => {
    return turnos
      .filter((turno) => {
        if (personaId && !includesPersona(turno, personaId)) return false;
        return true;
      })
      .sort(compareTurnos);
  }, [personaId, turnos]);

  const grouped = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const turno of filteredTurnos) {
      const key = turno.fecha;
      map.set(key, [...(map.get(key) ?? []), turno]);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items: items.sort(compareTurnos) }));
  }, [filteredTurnos]);

  const isLoading = turnosQuery.isLoading || personasQuery.isLoading;
  const error = turnosQuery.error || personasQuery.error;

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-[#17352C]">
      <section className="border-b border-[#17352C]/20 bg-[#E84855] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/75">Comision de fiestas</p>
          <h1 className="mt-3 text-6xl uppercase leading-none sm:text-7xl" style={{ fontFamily: "var(--font-bebas-neue)" }}>
            Horarios
          </h1>
        </div>
      </section>

      <section className="sticky top-0 z-10 border-b border-[#17352C]/15 bg-[#F7F3E8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:px-6">
          <label className="block w-full max-w-md">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#17352C]/65">Persona</span>
            <select value={personaId} onChange={(event) => setPersonaId(event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 bg-white px-3 text-base">
              <option value="">Todas</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>{persona.nombre}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!personaId}
            onClick={() => setCalendarModalOpen(true)}
            className="h-12 rounded-lg bg-[#17352C] px-4 text-sm font-black text-white disabled:opacity-45 sm:mb-0"
          >
            Guardar mis turnos en el calendario
          </button>
        </div>
      </section>

      <CalendarModal
        personas={personas}
        selectedPersonaId={personaId}
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
      />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {isLoading && <p className="rounded-lg border border-[#17352C]/15 bg-white p-4">Cargando horarios...</p>}
        {error && <p className="rounded-lg border border-[#B42318]/30 bg-[#FDECEC] p-4 text-[#B42318]">No se pudieron cargar los horarios.</p>}
        {!isLoading && !error && grouped.length === 0 && (
          <p className="rounded-lg border border-[#17352C]/15 bg-white p-4">No hay turnos con esos filtros.</p>
        )}

        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.date}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="text-4xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>
                  {formatDiaFecha(group.items[0])}
                </h2>
                <span className="text-sm text-[#17352C]/60">{group.items.length} turno(s)</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map((turno) => (
                  <article key={turno.id} className="rounded-lg border border-[#17352C]/15 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-black tabular-nums text-[#E84855]">{formatHora(turno)}</p>
                        <h3 className="mt-1 text-2xl font-black leading-tight">{turno.acto}</h3>
                      </div>
                      <span className="rounded-full border border-[#17352C]/20 px-3 py-1 text-xs font-bold uppercase">{turno.tipo}</span>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm">
                      <div className="flex justify-between gap-3 border-t border-[#17352C]/10 pt-2">
                        <dt className="font-bold text-[#17352C]/60">Persona 1</dt>
                        <dd className="text-right">{turno.persona_1?.nombre ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-[#17352C]/10 pt-2">
                        <dt className="font-bold text-[#17352C]/60">Persona 2</dt>
                        <dd className="text-right">{turno.persona_2?.nombre ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-[#17352C]/10 pt-2">
                        <dt className="font-bold text-[#17352C]/60">Apoyo</dt>
                        <dd className="text-right">{turno.apoyo?.nombre ?? "-"}</dd>
                      </div>
                      {turno.apoyo_2 && (
                        <div className="flex justify-between gap-3 border-t border-[#17352C]/10 pt-2">
                          <dt className="font-bold text-[#17352C]/60">Apoyo 2</dt>
                          <dd className="text-right">{turno.apoyo_2.nombre}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
