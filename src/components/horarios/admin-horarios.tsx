"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createPersona, createTurno, deleteTurno, duplicateTurno, fetchPersonas, fetchTurnos, updatePersona, updateTurno, updateTurnosOrden } from "@/lib/horarios/api";
import { compareTurnos, emptyTurnoForm, formatDiaFecha, turnoToForm } from "@/lib/horarios/format";
import type { Persona, Turno, TurnoFormValues } from "@/types/horarios";
import { TURNO_TIPOS } from "@/types/horarios";
import { HORARIOS_QUERY_KEY, PERSONAS_QUERY_KEY } from "./use-horarios-realtime";

const EMPTY_TURNOS: Turno[] = [];

type SaveState = "idle" | "saving" | "saved" | "error";

function PersonaSelect({
  label,
  value,
  personas,
  onChange,
}: {
  label: string;
  value: string;
  personas: Persona[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 bg-white px-3 text-base">
        <option value="">Sin asignar</option>
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>{persona.nombre}</option>
        ))}
      </select>
    </label>
  );
}

function TurnoCard({
  turno,
  personas,
  onMove,
}: {
  turno: Turno;
  personas: Persona[];
  onMove: (turno: Turno, direction: "up" | "down") => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TurnoFormValues>(() => turnoToForm(turno));
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    setForm(turnoToForm(turno));
  }, [turno]);

  const saveMutation = useMutation({
    mutationFn: () => updateTurno(turno.id, form),
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
      window.setTimeout(() => setSaveState("idle"), 1800);
    },
    onError: () => setSaveState("error"),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateTurno(turno),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTurno(turno.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY }),
  });

  function set<K extends keyof TurnoFormValues>(key: K, value: TurnoFormValues[K]) {
    setSaveState("idle");
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="rounded-lg border border-[#17352C]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#E84855]">{formatDiaFecha(turno)}</p>
          <h3 className="mt-1 text-3xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>{form.acto || "Turno sin acto"}</h3>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMove(turno, "up")} className="h-10 w-10 rounded-lg border border-[#17352C]/25 font-black">↑</button>
          <button type="button" onClick={() => onMove(turno, "down")} className="h-10 w-10 rounded-lg border border-[#17352C]/25 font-black">↓</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Fecha</span>
          <input type="date" value={form.fecha} onChange={(event) => set("fecha", event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-base" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Dia</span>
          <input value={form.dia} onChange={(event) => set("dia", event.target.value)} placeholder="Viernes 14" className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-base" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Inicio</span>
          <input type="time" value={form.hora_inicio} onChange={(event) => set("hora_inicio", event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-base" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Fin calculado</span>
          <input type="time" value={form.hora_fin} readOnly className="h-12 w-full rounded-lg border border-[#17352C]/15 bg-[#F7F3E8] px-3 text-base text-[#17352C]/70" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Acto</span>
          <input value={form.acto} onChange={(event) => set("acto", event.target.value)} className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-base" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Tipo</span>
          <select value={form.tipo} onChange={(event) => set("tipo", event.target.value as TurnoFormValues["tipo"])} className="h-12 w-full rounded-lg border border-[#17352C]/25 bg-white px-3 text-base">
            {TURNO_TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-[#17352C]/60">Orden</span>
          <input type="number" value={form.orden} onChange={(event) => set("orden", Number(event.target.value))} className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-base" />
        </label>
        <PersonaSelect label="Persona 1" value={form.persona_1_id} personas={personas} onChange={(value) => set("persona_1_id", value)} />
        <PersonaSelect label="Persona 2" value={form.persona_2_id} personas={personas} onChange={(value) => set("persona_2_id", value)} />
        <div className="sm:col-span-2">
          <PersonaSelect label="Apoyo" value={form.apoyo_id} personas={personas} onChange={(value) => set("apoyo_id", value)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" disabled={saveMutation.isPending || !form.fecha || !form.hora_inicio || !form.acto.trim()} onClick={() => saveMutation.mutate()} className="h-12 rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55">
          {saveState === "saving" ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()} className="h-12 rounded-lg border border-[#17352C]/30 px-4 font-black">
          {duplicateMutation.isPending ? "Duplicando..." : "Duplicar"}
        </button>
        <button type="button" disabled={deleteMutation.isPending} onClick={() => window.confirm(`¿Borrar "${turno.acto}"?`) && deleteMutation.mutate()} className="h-12 rounded-lg border border-[#B42318]/45 px-4 font-black text-[#B42318]">
          {deleteMutation.isPending ? "Borrando..." : "Borrar"}
        </button>
        <div className="flex items-center justify-center rounded-lg bg-[#F7F3E8] px-3 text-center text-sm font-bold">
          {saveState === "saved" && "Cambios guardados"}
          {saveState === "error" && "Error al guardar"}
          {saveState === "idle" && " "}
          {saveState === "saving" && "Guardando..."}
        </div>
      </div>
    </article>
  );
}

function NewTurnoCard({ nextOrder, personas }: { nextOrder: number; personas: Persona[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TurnoFormValues>(() => emptyTurnoForm(nextOrder));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm((current) => ({ ...current, orden: nextOrder }));
  }, [nextOrder]);

  const mutation = useMutation({
    mutationFn: () => createTurno(form),
    onSuccess: () => {
      setSaved(true);
      setForm(emptyTurnoForm(nextOrder + 1, form.fecha));
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
      window.setTimeout(() => setSaved(false), 1800);
    },
  });

  function set<K extends keyof TurnoFormValues>(key: K, value: TurnoFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="rounded-lg border-2 border-[#17352C] bg-[#FFE27A] p-4">
      <h2 className="text-4xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>Crear turno</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="date" value={form.fecha} onChange={(event) => set("fecha", event.target.value)} className="h-12 rounded-lg border border-[#17352C]/25 px-3" />
        <input value={form.dia} onChange={(event) => set("dia", event.target.value)} placeholder="Dia visible" className="h-12 rounded-lg border border-[#17352C]/25 px-3" />
        <input type="time" value={form.hora_inicio} onChange={(event) => set("hora_inicio", event.target.value)} className="h-12 rounded-lg border border-[#17352C]/25 px-3" />
        <input value={form.acto} onChange={(event) => set("acto", event.target.value)} placeholder="Acto" className="h-12 rounded-lg border border-[#17352C]/25 px-3 sm:col-span-2" />
        <select value={form.tipo} onChange={(event) => set("tipo", event.target.value as TurnoFormValues["tipo"])} className="h-12 rounded-lg border border-[#17352C]/25 bg-white px-3">
          {TURNO_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
        <input type="number" value={form.orden} onChange={(event) => set("orden", Number(event.target.value))} className="h-12 rounded-lg border border-[#17352C]/25 px-3" />
        <PersonaSelect label="Persona 1" value={form.persona_1_id} personas={personas} onChange={(value) => set("persona_1_id", value)} />
        <PersonaSelect label="Persona 2" value={form.persona_2_id} personas={personas} onChange={(value) => set("persona_2_id", value)} />
        <div className="sm:col-span-2">
          <PersonaSelect label="Apoyo" value={form.apoyo_id} personas={personas} onChange={(value) => set("apoyo_id", value)} />
        </div>
      </div>
      <button disabled={mutation.isPending || !form.fecha || !form.hora_inicio || !form.acto.trim()} onClick={() => mutation.mutate()} className="mt-4 h-12 w-full rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55">
        {mutation.isPending ? "Guardando..." : "Crear turno"}
      </button>
      {saved && <p className="mt-3 rounded-lg bg-white/75 p-3 text-sm font-bold text-[#166534]">Cambios guardados</p>}
      {mutation.error && <p className="mt-3 rounded-lg bg-[#FDECEC] p-3 text-sm font-bold text-[#B42318]">No se pudo crear el turno.</p>}
    </section>
  );
}

function PersonasManager({ personas }: { personas: Persona[] }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createPersona(nombre.trim(), personas.length + 1),
    onSuccess: () => {
      setNombre("");
      void queryClient.invalidateQueries({ queryKey: PERSONAS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Pick<Persona, "nombre" | "activo" | "orden">> }) =>
      updatePersona(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PERSONAS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
    },
  });

  return (
    <section className="mt-5 rounded-lg border border-[#17352C]/15 bg-white p-4 shadow-sm">
      <h2 className="text-3xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>Personas</h2>
      <div className="mt-3 flex gap-2">
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Nuevo nombre"
          className="h-12 min-w-0 flex-1 rounded-lg border border-[#17352C]/25 px-3 text-base"
        />
        <button
          type="button"
          disabled={!nombre.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="h-12 rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55"
        >
          Añadir
        </button>
      </div>
      <div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1">
        {personas.map((persona) => (
          <div key={persona.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-[#17352C]/10 p-2">
            <input
              defaultValue={persona.nombre}
              onBlur={(event) => {
                const next = event.target.value.trim();
                if (next && next !== persona.nombre) updateMutation.mutate({ id: persona.id, patch: { nombre: next } });
              }}
              className="h-10 min-w-0 rounded-md border border-[#17352C]/15 px-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={persona.activo}
                onChange={(event) => updateMutation.mutate({ id: persona.id, patch: { activo: event.target.checked } })}
                className="h-5 w-5"
              />
              Activa
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminHorarios() {
  const queryClient = useQueryClient();

  const turnosQuery = useQuery({ queryKey: HORARIOS_QUERY_KEY, queryFn: fetchTurnos, refetchInterval: 10_000 });
  const personasQuery = useQuery({ queryKey: PERSONAS_QUERY_KEY, queryFn: fetchPersonas, refetchInterval: 30_000 });

  const reorderMutation = useMutation({
    mutationFn: updateTurnosOrden,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY }),
  });

  const turnos = turnosQuery.data ?? EMPTY_TURNOS;
  const personas = (personasQuery.data ?? []).filter((persona) => persona.activo);
  const nextOrder = (turnos.reduce((max, turno) => Math.max(max, turno.orden), 0) || 0) + 1;

  const grouped = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const turno of turnos) map.set(turno.fecha, [...(map.get(turno.fecha) ?? []), turno]);
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items: items.sort(compareTurnos) }));
  }, [turnos]);

  function moveTurno(turno: Turno, direction: "up" | "down") {
    const dayTurnos = turnos.filter((item) => item.fecha === turno.fecha).sort(compareTurnos);
    const index = dayTurnos.findIndex((item) => item.id === turno.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const swap = dayTurnos[swapIndex];
    if (!swap) return;
    reorderMutation.mutate([
      { id: turno.id, orden: swap.orden },
      { id: swap.id, orden: turno.orden },
    ]);
  }

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-[#17352C]">
      <section className="border-b border-[#17352C]/20 bg-[#17352C] text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/65">Panel privado</p>
              <h1 className="mt-2 text-6xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>Horarios</h1>
            </div>
            <a href="/api/logout" className="flex h-12 items-center rounded-lg border border-white/45 px-4 font-black">Cerrar sesion</a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <NewTurnoCard nextOrder={nextOrder} personas={personas} />
          <PersonasManager personas={personasQuery.data ?? []} />
        </div>

        <div className="space-y-7">
          {(turnosQuery.isLoading || personasQuery.isLoading) && <p className="rounded-lg border border-[#17352C]/15 bg-white p-4">Cargando turnos...</p>}
          {(turnosQuery.error || personasQuery.error) && <p className="rounded-lg border border-[#B42318]/30 bg-[#FDECEC] p-4 text-[#B42318]">No se pudieron cargar los datos.</p>}
          {reorderMutation.isPending && <p className="rounded-lg bg-white p-3 text-sm font-bold">Guardando nuevo orden...</p>}

          {grouped.map((group) => (
            <section key={group.date} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-4xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>{formatDiaFecha(group.items[0])}</h2>
                <span className="text-sm text-[#17352C]/60">{group.items.length} turno(s)</span>
              </div>
              {group.items.map((turno) => (
                <TurnoCard key={turno.id} turno={turno} personas={personas} onMove={moveTurno} />
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
