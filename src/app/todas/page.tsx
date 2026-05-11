"use client";

import React from "react";
import { useState, useEffect } from "react";
import ArchivePageLayout from "@/components/ArchivePageLayout";

type Event = {
  id: number;
  title: string;
  provisional?: boolean;
  location?: string;
  date?: string;
  time?: string;
};

const TZ = "Europe/Madrid";

function toDateKeyTZ(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function sortNightLast(items: { time: string }[]) {
  const toMin = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh >= 0 && hh < 6 ? hh * 60 + (mm || 0) + 24 * 60 : hh * 60 + (mm || 0);
  };
  items.sort((a, b) => toMin(a.time) - toMin(b.time));
}

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

export default function TodasPage() {
  const [rows, setRows] = useState<Event[]>([]);
  const [showPast, setShowPast] = useState(false);
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
        setRows(list);
        const today = toDateKeyTZ(new Date(), TZ);
        if (list.length > 0 && !list.some((event) => event.date && event.date >= today)) {
          setShowPast(true);
        }
        setLoading(false);
      })
      .catch(() => { setRows([]); setLoading(false); });
  }, []);

  const todayKey = toDateKeyTZ(new Date(), TZ);

  const byDate = new Map<
    string,
    { label: string; items: { id: number; time: string; title: string; provisional: boolean; location: string }[] }
  >();
  for (const ev of rows) {
    if (!ev.date) continue;
    const key = ev.date;
    if (!showPast && key < todayKey) continue;
    const d = new Date(ev.date);
    const label = formatSpanishLong(d, TZ);
    const item = {
      id: ev.id,
      time: ev.time || "",
      title: ev.title,
      provisional: !!ev.provisional,
      location: ev.location || "",
    };
    if (!byDate.has(key)) byDate.set(key, { label, items: [] });
    byDate.get(key)!.items.push(item);
  }

  const days = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, items }]) => {
      sortNightLast(items);
      return { key, label, items };
    });
  const hasProvisional = rows.some((f) => f.provisional);

  return (
    <ArchivePageLayout
      title="Todas"
      kicker="Programa completo"
      chapter="Cap. 04"
      accent="#A61F24"
      intro="La versión íntegra del programa, planteada como una cronología visual para entrar, salir y volver sin perder el hilo."
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPast((value) => !value)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#c7b098] transition hover:bg-white/10"
        >
          {showPast ? "Ocultar anteriores" : "Ver anteriores"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#c7b098]" />
        </div>
      ) : days.length === 0 ? (
        <p className="text-sm italic text-[#dbcab7]">Sin fiestas.</p>
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day.key} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#A61F24]">Día</p>
                  <h3 className="mt-3 text-2xl font-semibold">{day.label}</h3>
                </div>
                <ul className="space-y-3">
                  {day.items.map((ev) => (
                    <li key={ev.id} className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[4.2rem_minmax(0,1fr)]">
                      <span className="font-serif text-lg text-[#8fb0ff]">{ev.time}</span>
                      <span className="text-[15px] leading-7 text-[#f3eadc]">
                        {ev.title}
                        {ev.location && <span className="text-[#c7b098]"> · {ev.location}</span>}
                        {ev.provisional && <span className="text-[#c7b098]"> *</span>}
                      </span>
                    </li>
                  ))}
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
