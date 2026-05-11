/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState, forwardRef } from "react";
import { initGA, trackEvent } from "@/lib/analytics";

// ── Constants ──────────────────────────────────────────────────────────────

const MADRID_TZ = "Europe/Madrid";

const PORTADA_YEARS = [
  1976, 1977, 1978, 1979, 1980, 1981, 1982, 1984, 1985, 1986, 1988, 1989,
  1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
  2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2022, 2023, 2024,
];

// Page 0: cover · 1: welcome · 2: index
// 3-4: Próximas · 5-6: Noche · 7-8: Peques · 9-10: Todas · 11-12: Historia
// 13: back cover
const SECTIONS = [
  { label: "Próximas", kicker: "Lo que viene",     pageNum: "01", accent: "#B6423C", flipTo: 3 },
  { label: "Noche",    kicker: "Verbenas y música", pageNum: "02", accent: "#123D70", flipTo: 5 },
  { label: "Peques",   kicker: "Familia",           pageNum: "03", accent: "#5F7C55", flipTo: 7 },
  { label: "Todas",    kicker: "Programa completo", pageNum: "04", accent: "#8D623A", flipTo: 9 },
  { label: "Historia", kicker: "Libros desde 1976", pageNum: "05", accent: "#704126", flipTo: 11 },
];

// ── Types ──────────────────────────────────────────────────────────────────

type ApiEvent = {
  id: number;
  title: string;
  provisional?: boolean;
  location?: string;
  tags?: string[];
  startsAt?: string;
};

type DayGroup = { key: string; label: string; events: ApiEvent[] };

// ── Date helpers ───────────────────────────────────────────────────────────

function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function formatHHMM(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function formatDayLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ, weekday: "long", day: "numeric", month: "long",
  }).format(date);
  return s.replace(", ", " ").replace(/^./, (c) => c.toUpperCase());
}

function groupByDay(events: ApiEvent[], filter?: (e: ApiEvent) => boolean): DayGroup[] {
  const todayKey = dateKeyMadrid(new Date());
  const filtered = events.filter(
    (e) => e.startsAt && dateKeyMadrid(new Date(e.startsAt)) >= todayKey && (!filter || filter(e))
  );
  const map = new Map<string, { label: string; events: ApiEvent[] }>();
  for (const e of filtered) {
    const key = dateKeyMadrid(new Date(e.startsAt!));
    if (!map.has(key)) map.set(key, { label: formatDayLong(new Date(e.startsAt!)), events: [] });
    map.get(key)!.events.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, events: evs }]) => ({
      key, label,
      events: evs.sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime()),
    }));
}

// ── Page component — direct child of FlipBook must be forwardRef ───────────

const Page = forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className = "" }, ref) => (
    <div ref={ref} className={className}>{children}</div>
  )
);
Page.displayName = "Page";

// ── Shared content component (NOT a FlipBook child) ───────────────────────

function EventList({ days, accent, loading }: { days: DayGroup[]; accent: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center pt-8">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#8d6638]/50" />
      </div>
    );
  }
  if (days.length === 0) {
    return <p className="pt-4 text-[11px] italic text-[#8d6638]/55">Sin próximos eventos</p>;
  }
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.key}>
          <p className="font-serif text-[0.78rem] font-semibold text-[#1a120a] border-b border-[#8d6638]/15 pb-0.5 mb-1.5">
            {day.label}
          </p>
          <ul className="space-y-1">
            {day.events.map((ev) => (
              <li key={ev.id} className="flex gap-2 text-[11px] leading-snug">
                <span className="tabular-nums shrink-0 font-serif" style={{ color: accent, opacity: 0.85 }}>
                  {formatHHMM(new Date(ev.startsAt!))}
                </span>
                <span className="text-[#2a1f0e]">
                  {ev.title}
                  {ev.location && <span className="text-[#8d6638]/50"> · {ev.location}</span>}
                  {ev.provisional && <span className="text-[#8d6638]/45"> *</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Home2Page() {
  const [FlipBook, setFlipBook] = useState<React.ComponentType<any> | null>(null);
  const bookRef = useRef<any>(null);
  const [dims, setDims] = useState({ w: 360, h: 510, portrait: false });
  const [isOpen, setIsOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const lastFlip = useRef(0);
  const [coverYear] = useState(
    () => PORTADA_YEARS[Math.floor(Math.random() * PORTADA_YEARS.length)]
  );
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((json) => {
        setAllEvents(Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : []);
        setEventsLoading(false);
      })
      .catch(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    initGA();
    trackEvent("page_view");
    const t = Date.now();
    return () => trackEvent("time_on_page", { seconds: (Date.now() - t) / 1000 });
  }, []);

  useEffect(() => {
    import("react-pageflip").then((mod) => {
      setFlipBook(() => mod.default as unknown as React.ComponentType<any>);
    });
  }, []);

  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const portrait = vw < 640;
      if (portrait) {
        const w = Math.min(Math.floor(vw * 0.88), 420);
        const h = Math.min(Math.floor(w * 1.48), Math.floor(vh * 0.82));
        setDims({ w, h, portrait: true });
      } else {
        const bookW = Math.min(vw * 0.92, 900);
        const pageW = Math.floor(bookW / 2);
        const pageH = Math.floor(Math.min(pageW * 1.44, vh * 0.82, 640));
        setDims({ w: pageW, h: pageH, portrait: false });
      }
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  function flipTo(n: number) {
    const now = Date.now();
    if (now - lastFlip.current < 500) return;
    lastFlip.current = now;
    const pf = bookRef.current?.pageFlip?.();
    if (!pf) return;
    setTargetOpen(n > 0);
    pf.flip(n);
  }

  useEffect(() => {
    let touchY = 0;
    function tryFlip(dir: "next" | "prev") {
      const now = Date.now();
      if (now - lastFlip.current < 850) return;
      lastFlip.current = now;
      const pf = bookRef.current?.pageFlip?.();
      if (!pf) return;
      setTargetOpen(dir === "next");
      if (dir === "next") pf.flipNext(); else pf.flipPrev();
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY > 8) tryFlip("next");
      else if (e.deltaY < -8) tryFlip("prev");
    }
    function onTouchStart(e: TouchEvent) { touchY = e.touches[0]?.clientY ?? 0; }
    function onTouchEnd(e: TouchEvent) {
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      if (dy > 40) tryFlip("next"); else if (dy < -40) tryFlip("prev");
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const proximas = groupByDay(allEvents).slice(0, 5);
  const noche    = groupByDay(allEvents, (e) => e.tags?.includes("noche") ?? false);
  const peques   = groupByDay(allEvents, (e) => (e.tags?.includes("familia") || e.tags?.includes("todos los públicos")) ?? false);
  const todas    = groupByDay(allEvents);
  const hasProvisional = allEvents.some((f) => f.provisional);

  const portadaSrc = encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${coverYear}.png`);
  const bookOffset = dims.portrait ? 0 : targetOpen ? 0 : -dims.w / 2;

  // Shared styles
  const leftSpine  = "absolute inset-y-0 right-0 w-px bg-[#c8a96e]/30";
  const rightSpine = "absolute inset-y-0 left-0 w-px bg-[#c8a96e]/30";

  return (
    <main className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0f0b07]">
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,120,60,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(80,40,15,0.18) 0%, transparent 60%)",
      }} />

      <p className="pointer-events-none absolute top-5 z-20 text-center text-[#c8a96e]/70 transition-opacity duration-700"
        style={{ opacity: isOpen ? 0 : 1 }}>
        <span className="text-[9px] uppercase tracking-[0.32em]">Desliza para abrir</span>
      </p>

      <div className="relative z-10" style={{ opacity: FlipBook ? 1 : 0, transition: "opacity 0.4s" }}>
        <div style={{ transform: `translateX(${bookOffset}px)`, transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          {FlipBook && (
            <FlipBook
              key={dims.portrait ? "portrait" : "landscape"}
              ref={bookRef}
              width={dims.w} height={dims.h}
              size="fixed"
              minWidth={dims.w} maxWidth={dims.w}
              minHeight={dims.h} maxHeight={dims.h}
              showCover={true}
              drawShadow={true}
              flippingTime={900}
              usePortrait={dims.portrait}
              startPage={0}
              mobileScrollSupport={false}
              clickEventForward={false}
              useMouseEvents={false}
              onFlip={(e: { data: number }) => {
                const open = e.data > 0;
                setIsOpen(open);
                setTargetOpen(open);
                trackEvent("page_flip", { page: e.data });
              }}
            >
              {/* ── 0: Portada ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#1a0c05]">
                <Image src={portadaSrc} alt={`Libro de Fiestas de Matet ${coverYear}`}
                  fill priority sizes="480px" className="object-cover opacity-90" unoptimized />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,4,1,0.35)_0%,rgba(10,4,1,0.0)_35%,rgba(10,4,1,0.0)_55%,rgba(10,4,1,0.65)_100%)]" />
                <div className="absolute inset-y-0 left-0 w-[15%] bg-[linear-gradient(90deg,rgba(8,3,1,0.7),transparent)]" />
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-[0.28em] text-[#f0dba8]/60">{coverYear}</span>
                  <span className="text-[8px] uppercase tracking-[0.28em] text-[#f0dba8]/60">Matet</span>
                </div>
                <div className="absolute bottom-6 left-5 right-5">
                  <p className="font-serif font-black leading-none text-[#fff4e0]"
                    style={{ fontSize: `clamp(2.4rem,${dims.w * 0.15}px,5rem)` }}>
                    Fiestas
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[#f0dba8]/75 tracking-wide">
                    Programa oficial · 2026
                  </p>
                </div>
              </Page>

              {/* ── 1: Bienvenida ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-9 text-[#2a1f0e]">
                  <div>
                    <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                      <span className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/70">Fiestas de Matet</span>
                      <span className="font-serif text-base text-[#8d6638]/80">2026</span>
                    </div>
                    <p className="mt-8 font-serif leading-[0.88] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(1.6rem,${dims.w * 0.115}px,3.6rem)` }}>
                      Como el libro de casa.
                    </p>
                    <p className="mt-5 text-[12px] leading-[1.75] text-[#5a4124]/80 max-w-[26ch]">
                      El programa de las fiestas, organizado como las páginas del libro que llevan en el pueblo desde 1976.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-[9px] uppercase tracking-[0.2em] text-[#8d6638]/60">
                    {["Programa", "Comisión", "Pueblo", "Recuerdos"].map((w) => (
                      <span key={w} className="border-t border-[#8d6638]/18 py-2">{w}</span>
                    ))}
                  </div>
                </div>
              </Page>

              {/* ── 2: Índice ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-6 sm:p-9 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <span className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/70">Secciones</span>
                    <span className="font-serif text-base text-[#8d6638]/80">Índice</span>
                  </div>
                  <nav className="mt-3 flex flex-1 flex-col justify-between">
                    {SECTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={(e) => { e.stopPropagation(); flipTo(s.flipTo); }}
                        className="group flex w-full items-center justify-between border-b border-[#8d6638]/18 py-[0.55rem] transition-colors hover:border-[#8d6638]/50 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 font-serif text-lg leading-none tabular-nums opacity-70"
                            style={{ color: s.accent }}>{s.pageNum}</span>
                          <div>
                            <span className="block text-[7px] uppercase tracking-[0.22em] text-[#8d6638]/55">{s.kicker}</span>
                            <span className="font-serif font-semibold leading-tight text-[#1a120a]"
                              style={{ fontSize: `clamp(1.1rem,${dims.w * 0.075}px,2rem)` }}>{s.label}</span>
                          </div>
                        </div>
                        <span className="text-[#8d6638]/40 transition-transform group-hover:translate-x-0.5 text-xs">↗</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </Page>

              {/* ── 3: Próximas — cabecera ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <button onClick={(e) => { e.stopPropagation(); flipTo(2); }}
                      className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/55 hover:text-[#8d6638]/80 transition-colors">
                      ← Índice
                    </button>
                    <span className="font-serif text-base" style={{ color: "#B6423C" }}>01</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-[#B6423C]/70">Lo que viene</p>
                    <p className="mt-2 font-serif font-black leading-[0.9] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(2.2rem,${dims.w * 0.17}px,4.5rem)` }}>
                      Próximas
                    </p>
                    <p className="mt-4 text-[11px] leading-relaxed text-[#5a4124]/65 max-w-[22ch]">
                      Los próximos actos de las fiestas de Matet, ordenados por día.
                    </p>
                  </div>
                  <p className="text-[7px] uppercase tracking-[0.24em] text-[#8d6638]/35 border-t border-[#8d6638]/15 pt-3">
                    Fiestas de Matet · 2026
                  </p>
                </div>
              </Page>

              {/* ── 4: Próximas — eventos ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-5 sm:p-7 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-2 mb-3 shrink-0">
                    <span className="text-[7px] uppercase tracking-[0.26em] text-[#8d6638]/60">Programa</span>
                    <span className="font-serif text-sm" style={{ color: "#B6423C", opacity: 0.65 }}>01</span>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                    <EventList days={proximas} accent="#B6423C" loading={eventsLoading} />
                  </div>
                  {hasProvisional && <p className="mt-2 text-[8px] italic text-[#8d6638]/40 shrink-0">* Hora provisional</p>}
                </div>
              </Page>

              {/* ── 5: Noche — cabecera ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <button onClick={(e) => { e.stopPropagation(); flipTo(2); }}
                      className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/55 hover:text-[#8d6638]/80 transition-colors">
                      ← Índice
                    </button>
                    <span className="font-serif text-base" style={{ color: "#123D70" }}>02</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-[#123D70]/70">Verbenas y música</p>
                    <p className="mt-2 font-serif font-black leading-[0.9] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(2.2rem,${dims.w * 0.17}px,4.5rem)` }}>
                      Noche
                    </p>
                    <p className="mt-4 text-[11px] leading-relaxed text-[#5a4124]/65 max-w-[22ch]">
                      Verbenas, conciertos y la noche de fiesta en Matet.
                    </p>
                  </div>
                  <p className="text-[7px] uppercase tracking-[0.24em] text-[#8d6638]/35 border-t border-[#8d6638]/15 pt-3">
                    Fiestas de Matet · 2026
                  </p>
                </div>
              </Page>

              {/* ── 6: Noche — eventos ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-5 sm:p-7 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-2 mb-3 shrink-0">
                    <span className="text-[7px] uppercase tracking-[0.26em] text-[#8d6638]/60">Verbenas</span>
                    <span className="font-serif text-sm" style={{ color: "#123D70", opacity: 0.65 }}>02</span>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                    <EventList days={noche} accent="#123D70" loading={eventsLoading} />
                  </div>
                  {hasProvisional && <p className="mt-2 text-[8px] italic text-[#8d6638]/40 shrink-0">* Hora provisional</p>}
                </div>
              </Page>

              {/* ── 7: Peques — cabecera ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <button onClick={(e) => { e.stopPropagation(); flipTo(2); }}
                      className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/55 hover:text-[#8d6638]/80 transition-colors">
                      ← Índice
                    </button>
                    <span className="font-serif text-base" style={{ color: "#5F7C55" }}>03</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-[#5F7C55]/70">Familia</p>
                    <p className="mt-2 font-serif font-black leading-[0.9] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(2.2rem,${dims.w * 0.17}px,4.5rem)` }}>
                      Peques
                    </p>
                    <p className="mt-4 text-[11px] leading-relaxed text-[#5a4124]/65 max-w-[22ch]">
                      Actividades y actos para los más pequeños y la familia.
                    </p>
                  </div>
                  <p className="text-[7px] uppercase tracking-[0.24em] text-[#8d6638]/35 border-t border-[#8d6638]/15 pt-3">
                    Fiestas de Matet · 2026
                  </p>
                </div>
              </Page>

              {/* ── 8: Peques — eventos ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-5 sm:p-7 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-2 mb-3 shrink-0">
                    <span className="text-[7px] uppercase tracking-[0.26em] text-[#8d6638]/60">Familia</span>
                    <span className="font-serif text-sm" style={{ color: "#5F7C55", opacity: 0.65 }}>03</span>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                    <EventList days={peques} accent="#5F7C55" loading={eventsLoading} />
                  </div>
                  {hasProvisional && <p className="mt-2 text-[8px] italic text-[#8d6638]/40 shrink-0">* Hora provisional</p>}
                </div>
              </Page>

              {/* ── 9: Todas — cabecera ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <button onClick={(e) => { e.stopPropagation(); flipTo(2); }}
                      className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/55 hover:text-[#8d6638]/80 transition-colors">
                      ← Índice
                    </button>
                    <span className="font-serif text-base" style={{ color: "#8D623A" }}>04</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-[#8D623A]/70">Programa completo</p>
                    <p className="mt-2 font-serif font-black leading-[0.9] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(2.2rem,${dims.w * 0.17}px,4.5rem)` }}>
                      Todas
                    </p>
                    <p className="mt-4 text-[11px] leading-relaxed text-[#5a4124]/65 max-w-[22ch]">
                      El programa completo de los actos de las fiestas de Matet 2026.
                    </p>
                  </div>
                  <p className="text-[7px] uppercase tracking-[0.24em] text-[#8d6638]/35 border-t border-[#8d6638]/15 pt-3">
                    Fiestas de Matet · 2026
                  </p>
                </div>
              </Page>

              {/* ── 10: Todas — eventos ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-5 sm:p-7 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-2 mb-3 shrink-0">
                    <span className="text-[7px] uppercase tracking-[0.26em] text-[#8d6638]/60">Programa completo</span>
                    <span className="font-serif text-sm" style={{ color: "#8D623A", opacity: 0.65 }}>04</span>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                    <EventList days={todas} accent="#8D623A" loading={eventsLoading} />
                  </div>
                  {hasProvisional && <p className="mt-2 text-[8px] italic text-[#8d6638]/40 shrink-0">* Hora provisional</p>}
                </div>
              </Page>

              {/* ── 11: Historia — cabecera ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#faf3e4]">
                <div className={leftSpine} />
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-3">
                    <button onClick={(e) => { e.stopPropagation(); flipTo(2); }}
                      className="text-[8px] uppercase tracking-[0.26em] text-[#8d6638]/55 hover:text-[#8d6638]/80 transition-colors">
                      ← Índice
                    </button>
                    <span className="font-serif text-base" style={{ color: "#704126" }}>05</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-[#704126]/70">Libros desde 1976</p>
                    <p className="mt-2 font-serif font-black leading-[0.9] tracking-tight text-[#1a120a]"
                      style={{ fontSize: `clamp(2.2rem,${dims.w * 0.17}px,4.5rem)` }}>
                      Historia
                    </p>
                    <p className="mt-4 text-[11px] leading-relaxed text-[#5a4124]/65 max-w-[22ch]">
                      Las portadas de los libros de fiestas desde 1976 hasta hoy.
                    </p>
                  </div>
                  <p className="text-[7px] uppercase tracking-[0.24em] text-[#8d6638]/35 border-t border-[#8d6638]/15 pt-3">
                    Fiestas de Matet · 2026
                  </p>
                </div>
              </Page>

              {/* ── 12: Historia — portadas ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#fdf8ef]">
                <div className={rightSpine} />
                <div className="flex h-full flex-col p-4 sm:p-6 text-[#2a1f0e]">
                  <div className="flex items-baseline justify-between border-b border-[#8d6638]/25 pb-2 mb-3 shrink-0">
                    <span className="text-[7px] uppercase tracking-[0.26em] text-[#8d6638]/60">Portadas · 1976–2024</span>
                    <span className="font-serif text-sm" style={{ color: "#704126", opacity: 0.65 }}>05</span>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                    <div className="grid grid-cols-4 gap-1.5 pb-2">
                      {PORTADA_YEARS.map((year) => (
                        <div key={year} className="relative aspect-[2/3] overflow-hidden rounded-[2px] border border-[#c8a96e]/20">
                          <Image
                            src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${year}.png`)}
                            alt={`Portada ${year}`}
                            fill className="object-cover" sizes="80px" unoptimized
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(8,4,1,0.78)_100%)]" />
                          <span className="absolute bottom-0.5 left-0 right-0 text-center font-serif text-[7px] text-[#f0dba8]/85">
                            {year}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Page>

              {/* ── 13: Contraportada ── */}
              <Page className="relative h-full w-full overflow-hidden bg-[#180d05]">
                <div className="absolute inset-[6%] rounded-sm border border-[#c8a96e]/12" />
                <div className="absolute inset-[8%] rounded-sm border border-[#c8a96e]/7" />
                <div className="absolute inset-0 flex items-end justify-center pb-[12%]">
                  <p className="font-serif text-[#c8a96e]/30 text-[9px] uppercase tracking-[0.36em]">
                    Matet · Castellón · 2026
                  </p>
                </div>
              </Page>
            </FlipBook>
          )}
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-3 z-20 w-[min(92vw,560px)] text-center text-[8px] leading-4 text-[#c8a96e]/35 transition-opacity duration-700"
        style={{ opacity: isOpen ? 1 : 0 }}>
        Portada {coverYear} · Archivo Fiestas de Matet
      </p>
    </main>
  );
}
