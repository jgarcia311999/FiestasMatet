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

function hourMinuteMadrid(date: Date): { hour: number; minute: number } {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(date);
  const minuteStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return { hour: parseInt(hourStr, 10), minute: parseInt(minuteStr, 10) };
}

function getSecciones(eventos: Event[]): { label: string; date: Date; key: string }[] {
  const todayKey = dateKeyMadrid(new Date());
  const conFecha = eventos.filter((e) => e.startsAt);
  const futuras = conFecha
    .filter((e) => dateKeyMadrid(new Date(e.startsAt!)) >= todayKey)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const base = futuras.length > 0
    ? futuras
    : conFecha.sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());

  const seen = new Set<string>();
  const result: { label: string; date: Date; key: string }[] = [];
  for (const e of base) {
    const key = dateKeyMadrid(new Date(e.startsAt!));
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ key, date: new Date(e.startsAt!), label: formatSpanishLong(new Date(e.startsAt!)) });
      if (result.length >= 5) break;
    }
  }
  return result;
}

function getEventosPorFecha(eventos: Event[], dateKey: string): Event[] {
  const byDate = eventos.filter((e) => e.startsAt && dateKeyMadrid(new Date(e.startsAt)) === dateKey);
  const parseTime = (d: Date) => {
    const { hour: hh, minute: mm } = hourMinuteMadrid(d);
    let minutes = hh * 60 + mm;
    if (hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(new Date(a.startsAt!)) - parseTime(new Date(b.startsAt!)));
}

export default function ProximasPage() {
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
      title="Próximas"
      kicker="Lo que viene"
      chapter="Cap. 01"
      accent="#A61F24"
      intro="Una lectura directa del calendario para entrar a la fiesta por las fechas que vienen primero."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#c7b098]" />
        </div>
      ) : secciones.length === 0 ? (
        <p className="text-sm italic text-[#dbcab7]">Sin próximas fiestas.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {secciones.map((sec) => (
            <div key={sec.key} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#A61F24]">
                {sec.date.toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: MADRID_TZ })}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{sec.label}</h3>
              <ul className="mt-5 space-y-3">
                {getEventosPorFecha(allEvents, sec.key).map((ev) => {
                  const d = new Date(ev.startsAt!);
                  return (
                    <li key={ev.id} className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[4.2rem_minmax(0,1fr)]">
                      <span className="font-serif text-lg text-[#A61F24]">{formatHHMMMadrid(d)}</span>
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
          ))}
          {hasProvisional && (
            <p className="lg:col-span-2 text-[12px] italic text-[#c7b098]">
              * La hora es provisional y puede variar.
            </p>
          )}
        </div>
      )}
    </ArchivePageLayout>
  );
}
