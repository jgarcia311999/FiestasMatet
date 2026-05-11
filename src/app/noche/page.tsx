"use client";

import React, { useState, useEffect } from "react";
import BookPageLayout from "@/components/BookPageLayout";

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

type Section = {
  key: string;
  label: string;
  date: Date;
  events: Event[];
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

function paginateSections(sections: Section[], maxUnits: number): Section[][] {
  const pages: Section[][] = [];
  let current: Section[] = [];
  let units = 0;

  for (const section of sections) {
    const sectionUnits = 3 + section.events.length * 2;
    if (current.length > 0 && units + sectionUnits > maxUnits) {
      pages.push(current);
      current = [];
      units = 0;
    }
    current.push(section);
    units += sectionUnits;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
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
  const sectionsWithEvents: Section[] = secciones.map((sec) => ({
    ...sec,
    events: getEventosPorFecha(allEvents, sec.key),
  }));
  const pagedSections = paginateSections(sectionsWithEvents, 14);
  const hasProvisional = allEvents.some((f) => f.provisional);

  return (
    <BookPageLayout
      title="Noche"
      kicker="Verbenas y música"
      page="02"
      accent="#345DB8"
      pages={
        loading
          ? [
              <div key="loading" className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#8c7259]/60" />
              </div>,
            ]
          : secciones.length === 0
          ? [<p key="empty" className="py-4 text-[12px] italic text-[#8c7259]/75">Sin próximas noches con eventos</p>]
          : pagedSections.map((pageSections, pageIndex) => (
              <React.Fragment key={pageIndex}>
                {pageSections.map((sec) => (
                  <div key={sec.key}>
                    <div className="border-b border-[#9a8366]/24 py-3">
                      <p className="mb-0.5 text-[7px] uppercase tracking-[0.26em] text-[#345DB8]/75">
                        {sec.date.toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: MADRID_TZ })}
                      </p>
                      <p className="font-serif text-[1.05rem] font-semibold leading-snug text-[#3a2418]">
                        {sec.label}
                      </p>
                    </div>
                    <ul className="mb-1">
                      {sec.events.map((ev) => {
                        const d = new Date(ev.startsAt!);
                        return (
                          <li key={ev.id} className="flex gap-3 border-b border-[#9a8366]/15 py-2.5 last:border-0">
                            <span className="w-10 shrink-0 pt-px font-serif text-[13px] tabular-nums text-[#345DB8]/85">
                              {formatHHMMMadrid(d)}
                            </span>
                            <span className="text-[13px] leading-snug text-[#3a2418]">
                              {ev.title}
                              {ev.location && (
                                <span className="text-[#8c7259]/85"> · {ev.location}</span>
                              )}
                              {ev.provisional && (
                                <span className="text-[#8c7259]/80"> *</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {pageIndex === pagedSections.length - 1 && hasProvisional && (
                  <p className="mt-6 text-[10px] italic text-[#8c7259]/75">
                    * La hora es provisional y puede variar.
                  </p>
                )}
              </React.Fragment>
            ))
      }
    >
      <div />
    </BookPageLayout>
  );
}
