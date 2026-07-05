"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EventApi = {
  id?: number | string;
  title?: string;
  calendarTitle?: string;
  location?: string;
  visible?: boolean;
  provisional?: boolean;
  attendees?: string[] | null;
  startsAt?: string | null;
  date?: string | null;
  time?: string | null;
  tags?: string[];
};

type EventForm = {
  title: string;
  calendarTitle: string;
  date: string;
  time: string;
  location: string;
  provisional: boolean;
  tags: string[];
};

type LocalEvent = {
  id?: number | string;
  title: string;
  calendarTitle: string;
  location: string;
  visible: boolean;
  provisional: boolean;
  date: string;
  time: string;
  tags: string[];
};

type EventGroup = {
  date: string;
  label: string;
  items: LocalEvent[];
};

const TZ = "Europe/Madrid";
const TAG_OPTIONS = ["noche", "familia", "todos los publicos", "comida/cena", "toros"];
const EMPTY_FORM: EventForm = {
  title: "",
  calendarTitle: "",
  date: "",
  time: "",
  location: "",
  provisional: false,
  tags: [],
};

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

function toDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const label = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function compareEventsAsc(a: LocalEvent, b: LocalEvent) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  if (a.time !== b.time) return a.time.localeCompare(b.time);
  return a.title.localeCompare(b.title);
}

function compareEventsDesc(a: LocalEvent, b: LocalEvent) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  if (a.time !== b.time) return b.time.localeCompare(a.time);
  return a.title.localeCompare(b.title);
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function fromApi(event: EventApi): LocalEvent | null {
  let date = event.date ?? "";
  let time = event.time ?? "";

  if ((!date || !time) && event.startsAt) {
    const raw = String(event.startsAt).trim();
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?$/);
    if (match) {
      date = date || match[1];
      time = time || match[2];
    } else {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        date = date || toYMD(parsed, TZ);
        time = time || toHM(parsed, TZ);
      }
    }
  }

  if (!date || !time) return null;

  return {
    id: event.id,
    title: event.title?.trim() || "Sin titulo",
    calendarTitle: event.calendarTitle?.trim() || "",
    location: event.location?.trim() || "",
    visible: !!event.visible,
    provisional: !!event.provisional,
    date,
    time,
    tags: Array.isArray(event.tags) ? event.tags.map(normalizeTag) : [],
  };
}

function groupEvents(events: LocalEvent[], todayKey: string) {
  const past = events.filter((event) => event.date < todayKey).sort(compareEventsDesc);
  const today = events.filter((event) => event.date === todayKey).sort(compareEventsAsc);
  const future = events.filter((event) => event.date > todayKey).sort(compareEventsAsc);

  const toGroups = (rows: LocalEvent[], descending: boolean): EventGroup[] => {
    const order = descending ? [...rows] : [...rows];
    const map = new Map<string, LocalEvent[]>();
    for (const row of order) {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date)?.push(row);
    }

    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      label: toDisplayDate(date),
      items: descending ? items.sort(compareEventsAsc) : items.sort(compareEventsAsc),
    }));
  };

  return {
    previous: toGroups(past, true),
    today: toGroups(today, false),
    next: toGroups(future, false),
  };
}

export default function HorariosPage() {
  const [items, setItems] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const todayRef = useRef<HTMLDivElement | null>(null);
  const didAutoFocusToday = useRef(false);

  const todayKey = useMemo(() => toYMD(new Date(), TZ), []);

  async function fetchEvents() {
    try {
      setError(null);
      const response = await fetch("/api/events?includeHidden=1", { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "No se pudieron cargar los eventos");
      }

      const rows: EventApi[] = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];
      const normalized = rows.map(fromApi).filter((event): event is LocalEvent => event !== null);
      setItems(normalized);
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (filterDate) return;
    if (didAutoFocusToday.current) return;
    if (!todayRef.current) return;

    todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    didAutoFocusToday.current = true;
  }, [filterDate, items]);

  const visibleItems = useMemo(() => {
    if (!filterDate) return items;
    return items.filter((event) => event.date === filterDate).sort(compareEventsAsc);
  }, [filterDate, items]);
  const allEventsVisible = items.length > 0 && items.every((event) => event.visible);

  const grouped = useMemo(() => groupEvents(visibleItems, todayKey), [todayKey, visibleItems]);
  const filteredGroups = useMemo(() => {
    if (!filterDate) return [];
    return groupEvents(visibleItems, filterDate).today;
  }, [filterDate, visibleItems]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditorOpen(false);
  }

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      date: filterDate || todayKey,
    });
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEdit(event: LocalEvent) {
    setForm({
      title: event.title,
      calendarTitle: event.calendarTitle,
      date: event.date,
      time: event.time,
      location: event.location,
      provisional: event.provisional,
      tags: event.tags,
    });
    setEditingId(event.id ?? null);
    setEditorOpen(true);
  }

  function updateForm<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleTag(tag: string) {
    setForm((current) => {
      const exists = current.tags.includes(tag);
      return {
        ...current,
        tags: exists ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      calendarTitle: form.calendarTitle.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      provisional: form.provisional,
      tags: form.tags,
    };

    try {
      const response = await fetch(editingId == null ? "/api/events/new" : "/api/events/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId == null
            ? payload
            : {
                match: { id: editingId },
                patch: payload,
              }
        ),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "No se pudieron guardar los cambios");
      }

      await fetchEvents();
      resetForm();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: LocalEvent) {
    if (!event.id) return;
    if (!window.confirm(`¿Borrar "${event.title}"?`)) return;

    setDeletingId(event.id);
    setError(null);
    try {
      const response = await fetch("/api/events/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "No se pudo borrar el evento");
      }

      await fetchEvents();
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar el evento");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleAllVisibility() {
    const nextVisible = !allEventsVisible;
    setTogglingVisibility(true);
    setError(null);
    try {
      const response = await fetch("/api/events/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "No se pudo actualizar la visibilidad");
      }
      await fetchEvents();
    } catch (toggleError: unknown) {
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo actualizar la visibilidad");
    } finally {
      setTogglingVisibility(false);
    }
  }

  function renderEventCard(event: LocalEvent) {
    return (
      <article
        key={`${event.id ?? `${event.date}-${event.time}-${event.title}`}`}
        className="border-t border-[#1B4332]/18 py-5 first:border-t-0"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#1B4332]/55">{event.time}</p>
            <h3
              className="mt-2 text-3xl uppercase leading-none text-[#1B4332]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              {event.title}
            </h3>
          </div>
          {event.provisional && (
            <span className="rounded-full border border-[#A61F24] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#A61F24]">
              Provisional
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 text-sm text-[#1B4332]/80 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#1B4332]/45">Lugar</p>
            <p className="mt-1">{event.location || "Sin lugar indicado"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#1B4332]/45">Titulo calendario</p>
            <p className="mt-1">{event.calendarTitle || "Usa el titulo completo"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#1B4332]/45">Etiquetas</p>
            <p className="mt-1">{event.tags.length > 0 ? event.tags.join(", ") : "Sin etiquetas"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#1B4332]/45">Visibilidad</p>
            <p className="mt-1">{event.visible ? "Visible" : "Oculto"}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEdit(event)}
            className="rounded-full border border-[#1B4332] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#1B4332] transition hover:bg-[#1B4332] hover:text-[#F0EAD6]"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(event)}
            disabled={deletingId === event.id}
            className="rounded-full border border-[#A61F24] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#A61F24] transition hover:bg-[#A61F24] hover:text-white disabled:opacity-50"
          >
            {deletingId === event.id ? "Borrando..." : "Borrar"}
          </button>
        </div>
      </article>
    );
  }

  function renderGroup(title: string, accent: string, groups: EventGroup[], ref?: React.RefObject<HTMLDivElement | null>) {
    if (groups.length === 0) return null;

    return (
      <section ref={ref} className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#1B4332]/20" />
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#1B4332]/55">{title}</p>
          <span className="h-px flex-1 bg-[#1B4332]/20" />
        </div>

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.date} className="px-1 py-2" style={{ ["--group-bg" as string]: accent }}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  className="text-4xl uppercase leading-none text-[#1B4332]"
                  style={{ fontFamily: "var(--font-bebas-neue)" }}
                >
                  {group.label}
                </h2>
                <p className="text-sm text-[#1B4332]/65">{group.items.length} evento(s)</p>
              </div>

              <div className="mt-5">
                {group.items.map(renderEventCard)}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0EAD6] text-[#1B4332]">
      <section className="border-b-2 border-[#1B4332]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.42em] text-[#1B4332]/45">Comision de fiestas</p>
              <h1
                className="mt-3 text-[4.5rem] uppercase leading-[0.84] text-[#1B4332] sm:text-[6.5rem]"
                style={{ fontFamily: "var(--font-bebas-neue)" }}
              >
                Horarios
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#1B4332]/78">
                Un solo panel para crear, editar y borrar eventos. Si no aplicas filtro,
                el listado se centra en hoy: arriba quedan los dias anteriores y debajo los siguientes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="rounded-full border-2 border-[#1B4332] bg-[#1B4332] px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-[#F0EAD6] transition hover:bg-transparent hover:text-[#1B4332]"
              >
                Nuevo evento
              </button>
              <button
                type="button"
                onClick={toggleAllVisibility}
                disabled={togglingVisibility || items.length === 0}
                className="rounded-full border-2 border-[#1B4332] px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-[#1B4332] transition hover:bg-[#1B4332] hover:text-[#F0EAD6] disabled:opacity-50"
              >
                {togglingVisibility ? "Actualizando..." : allEventsVisible ? "Ocultar todas" : "Hacer todas visibles"}
              </button>
              <a
                href="/api/logout"
                className="rounded-full border-2 border-[#A61F24] px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-[#A61F24] transition hover:bg-[#A61F24] hover:text-white"
              >
                Cerrar sesion
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#1B4332] bg-[#E5DDC4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.36em] text-[#1B4332]/45">Filtro por dia</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="rounded-full border border-[#1B4332] bg-[#F0EAD6] px-4 py-2 text-sm text-[#1B4332]"
              />
              <button
                type="button"
                onClick={() => setFilterDate(todayKey)}
                className="rounded-full border border-[#1B4332] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#1B4332] transition hover:bg-[#1B4332] hover:text-[#F0EAD6]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFilterDate("")}
                className="rounded-full border border-[#1B4332]/35 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#1B4332]/70 transition hover:border-[#1B4332] hover:text-[#1B4332]"
              >
                Ver todo
              </button>
            </div>
          </div>

          <div className="text-sm text-[#1B4332]/72">
            {filterDate ? (
              <p>Mostrando solo {toDisplayDate(filterDate)}.</p>
            ) : (
              <p>Vista completa centrada en el dia de hoy.</p>
            )}
          </div>
        </div>
      </section>

      {editorOpen && (
        <section className="border-b-2 border-[#1B4332] bg-[#A61F24] text-[#F0EAD6]">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.36em] text-[#F0EAD6]/65">
                  {editingId == null ? "Crear evento" : "Editar evento"}
                </p>
                <h2
                  className="mt-2 text-5xl uppercase leading-none"
                  style={{ fontFamily: "var(--font-bebas-neue)" }}
                >
                  {editingId == null ? "Nuevo horario" : "Actualizar horario"}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#F0EAD6]/45 px-4 py-2 text-[11px] uppercase tracking-[0.24em] transition hover:bg-[#F0EAD6] hover:text-[#A61F24]"
              >
                Cerrar
              </button>
            </div>

            <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Titulo</span>
                <input
                  required
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#F0EAD6]/35 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[#F0EAD6]/40"
                  placeholder="Gran prix, verbena, cena..."
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Titulo corto calendario</span>
                <input
                  value={form.calendarTitle}
                  onChange={(event) => updateForm("calendarTitle", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#F0EAD6]/35 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[#F0EAD6]/40"
                  placeholder="Opcional: nombre corto en el iPhone"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Lugar</span>
                <input
                  value={form.location}
                  onChange={(event) => updateForm("location", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#F0EAD6]/35 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[#F0EAD6]/40"
                  placeholder="Plaza, fronton, parque..."
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Fecha</span>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#F0EAD6]/35 bg-transparent px-4 py-3 text-base outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Hora</span>
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(event) => updateForm("time", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#F0EAD6]/35 bg-transparent px-4 py-3 text-base outline-none"
                />
              </label>

              <div className="lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#F0EAD6]/70">Etiquetas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const active = form.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                          active
                            ? "border-[#F0EAD6] bg-[#F0EAD6] text-[#A61F24]"
                            : "border-[#F0EAD6]/35 text-[#F0EAD6]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={form.provisional}
                  onChange={(event) => updateForm("provisional", event.target.checked)}
                  className="h-5 w-5 rounded border border-[#F0EAD6]/35"
                />
                <span className="text-sm">Marcar como provisional</span>
              </label>

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#F0EAD6] px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-[#A61F24] transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : editingId == null ? "Crear evento" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#F0EAD6]/35 px-6 py-3 text-[11px] uppercase tracking-[0.3em] transition hover:bg-[#F0EAD6] hover:text-[#A61F24]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {loading && (
          <div className="rounded-[2rem] border border-[#1B4332] bg-white/70 px-6 py-5 text-sm text-[#1B4332]/70">
            Cargando horarios...
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-[2rem] border border-[#A61F24] bg-white/80 px-6 py-5 text-sm text-[#A61F24]">
            {error}
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div className="rounded-[2rem] border border-[#1B4332] bg-white/70 px-6 py-8 text-sm text-[#1B4332]/70">
            No hay eventos para este dia todavia.
          </div>
        )}

        {!loading && filterDate && filteredGroups.length > 0 && (
          <div className="space-y-8">
            {renderGroup("Dia filtrado", "#FFF4D8", filteredGroups)}
          </div>
        )}

        {!loading && !filterDate && (
          <div className="space-y-10">
            {renderGroup("Anteriores", "#E5DDC4", grouped.previous)}
            {renderGroup("Hoy", "#FFF4D8", grouped.today, todayRef)}
            {renderGroup("Siguientes", "#DDE8DF", grouped.next)}
          </div>
        )}
      </section>
    </main>
  );
}
