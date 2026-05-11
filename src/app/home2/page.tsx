"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { initGA, trackEvent } from "@/lib/analytics";

const MADRID_TZ = "Europe/Madrid";
const COVER_YEARS = [1976, 1982, 1991, 1998, 2004, 2013, 2018, 2022, 2023, 2024];

const CHAPTERS = [
  {
    id: "proximas",
    chapter: "Cap. 01",
    title: "Lo que viene",
    href: "/proximas",
    accent: "#A61F24",
    description: "Una lectura rápida de los próximos días para saber qué toca y cuándo moverse.",
  },
  {
    id: "noche",
    chapter: "Cap. 02",
    title: "Noches de plaza",
    href: "/noche",
    accent: "#345DB8",
    description: "Verbenas, discomóviles y ese tramo en el que el pueblo cambia de ritmo.",
  },
  {
    id: "peques",
    chapter: "Cap. 03",
    title: "Familia y peques",
    href: "/peques",
    accent: "#C97E62",
    description: "Actos abiertos, juegos, pasacalles y tiempo de fiesta para todas las edades.",
  },
  {
    id: "todas",
    chapter: "Cap. 04",
    title: "Programa completo",
    href: "/todas",
    accent: "#E0C28F",
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
  return formatted.replace(", ", " ").replace(/^./, (value) => value.toUpperCase());
}

function pickUpcoming(events: ApiEvent[], count: number, filter?: (event: ApiEvent) => boolean) {
  const today = dateKeyMadrid(new Date());
  const filtered = events
    .filter((event) => event.startsAt && (!filter || filter(event)))
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const future = filtered.filter((event) => dateKeyMadrid(new Date(event.startsAt!)) >= today);
  const base = future.length > 0 ? future : filtered;
  return base.slice(0, count);
}

function isFamilyTag(event: ApiEvent) {
  return (
    event.tags?.includes("familia") ||
    event.tags?.includes("todos los públicos") ||
    event.tags?.includes("todos los publicos") ||
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

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
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
      noche: pickUpcoming(events, 3, (event) => event.tags?.includes("noche") ?? false),
      peques: pickUpcoming(events, 3, isFamilyTag),
      todas: pickUpcoming(events, 4),
    }),
    [events]
  );

  return (
    <main className="min-h-[100svh] bg-[#0b0808] text-[#f3eadc]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(166,31,36,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(52,93,184,0.15),transparent_26%),linear-gradient(180deg,#0b0808_0%,#120d0c_45%,#0b0808_100%)]" />
        <div className="absolute inset-0 opacity-[0.1]">
          <Image src="/programa-collage.png" alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0808]/75 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#c7b098]">Matet en fiestas</p>
              <p className="mt-1 text-sm text-[#f3eadc]/80">Programa, memoria y plaza</p>
            </div>
            <nav className="hidden items-center gap-6 text-[10px] uppercase tracking-[0.3em] text-[#c7b098] md:flex">
              {CHAPTERS.map((chapter) => (
                <a key={chapter.id} href={`#${chapter.id}`} className="transition-opacity hover:opacity-100 opacity-75">
                  {chapter.title}
                </a>
              ))}
              <Link href="/historia" className="transition-opacity hover:opacity-100 opacity-75">
                Historia
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto grid min-h-[100svh] max-w-7xl gap-10 px-5 pb-18 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end lg:pt-16">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-[#c7b098]">
              Archivo visual de las fiestas del pueblo
            </p>
            <h1 className="mt-5 max-w-5xl text-[3.1rem] font-semibold uppercase leading-[0.86] sm:text-[5.2rem] lg:text-[7.4rem]">
              Matet
              <span className="block text-[#a61f24]">en fiestas</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#dbcab7] sm:text-[17px]">
              Una portada nueva para leer las fiestas como se leen los recuerdos:
              con carteles, portadas, horas, verbenas, fotos y ese desorden bonito
              que deja el verano cuando el pueblo se pone en marcha.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#proximas"
                className="rounded-full border border-white/15 bg-white/6 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3eadc] transition hover:bg-white/12"
              >
                Entrar al programa
              </a>
              <Link
                href="/historia"
                className="rounded-full border border-[#a61f24]/40 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-[#f3eadc] transition hover:border-[#a61f24]/70 hover:bg-[#a61f24]/10"
              >
                Ver archivo histórico
              </Link>
            </div>
          </div>

          <div className="relative min-h-[28rem] lg:min-h-[38rem]">
            <div className="absolute inset-x-2 top-0 h-[56%] overflow-hidden rounded-[2rem] border border-white/10">
              <Image src="/matet-cover.jpg" alt="Vista de Matet" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,4,4,0.06),rgba(6,4,4,0.72)_82%,rgba(6,4,4,0.92)_100%)]" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#f3eadc]/72">Agosto, septiembre, octubre</p>
                <p className="mt-2 max-w-xs text-lg font-medium leading-tight">
                  Del anuncio al baile, del cartel al programa completo.
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 grid w-[88%] grid-cols-3 gap-3 rounded-[1.8rem] border border-white/10 bg-[#120d0c]/90 p-4 shadow-2xl backdrop-blur-sm">
              {COVER_YEARS.map((year, index) => (
                <div
                  key={year}
                  className={`relative overflow-hidden rounded-[1rem] border border-white/10 bg-white/5 ${
                    index === 0 ? "col-span-2 aspect-[1.7/1.05]" : "aspect-[0.8/1]"
                  }`}
                >
                  <Image
                    src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${year}.png`)}
                    alt={`Portada de ${year}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(11,8,8,0.88)_100%)]" />
                  <span className="absolute bottom-3 left-3 font-serif text-sm">{year}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
          <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:grid-cols-3 md:p-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#c7b098]">El tono</p>
              <p className="mt-3 text-sm leading-7 text-[#dbcab7]">
                Oscuro, gráfico y con peso editorial. Menos folleto, más archivo vivo.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#c7b098]">El ritmo</p>
              <p className="mt-3 text-sm leading-7 text-[#dbcab7]">
                Scroll narrativo, bloques grandes y cortes visuales con portadas, carteles y plaza.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#c7b098]">La materia</p>
              <p className="mt-3 text-sm leading-7 text-[#dbcab7]">
                Programa real, memoria del pueblo y piezas del archivo de fiestas desde 1976.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#c7b098]">Capítulos</p>
              {CHAPTERS.map((chapter) => (
                <a key={chapter.id} href={`#${chapter.id}`} className="block border-l border-white/10 pl-4 py-1">
                  <span className="block text-[10px] uppercase tracking-[0.28em]" style={{ color: chapter.accent }}>
                    {chapter.chapter}
                  </span>
                  <span className="mt-1 block text-sm text-[#f3eadc]">{chapter.title}</span>
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-12">
            {CHAPTERS.map((chapter, index) => {
              const preview =
                chapter.id === "proximas"
                  ? chapterPreviews.proximas
                  : chapter.id === "noche"
                  ? chapterPreviews.noche
                  : chapter.id === "peques"
                  ? chapterPreviews.peques
                  : chapterPreviews.todas;

              return (
                <section
                  id={chapter.id}
                  key={chapter.id}
                  className="grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.34em]" style={{ color: chapter.accent }}>
                      {chapter.chapter}
                    </p>
                    <h2 className="mt-3 text-4xl font-semibold uppercase leading-[0.9] sm:text-5xl">
                      {chapter.title}
                    </h2>
                    <p className="mt-4 max-w-sm text-[15px] leading-7 text-[#dbcab7]">
                      {chapter.description}
                    </p>
                    <Link
                      href={chapter.href}
                      className="mt-8 inline-flex rounded-full border px-5 py-3 text-[11px] uppercase tracking-[0.28em] transition"
                      style={{ borderColor: `${chapter.accent}66`, color: "#f3eadc" }}
                    >
                      Abrir sección
                    </Link>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#c7b098]" />
                      </div>
                    ) : preview.length === 0 ? (
                      <p className="text-sm text-[#dbcab7]">Todavía no hay eventos cargados en este bloque.</p>
                    ) : (
                      <div className="space-y-4">
                        {preview.map((event, itemIndex) => (
                          <div
                            key={event.id}
                            className="grid gap-3 border-b border-white/10 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
                          >
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-[#c7b098]">
                                {event.startsAt ? formatDayLabel(event.startsAt) : `Pista ${itemIndex + 1 + index}`}
                              </p>
                              {event.startsAt && (
                                <p className="mt-2 text-2xl font-semibold" style={{ color: chapter.accent }}>
                                  {formatHour(event.startsAt)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xl font-medium leading-tight">{event.title}</p>
                              {event.location && (
                                <p className="mt-2 text-sm leading-7 text-[#dbcab7]">
                                  {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
