"use client";

import { useState, useEffect } from "react";

// Tipado derivado de la tabla events
type Event = {
  id: number;
  startsAt: string;
  title: string;
  provisional?: boolean;
  location?: string;
};

const TZ = "Europe/Madrid";

function toDateKeyTZ(d: Date, tz: string) {
  // YYYY-MM-DD en la zona indicada
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function toTimeHHMM(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function sortNightLast(items: { time: string }[]) {
  const toMin = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh >= 0 && hh < 6 ? hh * 60 + (mm || 0) + 24 * 60 : hh * 60 + (mm || 0);
  };
  items.sort((a, b) => toMin(a.time) - toMin(b.time));
}

// Agrega formato largo "Lunes 12 de agosto"
function formatSpanishLong(date: Date, tz: string): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

export default function CalendarPage() {
  const [rows, setRows] = useState<Event[]>([]);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      if (res.ok) {
        const json = await res.json();
        const list: Event[] = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];
        setRows(list);
      } else {
        setRows([]);
      }
    }
    fetchEvents();
  }, []);

  // Clave de hoy en Europe/Madrid (mostramos hoy aunque la hora haya pasado)
  const todayKey = toDateKeyTZ(new Date(), TZ);

  // 2) Agrupar por fecha "YYYY-MM-DD" con la estructura que espera el calendario
  const byDate = new Map<
    string,
    { label: string; items: { id: number; time: string; title: string; provisional: boolean; location: string }[] }
  >();

  for (const ev of rows) {
    const d = new Date(ev.startsAt);
    const key = toDateKeyTZ(d, TZ);
    if (!showPast && key < todayKey) continue;
    const label = formatSpanishLong(d, TZ);
    const item = {
      id: ev.id,
      time: toTimeHHMM(d),
      title: ev.title,
      provisional: !!ev.provisional,
      location: ev.location || "",
    };
    if (!byDate.has(key)) byDate.set(key, { label, items: [] });
    byDate.get(key)!.items.push(item);
  }

  // 3) Orden cronológico de días y de items por hora (madrugada al final)
  const days = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, items }]) => {
      sortNightLast(items);
      return { key, label, items };
    });

  return (
    <main className="min-h-screen bg-[#E85D6A] text-[#0C2335]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-tight">
          Vive <strong>todas</strong> las fiestas de <strong className="block mt-2">MATET</strong>
        </h1>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="text-sm underline hover:no-underline"
          >
            {showPast ? "<- Ocultar anteriores" : "<- Ver anteriores"}
          </button>
        </div>

        <div className="mt-5 border-t border-[#0C2335]" />

        {days.length === 0 ? (
          <div className="py-2 text-[12px] italic">Sin fiestas</div>
        ) : (
          <>
            {days.map((day) => (
              <div key={day.key}>
                <div className="text-lg uppercase tracking-[0.18em] py-2">
                  <span className="border-b border-transparent">{day.label}</span>
                </div>

                <div className="p-2 text-base">
                  {day.items.length === 0 ? (
                    <div className="italic">Sin eventos para este día</div>
                  ) : (
                    <ul className="space-y-1">
                      {day.items.map((ev) => (
                        <li key={ev.id} className="text-lg">
                          A las {ev.time} {getFranjaHorariaLabel(ev.time)}
                          {ev.provisional && "*"} - {ev.title}
                          {ev.location ? <span> ({ev.location})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-[#0C2335]" />
              </div>
            ))}
          </>
        )}

        {rows.some((f) => f.provisional) && (
          <p className="mt-4 text-sm italic">*La hora es provisional y puede variar.</p>
        )}

        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight">Matet</p>
          <p className="font-serif text-[28px] leading-tight">es su gente</p>
          <p className="mt-2 text-[12px]">@comision2026</p>
        </div>
      </div>
    </main>
  );
}

function getFranjaHorariaLabel(timeHHMM: string): string {
  const [hhStr] = timeHHMM.split(":");
  const hh = Number(hhStr);
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}