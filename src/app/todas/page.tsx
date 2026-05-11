"use client";

import React from "react";
import { useState, useEffect } from "react";
import BookPageLayout from "@/components/BookPageLayout";

type Event = {
  id: number;
  title: string;
  provisional?: boolean;
  location?: string;
  date?: string;
  time?: string;
};

type Day = {
  key: string;
  label: string;
  items: { id: number; time: string; title: string; provisional: boolean; location: string }[];
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

function paginateDays(days: Day[], maxUnits: number): Day[][] {
  const pages: Day[][] = [];
  let current: Day[] = [];
  let units = 0;

  for (const day of days) {
    const dayUnits = 3 + day.items.length * 2;
    if (current.length > 0 && units + dayUnits > maxUnits) {
      pages.push(current);
      current = [];
      units = 0;
    }
    current.push(day);
    units += dayUnits;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
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

  const days: Day[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, items }]) => {
      sortNightLast(items);
      return { key, label, items };
    });
  const pagedDays = paginateDays(days, 14);
  const hasProvisional = rows.some((f) => f.provisional);

  return (
    <BookPageLayout
      title="Todas"
      kicker="Programa completo"
      page="04"
      accent="#A61F24"
      pages={
        loading
          ? [
              <div key="loading" className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#8c7259]/60" />
              </div>,
            ]
          : days.length === 0
          ? [<p key="empty" className="py-4 text-[12px] italic text-[#8c7259]/75">Sin fiestas</p>]
          : pagedDays.map((pageDays, pageIndex) => (
              <React.Fragment key={pageIndex}>
                {pageIndex === 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPast((v) => !v)}
                      className="text-[9px] uppercase tracking-[0.22em] text-[#8c7259] transition-colors hover:text-[#6f5944]"
                    >
                      {showPast ? "Ocultar anteriores" : "Ver anteriores"}
                    </button>
                  </div>
                )}
                {pageDays.map((day) => (
                  <div key={day.key}>
                    <div className="border-b border-[#9a8366]/24 py-3">
                      <p className="font-serif text-[1.05rem] font-semibold leading-snug text-[#3a2418]">
                        {day.label}
                      </p>
                    </div>
                    <ul className="mb-1">
                      {day.items.map((ev) => (
                        <li key={ev.id} className="flex gap-3 border-b border-[#9a8366]/15 py-2.5 last:border-0">
                          <span className="w-10 shrink-0 pt-px font-serif text-[13px] tabular-nums text-[#345DB8]/82">
                            {ev.time}
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
                      ))}
                    </ul>
                  </div>
                ))}
                {pageIndex === pagedDays.length - 1 && hasProvisional && (
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
