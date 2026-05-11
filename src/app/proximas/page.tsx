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
  const sectionsWithEvents: Section[] = secciones.map((sec) => ({
    ...sec,
    events: getEventosPorFecha(allEvents, sec.key),
  }));
  const pagedSections = paginateSections(sectionsWithEvents, 14);
  const hasProvisional = allEvents.some((f) => f.provisional);

  return (
    <BookPageLayout
      title="Próximas"
      kicker="Lo que viene"
      page="01"
      accent="#A61F24"
      pages={
        loading
          ? [
              <div key="loading" className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#8c7259]/60" />
              </div>,
            ]
          : secciones.length === 0
          ? [<p key="empty" className="py-4 text-[12px] italic text-[#8c7259]/75">Sin próximas fiestas</p>]
          : pagedSections.map((pageSections, pageIndex) => (
              <React.Fragment key={pageIndex}>
                {pageSections.map((sec) => (
                  <div key={sec.key}>
                    <div className="border-b border-[#9a8366]/24 py-3">
                      <p className="mb-0.5 text-[7px] uppercase tracking-[0.26em] text-[#A61F24]/72">
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
                            <span className="w-10 shrink-0 pt-px font-serif text-[13px] tabular-nums text-[#A61F24]/82">
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
                {pageIndex === pagedSections.length - 1 && secciones.length > 0 && secciones.length < 5 && (
                  <p className="mt-4 text-[11px] italic text-[#8c7259]/80">Próximamente más eventos</p>
                )}
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
