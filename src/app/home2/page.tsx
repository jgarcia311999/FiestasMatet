"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { initGA, trackEvent } from "@/lib/analytics";

const MADRID_TZ = "Europe/Madrid";

const CHAPTERS = [
  {
    id: "proximas",
    chapter: "CAP.01",
    title: "Lo que viene",
    href: "/proximas",
    accent: "#A61F24",
    coverYear: 1998,
    description: "Una lectura rápida de los próximos días para saber qué toca y cuándo moverse.",
  },
  {
    id: "noche",
    chapter: "CAP.02",
    title: "Noches de plaza",
    href: "/noche",
    accent: "#F0EAD6",
    coverYear: 2013,
    description: "Verbenas, discomóviles y ese tramo en el que el pueblo cambia de ritmo.",
  },
  {
    id: "peques",
    chapter: "CAP.03",
    title: "Familia y peques",
    href: "/peques",
    accent: "#A61F24",
    coverYear: 2022,
    description: "Actos abiertos, juegos, pasacalles y tiempo de fiesta para todas las edades.",
  },
  {
    id: "todas",
    chapter: "CAP.04",
    title: "Programa completo",
    href: "/todas",
    accent: "#F0EAD6",
    coverYear: 2024,
    description: "La visión completa del calendario, sin perderse ningún tramo del programa.",
  },
];

type ApiEvent = {
  id: number;
  title: string;
  provisional?: boolean;
  location?: string;
  tags?: string[];
  startsAt?: string;
};

function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatHour(dateString: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

function formatDayLabel(dateString: string) {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateString));
  return formatted.replace(", ", " ").replace(/^./, (v) => v.toUpperCase());
}

function pickUpcoming(events: ApiEvent[], count: number, filter?: (e: ApiEvent) => boolean) {
  const today = dateKeyMadrid(new Date());
  const filtered = events
    .filter((e) => e.startsAt && (!filter || filter(e)))
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const future = filtered.filter((e) => dateKeyMadrid(new Date(e.startsAt!)) >= today);
  const base = future.length > 0 ? future : filtered;
  return base.slice(0, count);
}

function isFamilyTag(e: ApiEvent) {
  return (
    e.tags?.includes("familia") ||
    e.tags?.includes("todos los públicos") ||
    e.tags?.includes("todos los publicos") ||
    false
  );
}

export default function Home2Page() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initGA();
    trackEvent("page_view");
    const startedAt = Date.now();
    return () => trackEvent("time_on_page", { seconds: (Date.now() - startedAt) / 1000 });
  }, []);

  // Scroll-triggered reveal for static elements
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]:not(.revealed)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((json) => {
        const nextEvents: ApiEvent[] = Array.isArray(json?.events)
          ? json.events
          : Array.isArray(json)
          ? json
          : [];
        setEvents(nextEvents);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  }, []);

  const chapterPreviews = useMemo(
    () => ({
      proximas: pickUpcoming(events, 3),
      noche: pickUpcoming(events, 3, (e) => e.tags?.includes("noche") ?? false),
      peques: pickUpcoming(events, 3, isFamilyTag),
      todas: pickUpcoming(events, 4),
    }),
    [events]
  );

  return (
    <main className="min-h-[100svh] bg-[#F0EAD6] text-[#1B4332]">

      {/* MARQUEE HEADER — himno de Matet */}
      <header className="sticky top-0 z-30 bg-[#F0EAD6] border-b-2 border-[#1B4332] overflow-hidden">
        <div className="py-[10px] overflow-hidden">
          <div className="marquee-inner">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                className="text-[10px] uppercase font-medium"
                style={{ letterSpacing: "0.32em", paddingRight: "6rem" }}
              >
                MATETANOS CANTEMOS GOZOSOS&nbsp;&nbsp;·&nbsp;&nbsp;LAS GLORIAS DEL PUEBLO, QUE SON NUESTRO HONOR&nbsp;&nbsp;·&nbsp;&nbsp;Y COMO HIJOS ASAZ GENEROSOS&nbsp;&nbsp;·&nbsp;&nbsp;LE HAGAMOS OFRENDA DEL MÁS GRATO AMOR&nbsp;&nbsp;·&nbsp;&nbsp;NUESTRO SANTO LEMA SEA REPETIR: ¡VIVA, VIVA MATET, QUE ES MI PUEBLO, DONDE YO HE NACIDO Y QUIERO MORIR!&nbsp;&nbsp;·&nbsp;&nbsp;TU FE RECIA, CONSTANTE Y BRAVÍA&nbsp;&nbsp;·&nbsp;&nbsp;DEL CIELO TE TRAJO FAVOR SIN IGUAL&nbsp;&nbsp;·&nbsp;&nbsp;Y EL SABER Y EL TRABAJO APORFÍA&nbsp;&nbsp;·&nbsp;&nbsp;FUERON DE TU VIDA SUPREMO IDEAL&nbsp;&nbsp;·&nbsp;&nbsp;ELLOS SON TU GLORIOSA CORONA&nbsp;&nbsp;·&nbsp;&nbsp;TU MAYOR ELOGIO, TU MAYOR BLASÓN&nbsp;&nbsp;·&nbsp;&nbsp;PORQUE EN ELLOS LA FAMA PREGONEN&nbsp;&nbsp;·&nbsp;&nbsp;TU NOMBRE BENDITO QUE ES UNA ORACIÓN
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-2">
          <div className="border-b-2 border-[#1B4332] lg:border-b-0 lg:border-r-2 px-5 py-14 sm:px-8 sm:py-20 lg:py-28">
            <h1
              className="text-[5.5rem] sm:text-[9rem] lg:text-[13rem] uppercase leading-[0.82]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
              data-reveal
            >
              Fiestas<br />de<br />Matet
            </h1>
          </div>
          <div className="px-5 py-14 sm:px-8 sm:py-20 lg:py-28 flex flex-col justify-between gap-10">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.5em] text-[#1B4332]/40"
                data-reveal
                style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
              >
                Archivo visual del pueblo&nbsp;&bull;&nbsp;Desde 1976
              </p>
              <p
                className="mt-6 text-[15px] sm:text-base leading-7 max-w-sm text-[#1B4332]/80"
                data-reveal
                style={{ "--reveal-delay": "0.18s" } as React.CSSProperties}
              >
                Una portada nueva para leer las fiestas como se leen los recuerdos:
                con carteles, portadas, horas, verbenas y ese desorden bonito que
                deja el verano cuando el pueblo se pone en marcha.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-3"
              data-reveal
              style={{ "--reveal-delay": "0.26s" } as React.CSSProperties}
            >
              <a
                href="#proximas"
                className="border-2 border-[#1B4332] bg-[#1B4332] text-[#F0EAD6] px-6 py-3 text-[11px] uppercase tracking-[0.32em] font-medium hover:bg-transparent hover:text-[#1B4332] transition"
              >
                Entrar al programa
              </a>
              <Link
                href="/historia"
                className="border-2 border-[#A61F24] text-[#A61F24] px-6 py-3 text-[11px] uppercase tracking-[0.32em] font-medium hover:bg-[#A61F24] hover:text-white transition"
              >
                Ver archivo histórico
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER GRID */}
      <section className="border-b-2 border-[#1B4332]">
        <div className="bg-[#1B4332] grid grid-cols-2 lg:grid-cols-4 gap-[2px]">
          {CHAPTERS.map((ch, idx) => (
            <Link
              key={ch.id}
              href={ch.href}
              className="bg-[#A61F24] p-5 sm:p-7 hover:bg-[#8B1A1E] transition-colors flex flex-col group"
              data-reveal
              style={{ "--reveal-delay": `${idx * 0.09}s` } as React.CSSProperties}
            >
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/50">
                {ch.chapter}
              </p>
              <h2
                className="text-[2rem] sm:text-[2.8rem] lg:text-[3.5rem] uppercase leading-[0.88] text-white mt-3 flex-1"
                style={{ fontFamily: "var(--font-bebas-neue)" }}
              >
                {ch.title}
              </h2>
              <p className="text-[12px] text-white/65 mt-3 leading-5 hidden sm:block">
                {ch.description}
              </p>
              <div className="mt-5 relative aspect-[3/4] w-16 sm:w-24 overflow-hidden border border-white/20">
                <Image
                  src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${ch.coverYear}.png`)}
                  alt={`Portada ${ch.coverYear}`}
                  fill
                  className="object-cover grayscale opacity-70 group-hover:opacity-95 transition-opacity"
                  unoptimized
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CONTENT SECTIONS */}
      {CHAPTERS.map((chapter, index) => {
        const preview =
          chapter.id === "proximas"
            ? chapterPreviews.proximas
            : chapter.id === "noche"
            ? chapterPreviews.noche
            : chapter.id === "peques"
            ? chapterPreviews.peques
            : chapterPreviews.todas;

        const isDark = index % 2 !== 0;
        const bg = isDark ? "#1B4332" : "#F0EAD6";
        const fg = isDark ? "#F0EAD6" : "#1B4332";

        return (
          <section
            key={chapter.id}
            id={chapter.id}
            className="border-b-2 border-[#1B4332]"
            style={{ backgroundColor: bg, color: fg }}
          >
            <div className="grid lg:grid-cols-[1fr_1.5fr]">
              {/* Left: chapter label + title + link */}
              <div className="px-5 py-12 sm:px-8 sm:py-16 border-b-2 border-[#1B4332] lg:border-b-0 lg:border-r-2 flex flex-col justify-between">
                <div data-reveal>
                  <p
                    className="text-[10px] uppercase tracking-[0.45em]"
                    style={{ opacity: 0.38 }}
                  >
                    {chapter.chapter}
                  </p>
                  <h2
                    className="text-[3.2rem] sm:text-[4.5rem] lg:text-[5.5rem] uppercase leading-[0.86] mt-3"
                    style={{ fontFamily: "var(--font-bebas-neue)" }}
                  >
                    {chapter.title}
                  </h2>
                  <p
                    className="mt-5 text-[14px] leading-7 max-w-xs"
                    style={{ opacity: 0.6 }}
                  >
                    {chapter.description}
                  </p>
                </div>
                <Link
                  href={chapter.href}
                  className={`mt-10 self-start border-2 px-5 py-3 text-[11px] uppercase tracking-[0.32em] font-medium transition ${
                    isDark
                      ? "border-[#F0EAD6]/50 text-[#F0EAD6] hover:bg-[#F0EAD6] hover:text-[#1B4332]"
                      : "border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-[#F0EAD6]"
                  }`}
                  data-reveal
                  style={{ "--reveal-delay": "0.12s" } as React.CSSProperties}
                >
                  Abrir sección →
                </Link>
              </div>

              {/* Right: events list */}
              <div className="px-5 py-12 sm:px-8 sm:py-16">
                <p
                  className="text-[10px] uppercase tracking-[0.45em] mb-8"
                  style={{ opacity: 0.38 }}
                >
                  Próximos actos
                </p>
                {loading ? (
                  <div className="flex items-center py-8">
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-b-2"
                      style={{ borderColor: fg }}
                    />
                  </div>
                ) : preview.length === 0 ? (
                  <p className="text-sm" style={{ opacity: 0.45 }}>
                    Todavía no hay eventos en este bloque.
                  </p>
                ) : (
                  <div>
                    {preview.map((event, i) => (
                      <div
                        key={event.id}
                        className="animate-in py-5 grid sm:grid-cols-[6.5rem_1fr] gap-4"
                        style={{
                          borderBottom:
                            i < preview.length - 1
                              ? `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"}`
                              : "none",
                          "--reveal-delay": `${i * 0.07}s`,
                        } as React.CSSProperties}
                      >
                        <div>
                          {event.startsAt && (
                            <>
                              <p
                                className="text-[10px] uppercase tracking-[0.3em]"
                                style={{ opacity: 0.4 }}
                              >
                                {formatDayLabel(event.startsAt)
                                  .split(" ")
                                  .slice(0, 2)
                                  .join(" ")}
                              </p>
                              <p
                                className="mt-2 text-4xl leading-none"
                                style={{
                                  fontFamily: "var(--font-bebas-neue)",
                                  color: chapter.accent,
                                }}
                              >
                                {formatHour(event.startsAt)}
                              </p>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-semibold leading-tight">
                            {event.title}
                          </p>
                          {event.location && (
                            <p
                              className="mt-1.5 text-[13px]"
                              style={{ opacity: 0.5 }}
                            >
                              {event.location}
                            </p>
                          )}
                          {event.provisional && (
                            <p
                              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
                              style={{ opacity: 0.38 }}
                            >
                              Provisional
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* HISTORIA / ARCHIVO */}
      <section className="bg-[#A61F24] border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-2">
          <div className="px-5 py-16 sm:px-8 sm:py-24 border-b-2 border-[#1B4332] lg:border-b-0 lg:border-r-2" data-reveal>
            <p className="text-[10px] uppercase tracking-[0.45em] text-white/45">
              Aspecto&nbsp;&bull;&nbsp;Archivo
            </p>
            <h2
              className="text-[3.8rem] sm:text-[6rem] lg:text-[8rem] uppercase leading-[0.86] text-white mt-4"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Historia del pueblo
            </h2>
          </div>
          <div
            className="px-5 py-16 sm:px-8 sm:py-24 flex flex-col justify-between"
            data-reveal
            style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
          >
            <p className="text-[15px] leading-7 text-white/75 max-w-sm">
              Portadas, carteles y programas desde 1976. Un archivo visual de
              cómo el pueblo ha vivido sus fiestas a lo largo de los años.
            </p>
            <div className="mt-8 flex gap-3">
              {[2004, 2013, 2024].map((year, i) => (
                <div
                  key={year}
                  className="animate-in relative aspect-[3/4] w-20 overflow-hidden border border-white/20"
                  style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
                >
                  <Image
                    src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${year}.png`)}
                    alt={`Portada ${year}`}
                    fill
                    className="object-cover grayscale opacity-75"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <Link
              href="/historia"
              className="mt-10 self-start border-2 border-white text-white px-6 py-3 text-[11px] uppercase tracking-[0.32em] font-medium hover:bg-white hover:text-[#A61F24] transition"
            >
              Ver archivo →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
