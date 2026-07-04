"use client";

import ArchivePageLayout from "@/components/ArchivePageLayout";
import { HISTORIA_ARCHIVE } from "@/data/historiaArchive";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

const YEARS = [
  1976, 1977, 1978, 1979, 1980, 1981, 1982, 1984, 1985, 1986, 1988, 1989,
  1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
  2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2022, 2023, 2024,
];

function getCoverPath(year: number) {
  return encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${year}.png`);
}

function getDecadeLabel(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

function cleanOCRLine(line: string) {
  return line.replace(/®/g, "").replace(/\s+/g, " ").trim();
}

function looksLikeShortNameFragment(line: string) {
  const cleaned = cleanOCRLine(line);
  if (!cleaned || cleaned.includes(":")) return false;
  const words = cleaned.split(" ");
  if (words.length > 2) return false;
  return words.every((word) => /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ.'’-]*$/u.test(word));
}

function mergeOCRNameFragments(lines: string[]) {
  const merged: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    let current = cleanOCRLine(lines[index]);
    if (!current) continue;

    if (looksLikeShortNameFragment(current)) {
      let nextIndex = index + 1;
      while (
        nextIndex < lines.length &&
        looksLikeShortNameFragment(lines[nextIndex]) &&
        current.split(" ").length + cleanOCRLine(lines[nextIndex]).split(" ").length <= 5
      ) {
        current = `${current} ${cleanOCRLine(lines[nextIndex])}`;
        nextIndex += 1;
      }
      index = nextIndex - 1;
    }

    merged.push(current);
  }

  return merged;
}

function extractDisplayNames(lines: string[]) {
  const blocked = [
    "comision",
    "comisión",
    "clavari",
    "vocal",
    "presidente",
    "vicepresidente",
    "secretario",
    "tesorero",
    "contador",
    "festejos",
    "ejecutiva",
    "asuncion",
    "asunción",
    "reconocimiento",
    "corpora",
    "tarea desarrollada",
    "bellas clavarias",
  ];

  return mergeOCRNameFragments(lines)
    .map((line) => line.replace(/^(Don|Doña|D\.|Sria\.|Srta\.)\s+/i, "").trim())
    .filter((line) => {
      const lower = line.toLowerCase();
      if (!line || line.includes(":")) return false;
      if (blocked.some((token) => lower.includes(token))) return false;
      const words = line.split(/\s+/);
      if (words.length < 2 || words.length > 7) return false;
      return words.every((word) => /^[A-ZÁÉÍÓÚÑJ][A-Za-zÁÉÍÓÚÑáéíóúñ.'’-]*$/u.test(word));
    });
}

function getArchiveEntry(year: number) {
  return HISTORIA_ARCHIVE.find((entry) => entry.year === year);
}

export default function HistoriaPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isSelectingYear, setIsSelectingYear] = useState(false);
  const featuredRef = useRef<HTMLElement | null>(null);

  const selectedEntry = useMemo(() => getArchiveEntry(selectedYear), [selectedYear]);
  const selectedIndex = YEARS.indexOf(selectedYear);
  const previousYear = selectedIndex > 0 ? YEARS[selectedIndex - 1] : null;
  const nextYear = selectedIndex < YEARS.length - 1 ? YEARS[selectedIndex + 1] : null;

  const commissionLines = useMemo(
    () => extractDisplayNames(selectedEntry?.commissionLines ?? []),
    [selectedEntry]
  );
  const clavariaLines = useMemo(
    () => extractDisplayNames(selectedEntry?.clavariaLines ?? []),
    [selectedEntry]
  );

  const yearsByDecade = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const year of YEARS) {
      const decade = getDecadeLabel(year);
      if (!groups.has(decade)) groups.set(decade, []);
      groups.get(decade)!.push(year);
    }
    return Array.from(groups.entries());
  }, []);

  const handleSelectYear = (year: number) => {
    if (year === selectedYear) {
      const rect = featuredRef.current?.getBoundingClientRect();
      if (rect) {
        window.scrollTo({ top: window.scrollY + rect.top - 96, behavior: "smooth" });
      }
      return;
    }

    setIsSelectingYear(true);
    setSelectedYear(year);
    window.requestAnimationFrame(() => {
      const rect = featuredRef.current?.getBoundingClientRect();
      if (rect) {
        window.scrollTo({ top: window.scrollY + rect.top - 96, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    if (!isSelectingYear) return;
    const timeout = window.setTimeout(() => setIsSelectingYear(false), 420);
    return () => window.clearTimeout(timeout);
  }, [isSelectingYear, selectedYear]);

  return (
    <ArchivePageLayout
      title="Historia"
      kicker="Portadas y memoria"
      accent="#1B4332"
      intro="Un recorrido por los libros de fiestas conservados. Cada año reúne su portada y, cuando el escaneo ayuda, nombres de comisión y clavarias."
      contentWidthClassName="max-w-[1500px]"
    >
      <section
        ref={featuredRef}
        className="relative overflow-hidden border-b-2 border-[#1B4332] pb-10"
      >
        <div className="pointer-events-none absolute right-4 top-2 text-[5rem] font-semibold leading-none text-[#1B4332]/6 sm:text-[8rem] lg:text-[11rem]">
          {selectedYear}
        </div>

        <div
          key={selectedYear}
          className={`relative z-10 grid gap-6 xl:grid-cols-[16rem_minmax(0,1.2fr)] ${
            isSelectingYear ? "animate-[historyFeatureIn_420ms_ease]" : ""
          }`}
        >
          <div className="space-y-4">
            <div className="border border-[#1B4332]/12 bg-[#f7f1df] p-4">
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[14rem] overflow-hidden border border-[#1B4332]/12">
                <Image
                  src={getCoverPath(selectedYear)}
                  alt={`Portada del libro de fiestas ${selectedYear}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 60vw, 15rem"
                  unoptimized
                  priority
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => previousYear !== null && handleSelectYear(previousYear)}
                disabled={previousYear === null}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1B4332]/12 text-lg text-[#1B4332] transition hover:border-[#1B4332]/30 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Año anterior"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => nextYear !== null && handleSelectYear(nextYear)}
                disabled={nextYear === null}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1B4332]/12 text-lg text-[#1B4332] transition hover:border-[#1B4332]/30 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Año siguiente"
              >
                →
              </button>
              <div className="ml-2 text-[10px] uppercase tracking-[0.3em] text-[#a78d73]">
                Portada conservada
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="border border-[#1B4332]/12 bg-[#f7f1df] p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B4332]/50">Edición seleccionada</p>
                <h2 className="mt-3 text-[4rem] font-semibold leading-none sm:text-[5.4rem]">{selectedYear}</h2>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#486150]">
                  {selectedEntry
                    ? "Esta ficha reúne la portada y el texto reconocido desde el escaneo cuando ha sido posible."
                    : "Por ahora conservamos la portada de esta edición dentro del archivo."}
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="border-t border-[#1B4332]/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#a78d73]">Comisión</p>
                    {commissionLines.length > 0 ? (
                      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm leading-6 text-[#1B4332] sm:grid-cols-2">
                        {commissionLines.map((line, index) => (
                          <li key={`${line}-${index}`}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-[#486150]">
                        Aún no se pudo extraer con suficiente claridad la relación de comisión para esta edición.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-[#1B4332]/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#a78d73]">Clavarias</p>
                    {clavariaLines.length > 0 ? (
                      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm leading-6 text-[#1B4332] sm:grid-cols-2">
                        {clavariaLines.map((line, index) => (
                          <li key={`${line}-${index}`}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-[#486150]">
                        Aún no se pudo extraer con suficiente claridad la relación de clavarias para esta edición.
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-[12px] italic text-[#a78d73]">
                  Texto obtenido desde el escaneo. Puede contener pequeñas erratas de reconocimiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t-2 border-[#1B4332] pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1B4332]/10 pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B4332]/50">Cronología</p>
            <h3 className="mt-3 text-3xl font-semibold">Elige una edición</h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#486150]">
            Toca cualquier portada para cargar arriba su ficha con la portada y los nombres recuperados del archivo.
          </p>
        </div>

        <div className="mt-6 space-y-8">
          {yearsByDecade.map(([decade, years]) => (
            <div key={decade}>
              <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#c7b098]">{decade}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {years.map((year) => {
                  const entry = getArchiveEntry(year);
                  const hasArchiveText = !!entry && (entry.commissionLines.length > 0 || entry.clavariaLines.length > 0);

                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleSelectYear(year)}
                      className={`group relative overflow-hidden border text-left transition ${
                        selectedYear === year
                          ? "-translate-y-1 border-[#1B4332] bg-[#f7f1df]"
                          : "border-[#1B4332]/10 bg-[#f3eadc] hover:border-[#1B4332]/20 hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={getCoverPath(year)}
                          alt={`Portada ${year}`}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 45vw, 160px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(8,5,5,0.94)_100%)]" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-lg font-semibold leading-none text-[#f3eadc]">{year}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#f3eadc]/68">
                            {hasArchiveText ? "Portada + archivo" : "Solo portada"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes historyFeatureIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ArchivePageLayout>
  );
}
