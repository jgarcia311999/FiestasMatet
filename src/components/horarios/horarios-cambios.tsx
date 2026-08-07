"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createTurno,
  deleteTurno,
  duplicateTurno,
  fetchPersonas,
  fetchTurnos,
  updateTurno,
} from "@/lib/horarios/api";
import { compareTurnos, emptyTurnoForm, formatDiaFecha, formatHora, turnoToForm } from "@/lib/horarios/format";
import type { Persona, Turno, TurnoFormValues } from "@/types/horarios";
import { TURNO_TIPOS } from "@/types/horarios";
import { HorariosAccessPanel, useHorariosAccess } from "./horarios-access";
import { HORARIOS_QUERY_KEY, PERSONAS_QUERY_KEY } from "./use-horarios-realtime";

const EMPTY_TURNOS: Turno[] = [];

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

function TurnoEditor({
  form,
  personas,
  set,
}: {
  form: TurnoFormValues;
  personas: Persona[];
  set: <K extends keyof TurnoFormValues>(key: K, value: TurnoFormValues[K]) => void;
}) {
  return (
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
      <div className="sm:col-span-2">
        <PersonaSelect label="Apoyo 2" value={form.apoyo_2_id} personas={personas} onChange={(value) => set("apoyo_2_id", value)} />
      </div>
    </div>
  );
}

function EditableTurnoCard({ turno, personas }: { turno: Turno; personas: Persona[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<TurnoFormValues>(() => turnoToForm(turno));

  useEffect(() => {
    setForm(turnoToForm(turno));
  }, [turno]);

  const updateMutation = useMutation({
    mutationFn: () => updateTurno(turno.id, form),
    onSuccess: () => {
      setSaved(true);
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
      window.setTimeout(() => setSaved(false), 1600);
    },
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
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="rounded-lg border border-[#17352C]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black tabular-nums text-[#E84855]">{formatHora(turno)}</p>
          <h3 className="mt-1 text-2xl font-black leading-tight">{turno.acto}</h3>
        </div>
        <span className="rounded-full border border-[#17352C]/20 px-3 py-1 text-xs font-bold uppercase">{turno.tipo}</span>
      </div>

      {!editing ? (
        <>
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
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button type="button" onClick={() => setEditing(true)} className="h-12 rounded-lg bg-[#17352C] px-4 font-black text-white">
              Editar
            </button>
            <button type="button" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()} className="h-12 rounded-lg border border-[#17352C]/30 px-4 font-black disabled:opacity-55">
              {duplicateMutation.isPending ? "Duplicando..." : "Duplicar"}
            </button>
            <button type="button" disabled={deleteMutation.isPending} onClick={() => window.confirm(`¿Borrar "${turno.acto}"?`) && deleteMutation.mutate()} className="h-12 rounded-lg border border-[#B42318]/45 px-4 font-black text-[#B42318] disabled:opacity-55">
              {deleteMutation.isPending ? "Borrando..." : "Borrar"}
            </button>
            <div className="flex items-center text-sm font-bold text-[#166534]">{saved ? "Guardado" : ""}</div>
          </div>
        </>
      ) : (
        <>
          <TurnoEditor form={form} personas={personas} set={set} />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[160px_160px_1fr]">
            <button type="button" disabled={updateMutation.isPending || !form.fecha || !form.hora_inicio || !form.acto.trim()} onClick={() => updateMutation.mutate()} className="h-12 rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55">
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="h-12 rounded-lg border border-[#17352C]/25 px-4 font-black">
              Cancelar
            </button>
            {updateMutation.error && <div className="flex items-center text-sm font-bold text-[#B42318]">No se pudo guardar.</div>}
          </div>
        </>
      )}
    </article>
  );
}

function NewTurnoForm({ personas, nextOrder }: { personas: Persona[]; nextOrder: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TurnoFormValues>(() => emptyTurnoForm(nextOrder));

  useEffect(() => {
    setForm((current) => ({ ...current, orden: nextOrder }));
  }, [nextOrder]);

  const createMutation = useMutation({
    mutationFn: () => createTurno(form),
    onSuccess: () => {
      setOpen(false);
      setForm(emptyTurnoForm(nextOrder + 1, form.fecha));
      void queryClient.invalidateQueries({ queryKey: HORARIOS_QUERY_KEY });
    },
  });

  function set<K extends keyof TurnoFormValues>(key: K, value: TurnoFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="h-12 rounded-lg bg-[#FFE27A] px-4 font-black text-[#17352C]">
        Crear turno
      </button>
    );
  }

  return (
    <section className="rounded-lg border-2 border-[#17352C] bg-[#FFE27A] p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-4xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>Crear turno</h2>
        <button type="button" onClick={() => setOpen(false)} className="h-10 w-10 rounded-lg border border-[#17352C]/25 text-xl font-black">×</button>
      </div>
      <TurnoEditor form={form} personas={personas} set={set} />
      <button disabled={createMutation.isPending || !form.fecha || !form.hora_inicio || !form.acto.trim()} onClick={() => createMutation.mutate()} className="mt-4 h-12 w-full rounded-lg bg-[#17352C] px-4 font-black text-white disabled:opacity-55">
        {createMutation.isPending ? "Creando..." : "Crear turno"}
      </button>
      {createMutation.error && <p className="mt-3 text-sm font-bold text-[#B42318]">No se pudo crear el turno.</p>}
    </section>
  );
}

function CambiosContent() {
  const turnosQuery = useQuery({ queryKey: HORARIOS_QUERY_KEY, queryFn: fetchTurnos, refetchInterval: 10_000 });
  const personasQuery = useQuery({ queryKey: PERSONAS_QUERY_KEY, queryFn: fetchPersonas, refetchInterval: 30_000 });

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

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-[#17352C]">
      <section className="border-b border-[#17352C]/20 bg-[#17352C] text-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/horarios" className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">
                Volver a horarios
              </Link>
              <h1 className="mt-3 text-6xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>
                Cambios
              </h1>
            </div>
            <NewTurnoForm personas={personas} nextOrder={nextOrder} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {(turnosQuery.isLoading || personasQuery.isLoading) && <p className="rounded-lg border border-[#17352C]/15 bg-white p-4">Cargando horarios...</p>}
        {(turnosQuery.error || personasQuery.error) && <p className="rounded-lg border border-[#B42318]/30 bg-[#FDECEC] p-4 text-[#B42318]">No se pudieron cargar los horarios.</p>}

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
                  <EditableTurnoCard key={turno.id} turno={turno} personas={personas} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

export function HorariosCambios() {
  const { accessGranted, checkingAccess, grantAccess } = useHorariosAccess();

  if (checkingAccess) return <main className="min-h-screen bg-[#F7F3E8]" />;
  if (!accessGranted) return <HorariosAccessPanel onAccessGranted={grantAccess} />;

  return <CambiosContent />;
}
