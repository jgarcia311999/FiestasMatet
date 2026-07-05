"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TZ = "Europe/Madrid";
const INK = "#1B4332";
const PAPER = "#F0EAD6";
const SAND = "#E5DDC4";
const RED = "#A61F24";

type Fiesta = {
  title: string;
  location?: string;
  provisional?: boolean;
  date: string;
  time: string;
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function fromApi(ev: unknown): Fiesta {
  if (!isRecord(ev)) return { title: "", provisional: false, date: "", time: "" };

  const title =
    typeof ev.title === "string" ? ev.title : String((ev as Record<string, unknown>).title ?? "");
  const location =
    typeof ev.location === "string" ? ev.location : String((ev as Record<string, unknown>).location ?? "");
  const provisional =
    typeof ev.provisional === "boolean"
      ? ev.provisional
      : Boolean((ev as Record<string, unknown>).provisional);

  let date = typeof ev.date === "string" ? (ev.date as string) : undefined;
  let time = typeof ev.time === "string" ? (ev.time as string) : undefined;

  const startsAtVal = (ev as Record<string, unknown>).startsAt;
  const startsAtStr =
    typeof startsAtVal === "string"
      ? startsAtVal
      : startsAtVal instanceof Date
      ? startsAtVal.toISOString()
      : undefined;

  if ((!date || !time) && startsAtStr) {
    const d = new Date(startsAtStr);
    if (!Number.isNaN(d.getTime())) {
      if (!date) date = toYMD(d, TZ);
      if (!time) time = toHM(d, TZ);
    }
  }

  return {
    title,
    location: location || "",
    provisional,
    date: date ?? "",
    time: time ?? "",
  };
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISODateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatSpanishLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

function weekdayMondayFirst(gDay: number) {
  return (gDay + 6) % 7;
}

function useMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const firstW = weekdayMondayFirst(first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - firstW + i);
    return { date: d, key: ymd(d), inMonth: d.getMonth() === month };
  });
}

function getEventosPorFecha(fiestaLista: Fiesta[], dateKey: string): Fiesta[] {
  const byDate = fiestaLista.filter((f) => f.date === dateKey);
  const parseTime = (t: string) => {
    const [hh, mm] = (t || "00:00").split(":").map(Number);
    let minutes = (hh || 0) * 60 + (mm || 0);
    if (!Number.isNaN(hh) && hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.time) - parseTime(b.time));
}

function getFranjaHorariaLabel(time: string) {
  const [hhStr] = (time || "00:00").split(":");
  const hh = Number(hhStr);
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}

export default function CalendarPage() {
  const today = startOfTodayLocal();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(ymd(today));
  const [fiestasData, setFiestasData] = useState<Fiesta[]>([]);
  const [loading, setLoading] = useState(true);

  const grid = useMonthGrid(year, month);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const listRaw = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];
        const normalized: Fiesta[] = (listRaw as unknown[]).map(fromApi);
        setFiestasData(normalized.filter((f) => !!f.date && !!f.time && !!f.title));
      } catch {
        setFiestasData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Fiesta[]>();
    for (const f of fiestasData) {
      const arr = map.get(f.date) ?? [];
      arr.push(f);
      map.set(f.date, arr);
    }
    return map;
  }, [fiestasData]);

  const selectedEvents = useMemo(
    () => getEventosPorFecha(fiestasData, selected),
    [fiestasData, selected]
  );

  const upcomingDays = useMemo(() => {
    const todayKey = ymd(today);
    return Array.from(eventsByDate.keys())
      .filter((key) => key >= todayKey)
      .sort()
      .slice(0, 5)
      .map((key) => ({
        key,
        label: formatSpanishLong(parseISODateLocal(key)),
        count: eventsByDate.get(key)?.length ?? 0,
      }));
  }, [eventsByDate, today]);

  function prevMonth() {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const selectedDate = parseISODateLocal(selected);
  const selectedLabel = formatSpanishLong(selectedDate);
  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));

  return (
    <main className="min-h-[100svh] bg-[#F0EAD6] text-[#1B4332]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1B4332] bg-[#F0EAD6]">
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.45em] font-medium transition-opacity hover:opacity-50"
          >
            ← Inicio
          </Link>
          <p className="hidden text-[10px] uppercase tracking-[0.45em] font-medium sm:block">
            Matet en fiestas
          </p>
          <Link
            href="/suscribirse"
            className="text-[10px] uppercase tracking-[0.45em] font-medium transition-opacity hover:opacity-50"
          >
            Suscribirse
          </Link>
        </div>
      </header>

      <section className="border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b-2 border-[#1B4332] px-5 py-14 sm:px-8 sm:py-20 lg:border-b-0 lg:border-r-2">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#1B4332]/40">
              Programa por fecha
            </p>
            <h1
              className="mt-4 text-[4.8rem] uppercase leading-[0.84] sm:text-[8rem] lg:text-[10rem]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Calendario
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[#1B4332]/75">
              Un calendario visual para entrar a cualquier día de fiestas, ver de un golpe los
              actos cargados y moverte por agosto sin perder el hilo.
            </p>
          </div>

          <div className="px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#1B4332]/40">
              Fechas próximas
            </p>
            <div className="mt-6 space-y-4">
              {upcomingDays.length === 0 ? (
                <p className="text-sm text-[#1B4332]/55">Todavía no hay fechas visibles en el calendario.</p>
              ) : (
                upcomingDays.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      const d = parseISODateLocal(day.key);
                      setYear(d.getFullYear());
                      setMonth(d.getMonth());
                      setSelected(day.key);
                    }}
                    className="flex w-full items-center justify-between border-b border-[#1B4332]/12 pb-4 text-left transition hover:opacity-70"
                  >
                    <span className="text-[15px] leading-7">{day.label}</span>
                    <span className="text-[10px] uppercase tracking-[0.32em] text-[#A61F24]">
                      {day.count} acto{day.count === 1 ? "" : "s"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b-2 border-[#1B4332] px-5 py-12 sm:px-8 sm:py-16 lg:border-b-0 lg:border-r-2">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevMonth}
                className="border-2 border-[#1B4332] px-4 py-2 text-[11px] uppercase tracking-[0.3em] transition hover:bg-[#1B4332] hover:text-[#F0EAD6]"
                aria-label="Mes anterior"
              >
                ←
              </button>
              <p
                className="text-[2.3rem] uppercase leading-none sm:text-[3rem]"
                style={{ fontFamily: "var(--font-bebas-neue)" }}
              >
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={nextMonth}
                className="border-2 border-[#1B4332] px-4 py-2 text-[11px] uppercase tracking-[0.3em] transition hover:bg-[#1B4332] hover:text-[#F0EAD6]"
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>

            <div className="mt-8 grid grid-cols-7 border-t-2 border-l-2 border-[#1B4332]">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div
                  key={d}
                  className="border-r-2 border-b-2 border-[#1B4332] py-3 text-center text-[10px] uppercase tracking-[0.35em] text-[#1B4332]/55"
                >
                  {d}
                </div>
              ))}

              {grid.map(({ date, inMonth, key }) => {
                const count = eventsByDate.get(key)?.length ?? 0;
                const hasEvents = count > 0;
                const isSelected = selected === key;
                const isToday = key === ymd(today);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className="relative aspect-square border-r-2 border-b-2 border-[#1B4332] p-2 text-left transition"
                    style={{
                      backgroundColor: isSelected ? SAND : inMonth ? PAPER : "#EEE7D3",
                      color: inMonth ? INK : "rgba(27,67,50,0.42)",
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        fontWeight: isToday || isSelected ? 700 : 500,
                        color: isSelected ? RED : isToday ? INK : undefined,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {hasEvents && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-[#A61F24]" />
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#1B4332]/55">
                          {count}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-12 sm:px-8 sm:py-16">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#1B4332]/40">
              Día seleccionado
            </p>
            <h2
              className="mt-4 text-[3.2rem] uppercase leading-[0.88] sm:text-[4.6rem]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              {selectedLabel}
            </h2>

            {loading ? (
              <div className="mt-8 flex items-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#1B4332]" />
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="mt-8 border-2 border-[#1B4332] bg-[#E5DDC4] p-6">
                <p className="text-sm leading-7 text-[#1B4332]/72">
                  Ese día no tiene actos visibles por ahora. Si más adelante se publica algo,
                  aparecerá aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {selectedEvents.map((ev, index) => (
                  <article
                    key={`${ev.date}-${ev.time}-${ev.title}-${index}`}
                    className="border-t-2 border-[#1B4332] pt-5 first:border-t-0 first:pt-0"
                  >
                    <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr]">
                      <div>
                        <p
                          className="text-[2rem] leading-none"
                          style={{
                            fontFamily: "var(--font-bebas-neue)",
                            color: ev.provisional ? RED : INK,
                          }}
                        >
                          {ev.time}
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#1B4332]/45">
                          {getFranjaHorariaLabel(ev.time)}
                        </p>
                      </div>

                      <div>
                        <h3
                          className="text-[2.1rem] uppercase leading-[0.92]"
                          style={{ fontFamily: "var(--font-bebas-neue)" }}
                        >
                          {ev.title}
                        </h3>
                        {ev.location && (
                          <p className="mt-2 text-sm leading-6 text-[#1B4332]/72">
                            {ev.location}
                          </p>
                        )}
                        {ev.provisional && (
                          <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#A61F24]">
                            Horario provisional
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#A61F24] text-[#F0EAD6]">
        <div className="grid lg:grid-cols-[1fr_0.9fr]">
          <div className="border-b-2 border-[#1B4332] px-5 py-14 sm:px-8 sm:py-20 lg:border-b-0 lg:border-r-2">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#F0EAD6]/65">
              En tu móvil
            </p>
            <h2
              className="mt-4 text-[4rem] uppercase leading-[0.86] sm:text-[5.5rem]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Llévatelo
            </h2>
          </div>
          <div className="px-5 py-14 sm:px-8 sm:py-20">
            <p className="max-w-md text-[15px] leading-7 text-[#F0EAD6]/85">
              Si prefieres tener todas las fechas en la app del iPhone, puedes suscribirte al
              calendario y recibir cada actualización pública sin tener que volver a buscarla.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/suscribirse"
                className="border-2 border-[#F0EAD6] bg-[#F0EAD6] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#A61F24] transition hover:bg-transparent hover:text-[#F0EAD6]"
              >
                Suscribirse
              </Link>
              <Link
                href="/todas"
                className="border-2 border-[#F0EAD6]/45 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#F0EAD6] transition hover:border-[#F0EAD6] hover:bg-[#F0EAD6] hover:text-[#A61F24]"
              >
                Ver listado completo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
