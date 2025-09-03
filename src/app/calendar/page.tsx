"use client";

import { useMemo, useState } from "react";
import { fiestas, type Fiesta } from "@/data/fiestas";

// Utilidades de fecha
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function spanishMonthName(year: number, month: number) {
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );
}
// Lunes=0 ... Domingo=6
function weekdayMondayFirst(gDay: number) {
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

function groupByDate(items: Fiesta[]) {
  const map = new Map<string, Fiesta[]>();
  for (const f of items) {
    const arr = map.get(f.date) ?? [];
    arr.push(f);
    map.set(f.date, arr);
  }
  return map;
}

export default function QuehaceresPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMonthGrid(year, month);
  const eventsByDate = useMemo(() => groupByDate(fiestas), []);

  const selectedEvents = selected ? eventsByDate.get(selected) ?? [] : [];

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
    <main className="min-h-screen bg-[#E7DAD1] text-[#0C2335] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendario de eventos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="rounded-md border border-[#0C2335]/20 px-3 py-1.5 text-sm hover:bg-white"
              aria-label="Mes anterior"
            >
              ←
            </button>
            <div className="px-2 font-medium">
              {spanishMonthName(year, month)}
            </div>
            <button
              onClick={nextMonth}
              className="rounded-md border border-[#0C2335]/20 px-3 py-1.5 text-sm hover:bg-white"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>
        </header>

        <section className="rounded-xl bg-white shadow border border-[#0C2335]/10 p-4">
          {/* Encabezado de días */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#2D4659] mb-2">
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
              const isSelected = selected === key;
              const isToday = key === ymd(today);
              const hasEvents = count > 0;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={[
                    "aspect-square rounded-lg p-2 text-left border",
                    inMonth ? "bg-white" : "bg-white/60 text-[#2D4659] opacity-70",
                    isSelected
                      ? "border-[#0C2335] ring-2 ring-[#0C2335]/20"
                      : isToday
                      ? "border-[#1E90FF]"
                      : hasEvents
                      ? "border-[#6B8E23]"
                      : "border-[#0C2335]/10",
                    "hover:shadow hover:translate-y-[-1px] transition"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
                    
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Panel de eventos del día seleccionado */}
        <section className="rounded-xl bg-white shadow border border-[#0C2335]/10 p-4">
          <h2 className="text-lg font-semibold mb-3">
            {selected ? `Eventos del ${selected}` : "Selecciona un día"}
          </h2>

          {selected && selectedEvents.length === 0 && (
            <p className="text-sm text-[#2D4659]">No hay eventos para este día.</p>
          )}

          <div className="space-y-3">
            {selectedEvents.map((e) => (
              <article key={e.title + e.date + e.time} className="rounded-lg border border-[#0C2335]/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-sm text-[#2D4659]">{e.description || "Sin descripción"}</p>
                  </div>
                  <div className="text-right text-xs text-[#2D4659]">
                    <div>{e.time}h</div>
                    <div>{e.location}</div>
                  </div>
                </div>
                {e.provisional && (
                  <div className="mt-2 text-xs inline-block bg-yellow-100 px-2 py-0.5 rounded">Provisional</div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
