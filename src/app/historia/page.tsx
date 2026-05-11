"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Years with a cover image available in public/LIBROS DE FIESTAS/PORTADAS/
const YEARS = [
  1976, 1977, 1978, 1979, 1980, 1981, 1982, 1984, 1985, 1986, 1988, 1989,
  1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
  2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2022, 2023, 2024,
];

export default function HistoriaPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="min-h-[100svh] bg-[#0f0b07] text-[#e8d5b0]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#c8a96e]/15 bg-[#0f0b07]/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#c8a96e]/50">Matet</p>
            <h1 className="font-serif text-xl font-semibold leading-tight">Historia de las Fiestas</h1>
          </div>
          <Link
            href="/"
            className="text-[9px] uppercase tracking-[0.24em] text-[#c8a96e]/55 hover:text-[#c8a96e]/90 transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        {/* Intro */}
        <p className="mb-10 max-w-prose text-[13px] leading-7 text-[#c8a96e]/60">
          El libro de fiestas de Matet es una tradición que comenzó en 1976. Cada año, la comisión de fiestas edita un programa que recoge los actos, las comisiones y las clavarias. Aquí están todas las portadas.
        </p>

        {/* Cover grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {YEARS.map((year) => (
            <button
              key={year}
              onClick={() => setSelected(selected === year ? null : year)}
              className={`group relative aspect-[2/3] overflow-hidden rounded-sm border transition-all duration-200 ${
                selected === year
                  ? "border-[#c8a96e]/60 ring-1 ring-[#c8a96e]/30"
                  : "border-[#c8a96e]/12 hover:border-[#c8a96e]/35"
              }`}
            >
              <Image
                src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${year}.png`)}
                alt={`Portada libro de fiestas ${year}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="120px"
                unoptimized
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(8,4,1,0.82)_100%)]" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center font-serif text-[10px] text-[#f0dba8]/90">
                {year}
              </span>
            </button>
          ))}
        </div>

        {/* Selected year detail */}
        {selected !== null && (
          <div className="mt-8 rounded-sm border border-[#c8a96e]/20 bg-[#1a0e05]/60 p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-sm">
                <Image
                  src={encodeURI(`/LIBROS DE FIESTAS/PORTADAS/Portada ${selected}.png`)}
                  alt={`Portada ${selected}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <p className="text-[8px] uppercase tracking-[0.28em] text-[#c8a96e]/50">Libro de fiestas</p>
                <h2 className="mt-1 font-serif text-3xl font-semibold">{selected}</h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em] text-[#c8a96e]/50">Comisión de fiestas</p>
                    <p className="mt-1 text-[13px] text-[#e8d5b0]/60 italic">Datos no disponibles</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em] text-[#c8a96e]/50">Clavaria mayor</p>
                    <p className="mt-1 text-[13px] text-[#e8d5b0]/60 italic">Datos no disponibles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
