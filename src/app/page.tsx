"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { initGA, trackEvent } from "@/lib/analytics";

const MADRID_TZ = "Europe/Madrid";

const CHAPTERS = [
  {
    id: "proximas",
    title: "Lo que viene",
    href: "/proximas",
    accent: "#F0EAD6",
    cardBg: "#1B4332",
    cardHover: "#295941",
    cardFg: "#F0EAD6",
    coverYear: 1998,
    description: "Una lectura rápida de los próximos días para saber qué toca y cuándo moverse.",
  },
  {
    id: "noche",
    title: "Noches de plaza",
    href: "/noche",
    accent: "#1B4332",
    cardBg: "#E5DDC4",
    cardHover: "#DDD2B1",
    cardFg: "#1B4332",
    coverYear: 2013,
    description: "Verbenas, discomóviles y ese tramo en el que el pueblo cambia de ritmo.",
  },
  {
    id: "peques",
    title: "Familia y peques",
    href: "/peques",
    accent: "#F0EAD6",
    cardBg: "#1B4332",
    cardHover: "#295941",
    cardFg: "#F0EAD6",
    coverYear: 2022,
    description: "Actos abiertos, juegos, pasacalles y tiempo de fiesta para todas las edades.",
  },
  {
    id: "todas",
    title: "Programa completo",
    href: "/todas",
    accent: "#1B4332",
    cardBg: "#E5DDC4",
    cardHover: "#DDD2B1",
    cardFg: "#1B4332",
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

export default function Home() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initGA();
    trackEvent("page_view");
    const startedAt = Date.now();
    return () => trackEvent("time_on_page", { seconds: (Date.now() - startedAt) / 1000 });
  }, []);

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
      <header className="sticky top-0 z-30 overflow-hidden border-b-2 border-[#1B4332] bg-[#F0EAD6]">
        <div className="overflow-hidden py-[10px]">
          <div className="marquee-inner">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                className="text-[10px] font-medium uppercase"
                style={{ letterSpacing: "0.32em", paddingRight: "6rem" }}
              >
                MATETANOS CANTEMOS GOZOSOS&nbsp;&nbsp;·&nbsp;&nbsp;LAS GLORIAS DEL PUEBLO, QUE SON NUESTRO HONOR&nbsp;&nbsp;·&nbsp;&nbsp;Y COMO HIJOS ASAZ GENEROSOS&nbsp;&nbsp;·&nbsp;&nbsp;LE HAGAMOS OFRENDA DEL MÁS GRATO AMOR&nbsp;&nbsp;·&nbsp;&nbsp;NUESTRO SANTO LEMA SEA REPETIR: ¡VIVA, VIVA MATET, QUE ES MI PUEBLO, DONDE YO HE NACIDO Y QUIERO MORIR!&nbsp;&nbsp;·&nbsp;&nbsp;TU FE RECIA, CONSTANTE Y BRAVÍA&nbsp;&nbsp;·&nbsp;&nbsp;DEL CIELO TE TRAJO FAVOR SIN IGUAL&nbsp;&nbsp;·&nbsp;&nbsp;Y EL SABER Y EL TRABAJO APORFÍA&nbsp;&nbsp;·&nbsp;&nbsp;FUERON DE TU VIDA SUPREMO IDEAL&nbsp;&nbsp;·&nbsp;&nbsp;ELLOS SON TU GLORIOSA CORONA&nbsp;&nbsp;·&nbsp;&nbsp;TU MAYOR ELOGIO, TU MAYOR BLASÓN&nbsp;&nbsp;·&nbsp;&nbsp;PORQUE EN ELLOS LA FAMA PREGONEN&nbsp;&nbsp;·&nbsp;&nbsp;TU NOMBRE BENDITO QUE ES UNA ORACIÓN
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-2">
          <div className="border-b-2 border-[#1B4332] px-5 py-14 sm:px-8 sm:py-20 lg:border-r-2 lg:border-b-0 lg:py-24">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#1B4332]/40" data-reveal>
              Fiestas Matet 2026
            </p>
            <h1
              className="mt-4 text-[5.5rem] uppercase leading-[0.82] sm:text-[9rem] lg:text-[12rem]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
              data-reveal
            >
              Fiestas
              <br />
              de
              <br />
              Matet
            </h1>
          </div>
          <div className="flex flex-col justify-between gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.5em] text-[#1B4332]/40"
                data-reveal
                style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
              >
                Archivo visual del pueblo&nbsp;&bull;&nbsp;Desde 1976
              </p>
              <p
                className="mt-6 max-w-sm text-[15px] leading-7 text-[#1B4332]/80 sm:text-base"
                data-reveal
                style={{ "--reveal-delay": "0.18s" } as React.CSSProperties}
              >
                Una portada para leer el programa de fiestas con rapidez, entrar a cada bloque por
                ambiente y mantener cerca el archivo histórico del pueblo.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-3"
              data-reveal
              style={{ "--reveal-delay": "0.26s" } as React.CSSProperties}
            >
              <a
                href="/calendar"
                className="border-2 border-[#1B4332] bg-[#1B4332] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.32em] text-[#F0EAD6] transition hover:bg-transparent hover:text-[#1B4332]"
              >
                Calendario
              </a>
              <a
                href="/suscribirse"
                className="border-2 border-[#1B4332]/25 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.32em] text-[#1B4332] transition hover:border-[#1B4332]"
              >
                Guardar en el calendario
              </a>
            </div>
          </div>
        </div>
      </section>

      {CHAPTERS.map((chapter, index) => {
        const preview =
          chapter.id === "proximas"
            ? chapterPreviews.proximas
            : chapter.id === "noche"
            ? chapterPreviews.noche
            : chapter.id === "peques"
            ? chapterPreviews.peques
            : chapterPreviews.todas;

        const isDark = index % 2 === 0;
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
              <div className="flex flex-col justify-between border-b-2 border-[#1B4332] px-5 py-12 sm:px-8 sm:py-16 lg:border-r-2 lg:border-b-0">
                <div data-reveal>
                  <h2
                    className="text-[3.2rem] uppercase leading-[0.86] sm:text-[4.5rem] lg:text-[5.5rem]"
                    style={{ fontFamily: "var(--font-bebas-neue)" }}
                  >
                    {chapter.title}
                  </h2>
                  <p className="mt-5 max-w-xs text-[14px] leading-7" style={{ opacity: 0.6 }}>
                    {chapter.description}
                  </p>
                </div>
                <Link
                  href={chapter.href}
                  className={`mt-10 self-start border-2 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.32em] transition ${
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

              <div className="px-5 py-12 sm:px-8 sm:py-16">
                <p className="mb-8 text-[10px] uppercase tracking-[0.45em]" style={{ opacity: 0.38 }}>
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
                        className="animate-in grid gap-4 py-5 sm:grid-cols-[6.5rem_1fr]"
                        style={{
                          borderBottom:
                            i < preview.length - 1
                              ? `2px solid ${
                                  isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"
                                }`
                              : "none",
                          "--reveal-delay": `${i * 0.07}s`,
                        } as React.CSSProperties}
                      >
                        <div>
                          {event.startsAt && (
                            <>
                              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ opacity: 0.4 }}>
                                {formatDayLabel(event.startsAt).split(" ").slice(0, 2).join(" ")}
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
                          <p className="text-base font-semibold leading-tight">{event.title}</p>
                          {event.location && (
                            <p className="mt-1.5 text-[13px]" style={{ opacity: 0.5 }}>
                              {event.location}
                            </p>
                          )}
                          {event.provisional && (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.3em]" style={{ opacity: 0.38 }}>
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

      <section className="border-b-2 border-[#1B4332] bg-[#A61F24]">
        <div className="grid lg:grid-cols-2">
          <div className="border-b-2 border-[#1B4332] px-5 py-16 sm:px-8 sm:py-24 lg:border-r-2 lg:border-b-0" data-reveal>
            <p className="text-[10px] uppercase tracking-[0.45em] text-white/45">
              Aspecto&nbsp;&bull;&nbsp;Archivo
            </p>
            <h2
              className="mt-4 text-[3.8rem] uppercase leading-[0.86] text-white sm:text-[6rem] lg:text-[8rem]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Historia del pueblo
            </h2>
          </div>
          <div
            className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-24"
            data-reveal
            style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
          >
            <p className="max-w-sm text-[15px] leading-7 text-white/75">
              Portadas, carteles y programas desde 1976. Un archivo visual de cómo el pueblo ha
              vivido sus fiestas a lo largo de los años.
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
              className="mt-10 self-start border-2 border-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.32em] text-white transition hover:bg-white hover:text-[#A61F24]"
            >
              Ver archivo →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
