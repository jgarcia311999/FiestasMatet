"use client";

import React, { useState, useEffect } from "react";
import ArchivePageLayout from "@/components/ArchivePageLayout";

const MADRID_TZ = "Europe/Madrid";
const INK = "#1B4332";
const RED = "#A61F24";

type Event = {
  id: number;
  title: string;
  provisional?: boolean;
  location?: string;
  date?: string;
  time?: string;
};

function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatSpanishLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: MADRID_TZ,
  }).format(date);
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

function sortNightLast(items: { time: string }[]) {
  const toMin = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh >= 0 && hh < 6 ? hh * 60 + (mm || 0) + 1440 : hh * 60 + (mm || 0);
  };
  items.sort((a, b) => toMin(a.time) - toMin(b.time));
}

export default function TodasPage() {
  const [rows, setRows] = useState<Event[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((json) => {
        const list: Event[] = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];
        setRows(list);
        const today = dateKeyMadrid(new Date());
        if (list.length > 0 && !list.some((e) => e.date && e.date >= today)) {
          setShowPast(true);
        }
        setLoading(false);
      })
      .catch(() => { setRows([]); setLoading(false); });
  }, []);

  const todayKey = dateKeyMadrid(new Date());

  const byDate = new Map<
    string,
    { label: string; items: { id: number; time: string; title: string; provisional: boolean; location: string }[] }
  >();
  for (const ev of rows) {
    if (!ev.date) continue;
    if (!showPast && ev.date < todayKey) continue;
    const label = formatSpanishLong(new Date(ev.date));
    const item = {
      id: ev.id,
      time: ev.time || "",
      title: ev.title,
      provisional: !!ev.provisional,
      location: ev.location || "",
    };
    if (!byDate.has(ev.date)) byDate.set(ev.date, { label, items: [] });
    byDate.get(ev.date)!.items.push(item);
  }

  const days = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, items }]) => {
      sortNightLast(items);
      return { key, label, items };
    });

  const hasProvisional = rows.some((e) => e.provisional);

  return (
    <ArchivePageLayout
      title="Todas"
      kicker="El programa completo"
      chapter="CAP.04"
      accent={INK}
      intro="La versión íntegra del programa, planteada como una cronología visual para entrar, salir y volver sin perder el hilo."
    >
      {/* Toggle */}
      <div className="mb-8 animate-in">
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          className="border-2 px-5 py-3 text-[11px] uppercase tracking-[0.35em] font-medium transition"
          style={{
            borderColor: INK,
            color: INK,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = INK;
            (e.currentTarget as HTMLButtonElement).style.color = "#F0EAD6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = INK;
          }}
        >
          {showPast ? "Ocultar anteriores" : "Ver anteriores"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center py-16">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2" style={{ borderColor: INK }} />
        </div>
      ) : days.length === 0 ? (
        <p className="text-sm" style={{ color: INK, opacity: 0.5 }}>Sin fiestas cargadas todavía.</p>
      ) : (
        <div>
          {days.map((day, dayIdx) => {
            const isPastDay = day.key < todayKey;
            return (
              <div key={day.key} style={{ opacity: isPastDay ? 0.6 : 1 }}>
                {/* Day header — PDF style — */}
                <div
                  className="animate-in pt-8 pb-3"
                  style={{ "--reveal-delay": `${dayIdx * 0.04}s` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: INK, opacity: 0.35 }} className="text-lg font-bold">—</span>
                    <p className="text-lg sm:text-xl font-bold uppercase tracking-[0.28em]" style={{ color: INK }}>
                      {isPastDay && (
                        <span className="text-[10px] uppercase tracking-[0.35em] opacity-50 mr-2">Pasado</span>
                      )}
                      {day.label}
                    </p>
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: INK, opacity: 0.15 }} />
                  </div>
                </div>

                {/* Events */}
                <div className="mb-4">
                  {day.items.map((ev, i) => {
                    const timeColor = ev.provisional ? RED : INK;
                    return (
                      <div
                        key={ev.id}
                        className="animate-in grid grid-cols-[5.5rem_1fr] gap-5 py-3 border-b"
                        style={{ "--reveal-delay": `${dayIdx * 0.04 + i * 0.03}s`, borderColor: `${INK}18` } as React.CSSProperties}
                      >
                        <div className="pt-0.5">
                          {ev.time ? (
                            <p
                              className="text-[1.8rem] sm:text-[2.2rem] leading-none font-bold tabular-nums"
                              style={{ fontFamily: "var(--font-bebas-neue)", color: timeColor }}
                            >
                              {ev.time}
                            </p>
                          ) : (
                            <p className="text-[14px]" style={{ color: INK, opacity: 0.3 }}>—</p>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[14px] sm:text-[15px] font-semibold uppercase tracking-[0.06em] leading-snug" style={{ color: INK }}>
                            {ev.title}
                          </p>
                          {ev.location && (
                            <p className="text-[12px] mt-0.5 uppercase tracking-[0.05em]" style={{ color: INK, opacity: 0.5 }}>
                              {ev.location}
                            </p>
                          )}
                          {ev.provisional && (
                            <p className="text-[10px] uppercase tracking-[0.3em] mt-0.5" style={{ color: RED, opacity: 0.7 }}>
                              Provisional
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {hasProvisional && (
            <p className="text-[11px] uppercase tracking-[0.3em] mt-6 pt-4 border-t"
              style={{ color: RED, opacity: 0.65, borderColor: `${INK}15` }}>
              * Las horas en rojo son provisionales y pueden variar.
            </p>
          )}
        </div>
      )}
    </ArchivePageLayout>
  );
}
