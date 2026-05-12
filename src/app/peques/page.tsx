"use client";

import React, { useState, useEffect } from "react";
import ArchivePageLayout from "@/components/ArchivePageLayout";

const MADRID_TZ = "Europe/Madrid";
const INK = "#1B4332";
const RED = "#A61F24";

type Event = {
  id: number;
  title: string;
  provisional: boolean;
  location?: string;
  date: string;
  time: string;
  tags?: string[];
  startsAt?: string;
};

function isFamilia(e: Event): boolean {
  return (
    e.tags?.includes("familia") ||
    e.tags?.includes("todos los públicos") ||
    e.tags?.includes("todos los publicos") ||
    false
  );
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

function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatHHMM(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseTimeMins(d: Date): number {
  const parts = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: MADRID_TZ,
  }).formatToParts(d);
  const hh = Number(parts.find((p) => p.type === "hour")!.value);
  const mm = Number(parts.find((p) => p.type === "minute")!.value);
  return hh < 6 ? hh * 60 + mm + 1440 : hh * 60 + mm;
}

function getSecciones(events: Event[]): { label: string; date: Date; key: string }[] {
  const today = dateKeyMadrid(new Date());
  const familiares = events.filter((e) => e.startsAt && isFamilia(e));
  const future = familiares.filter((e) => dateKeyMadrid(new Date(e.startsAt!)) >= today);
  const base = future.length > 0 ? future : familiares;
  const byDate = new Map<string, Date>();
  for (const e of base) {
    const key = dateKeyMadrid(new Date(e.startsAt!));
    if (!byDate.has(key)) byDate.set(key, new Date(e.startsAt!));
  }
  return Array.from(byDate.entries())
    .map(([key, date]) => ({ key, date, label: formatSpanishLong(date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getByDate(events: Event[], dateKey: string): Event[] {
  return events
    .filter((e) => e.startsAt && dateKeyMadrid(new Date(e.startsAt)) === dateKey && isFamilia(e))
    .sort((a, b) => parseTimeMins(new Date(a.startsAt!)) - parseTimeMins(new Date(b.startsAt!)));
}

export default function PequesPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((json) => {
        const list: Event[] = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];
        setAllEvents(list);
        setLoading(false);
      })
      .catch(() => { setAllEvents([]); setLoading(false); });
  }, []);

  const secciones = getSecciones(allEvents);
  const hasProvisional = allEvents.some((e) => e.provisional);

  return (
    <ArchivePageLayout
      title="Peques"
      kicker="Familia y todos los públicos"
      chapter="CAP.03"
      accent={RED}
      intro="La parte del programa que abre espacio a juegos, reuniones y actos donde el pueblo entero entra dentro."
    >
      {loading ? (
        <div className="flex items-center py-16">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2" style={{ borderColor: INK }} />
        </div>
      ) : secciones.length === 0 ? (
        <p className="text-sm" style={{ color: INK, opacity: 0.5 }}>Sin eventos familiares cargados todavía.</p>
      ) : (
        <div>
          {secciones.map((sec, secIdx) => {
            const evs = getByDate(allEvents, sec.key);
            return (
              <div key={sec.key}>
                <div
                  className="animate-in pt-8 pb-3"
                  style={{ "--reveal-delay": `${secIdx * 0.07}s` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: INK, opacity: 0.35 }} className="text-lg font-bold">—</span>
                    <p className="text-lg sm:text-xl font-bold uppercase tracking-[0.28em]" style={{ color: INK }}>
                      {sec.label}
                    </p>
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: INK, opacity: 0.15 }} />
                  </div>
                </div>

                <div className="mb-6">
                  {evs.map((ev, i) => {
                    const d = new Date(ev.startsAt!);
                    const timeColor = ev.provisional ? RED : INK;
                    return (
                      <div
                        key={ev.id}
                        className="animate-in grid grid-cols-[5.5rem_1fr] gap-5 py-3 border-b"
                        style={{ "--reveal-delay": `${secIdx * 0.07 + i * 0.04}s`, borderColor: `${INK}18` } as React.CSSProperties}
                      >
                        <div className="pt-0.5">
                          <p
                            className="text-[1.8rem] sm:text-[2.2rem] leading-none font-bold tabular-nums"
                            style={{ fontFamily: "var(--font-bebas-neue)", color: timeColor }}
                          >
                            {formatHHMM(d)}
                          </p>
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
