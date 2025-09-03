"use client";
import { useMemo, useRef, useState } from "react";
import { fiestas as fiestasData, type Fiesta } from "@/data/fiestas";

// =====================
// Utilidades de fechas
// =====================
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
  // getDay(): 0=Dom, 1=Lun... -> 0=Lun ... 6=Dom
  return (gDay + 6) % 7;
}
function useMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const firstW = weekdayMondayFirst(first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - firstW + i);
    const inMonth = d.getMonth() === month;
    return { date: d, key: ymd(d), inMonth };
  });
  return cells;
}

// =====================
// Agrupaciones y filtros
// =====================
function getSecciones(fiestaLista: Fiesta[], includePast: boolean): { label: string; date: Date; key: string }[] {
  const today = startOfTodayLocal();
  const enriched = fiestaLista
    .map((f) => ({ ...f, dateObj: parseISODateLocal(f.date) }))
    .filter((f) => !isNaN(f.dateObj.getTime()) && (includePast ? true : f.dateObj >= today));

  const byDate = new Map<string, Date>();
  for (const f of enriched) {
    if (!byDate.has(f.date)) byDate.set(f.date, f.dateObj);
  }

  return Array.from(byDate.entries())
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .map(([key, d]) => ({ key, date: d, label: formatSpanishLong(d) }));
}

function getEventosPorFecha(fiestaLista: Fiesta[], dateKey: string): Fiesta[] {
  const byDate = fiestaLista.filter((f) => f.date === dateKey);
  // Madrugada (00:00–05:59) cuenta como final del día
  const parseTime = (t: string) => {
    const [hh, mm] = (t || "00:00").split(":").map(Number);
    let minutes = (hh || 0) * 60 + (mm || 0);
    if (!isNaN(hh) && hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.time) - parseTime(b.time));
}

function getFranjaHorariaLabel(time: string): string {
  const [hhStr] = (time || "00:00").split(":");
  const hh = Number(hhStr);
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}

export default function CalendarPage() {
  const today = startOfTodayLocal();
  const [showAll, setShowAll] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [selected, setSelected] = useState<string | null>(ymd(today));

  const secciones = getSecciones(fiestasData, showAll);
  const grid = useMonthGrid(year, month);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Fiesta[]>();
    for (const f of fiestasData) {
      const arr = map.get(f.date) ?? [];
      arr.push(f);
      map.set(f.date, arr);
    }
    return map;
  }, []);

  const selectedEvents = selected ? getEventosPorFecha(fiestasData, selected) : [];
  const listAnchorRef = useRef<HTMLDivElement>(null);

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

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"]; // encabezado breve

  return (
    <main className="min-h-screen bg-[#d9e3f0] text-[#0C2335]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        {/* Headline */}
        <h1 className="font-serif text-[36px] leading-snug tracking-tight mb-4">
          Busca <strong>todas</strong> las fiestas de <strong>MATET</strong>
        </h1>

        {/* ===================== */}
        {/* Calendario interactivo */}
        {/* ===================== */}
        <section className="mt-6 rounded-2xl border border-[#0C2335]/20 p-3 shadow-sm">
          {/* Controles de mes */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="rounded-md border border-[#0C2335]/20 px-3 py-1.5 text-sm hover:bg-white"
              aria-label="Mes anterior"
            >
              ←
            </button>
            <div className="px-2 text-sm font-semibold">
              {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
                new Date(year, month, 1)
              )}
            </div>
            <button
              onClick={nextMonth}
              className="rounded-md border border-[#0C2335]/20 px-3 py-1.5 text-sm hover:bg-white"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>

          {/* Encabezado de días */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#2D4659] mb-1">
            {weekDays.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Rejilla del mes */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map(({ date, inMonth, key }) => {
              const count = eventsByDate.get(key)?.length ?? 0;
              const hasEvents = count > 0;
              const isSelected = selected === key;
              const isToday = key === ymd(today);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelected(key);
                    listAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={[
                    "aspect-square rounded-lg p-2 text-center border",
                    inMonth
                      ? isToday
                        ? "bg-[#1E90FF]/20"
                        : hasEvents
                        ? "bg-[#A5B7D3]"
                        : "bg-white"
                      : "bg-white/60 text-[#2D4659] opacity-70",
                    isSelected
                      ? "border-[#0C2335] ring-2 ring-[#0C2335]/20"
                      : isToday
                      ? "border-[#1E90FF]"
                      : hasEvents
                      ? "border-[#A5B7D3]"
                      : "border-[#0C2335]/10",
                    "hover:shadow hover:translate-y-[-1px] transition"
                  ].join(" ")}
                >
                  <div className="flex h-full w-full items-center justify-center text-sm">
                    <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Divider rows of chips */}
        <div ref={listAnchorRef} className="mt-6 border-t border-[#0C2335]" />

        {/* Lista por días como en tu diseño anterior */}
        {(() => {
          const filtered = selected ? [selected] : [];
          const secciones = filtered.length
            ? filtered.map((key) => ({ key, date: parseISODateLocal(key), label: formatSpanishLong(parseISODateLocal(key)) }))
            : getSecciones(fiestasData, showAll);

          return secciones.length === 0 ? (
            <div className="py-2 text-[12px] italic">Sin fiestas</div>
          ) : (
            <>
              {secciones.map((sec) => (
                <div key={sec.key}>
                  <div className="text-lg uppercase tracking-[0.18em] py-2">
                    <span className="border-b border-transparent">{sec.label}</span>
                  </div>
                  <div className="p-2 text-base">
                    {getEventosPorFecha(fiestasData, sec.key).length === 0 ? (
                      <div className="italic">
                        De momento no hay nada... pero cuéntanos en{" "}
                        <a
                          href="https://www.instagram.com/comisionmatet2026?igsh=MTcwejRoYTYyZDNocg=="
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          @comisionmatet2026
                        </a>{" "}
                        si quieres que organicemos algo!!
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {getEventosPorFecha(fiestasData, sec.key).map((ev, i) => (
                          <li key={i} className="text-lg">
                            A las {ev.time} {getFranjaHorariaLabel(ev.time)}
                            {ev.provisional && "*"} - {ev.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="border-t border-[#0C2335]" />
                </div>
              ))}
            </>
          );
        })()}

        {fiestasData.some((f) => f.provisional) && (
          <p className="mt-4 text-sm italic">*La hora es provisional y puede variar.</p>
        )}

        {/* Call to action serif */}
        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight">Matet</p>
          <p className="font-serif text-[28px] leading-tight">es su gente</p>
          <p className="mt-2 text-[12px]">@comision2026</p>
        </div>
      </div>
    </main>
  );
}
