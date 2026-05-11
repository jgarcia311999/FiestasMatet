"use client";

import React, { useState, useEffect } from "react";
import ArchivePageLayout from "@/components/ArchivePageLayout";

const MADRID_TZ = "Europe/Madrid";

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

function formatHHMMMadrid(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getSecciones(eventsList: Event[]): { label: string; date: Date; key: string }[] {
  const todayKey = dateKeyMadrid(new Date());
  const nocturnos = eventsList.filter(
    (f) => f.startsAt && f.tags?.includes("noche")
  );
  const nocturnosFuturos = nocturnos.filter(
    (f) =>
      dateKeyMadrid(new Date(f.startsAt!)) >= todayKey
  );
  const base = nocturnosFuturos.length > 0 ? nocturnosFuturos : nocturnos;
  const byDate = new Map<string, Date>();
  for (const f of base) {
    const key = dateKeyMadrid(new Date(f.startsAt!));
    if (!byDate.has(key)) byDate.set(key, new Date(f.startsAt!));
  }
  return Array.from(byDate.entries())
    .map(([key, date]) => ({ key, date, label: formatSpanishLong(date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getEventosPorFecha(eventsList: Event[], dateKey: string): Event[] {
  const byDate = eventsList.filter(
    (f) =>
      f.startsAt &&
      dateKeyMadrid(new Date(f.startsAt)) === dateKey &&
      f.tags?.includes("noche")
  );
  const parseTime = (d: Date) => {
    const parts = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: MADRID_TZ,
    }).formatToParts(d);
    const hh = Number(parts.find((p) => p.type === "hour")!.value);
    const mm = Number(parts.find((p) => p.type === "minute")!.value);
    let minutes = hh * 60 + mm;
    if (hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(new Date(a.startsAt!)) - parseTime(new Date(b.startsAt!)));
}

export default function Noche() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((json) => {
        const list: Event[] = Array.isArray(json?.events)
          ? json.events
          : Array.isArray(json)
          ? json
          : [];
        setAllEvents(list);
        setLoading(false);
      })
      .catch(() => { setAllEvents([]); setLoading(false); });
  }, []);

  const secciones = getSecciones(allEvents);
  const hasProvisional = allEvents.some((f) => f.provisional);

  return (
    <ArchivePageLayout
      title="Noche"
      kicker="Verbenas y música"
      chapter="Cap. 02"
      accent="#345DB8"
      intro="Cuando baja el sol, el programa se lee distinto: escenario, plaza, música y gente entrando y saliendo del mismo recorrido."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#c7b098]" />
        </div>
      ) : secciones.length === 0 ? (
        <p className="text-sm italic text-[#dbcab7]">Sin próximas noches con eventos.</p>
      ) : (
        <div className="space-y-6">
          {secciones.map((sec) => (
            <div key={sec.key} className="rounded-[1.75rem] border border-white/10 bg-[#131119] p-5">
              <div className="grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#345DB8]">
                    {sec.date.toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: MADRID_TZ })}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">{sec.label}</h3>
                </div>
                <ul className="space-y-3">
                  {getEventosPorFecha(allEvents, sec.key).map((ev) => {
                    const d = new Date(ev.startsAt!);
                    return (
                      <li key={ev.id} className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[4.2rem_minmax(0,1fr)]">
                        <span className="font-serif text-lg text-[#8fb0ff]">{formatHHMMMadrid(d)}</span>
                        <span className="text-[15px] leading-7 text-[#f3eadc]">
                          {ev.title}
                          {ev.location && <span className="text-[#c7b098]"> · {ev.location}</span>}
                          {ev.provisional && <span className="text-[#c7b098]"> *</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
          {hasProvisional && (
            <p className="text-[12px] italic text-[#c7b098]">
              * La hora es provisional y puede variar.
            </p>
          )}
        </div>
      )}
    </ArchivePageLayout>
  );
}
