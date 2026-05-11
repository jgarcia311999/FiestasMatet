"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type ArchivePageLayoutProps = {
  title: string;
  kicker: string;
  chapter: string;
  accent: string;
  intro?: string;
  children: React.ReactNode;
};

export default function ArchivePageLayout({
  title,
  kicker,
  chapter,
  accent,
  intro,
  children,
}: ArchivePageLayoutProps) {
  return (
    <main className="min-h-[100svh] bg-[#0b0808] text-[#f3eadc]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(166,31,36,0.14),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(52,93,184,0.14),transparent_28%),linear-gradient(180deg,#0b0808_0%,#120d0c_48%,#0b0808_100%)]" />
        <div className="absolute inset-0 opacity-[0.12]">
          <Image src="/programa-collage.png" alt="" fill className="object-cover" />
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0808]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#c7b098]">Matet en fiestas</p>
            <h1 className="mt-1 text-lg font-semibold sm:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.28em] text-[#c7b098]">
            <Link href="/" className="transition-opacity hover:opacity-100 opacity-75">
              Inicio
            </Link>
            <Link href="/historia" className="transition-opacity hover:opacity-100 opacity-75">
              Historia
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <section className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.34em]"
              style={{ color: accent }}
            >
              {chapter}
            </p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold uppercase leading-[0.92] sm:text-6xl lg:text-7xl">
              {title}
            </h2>
            <p className="mt-3 text-sm uppercase tracking-[0.26em] text-[#c7b098]">
              {kicker}
            </p>
            {intro && (
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#dbcab7]">
                {intro}
              </p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c7b098]">
              Archivo vivo
            </p>
            <p className="mt-4 text-sm leading-7 text-[#dbcab7]">
              Las fiestas se cuentan mejor con capas: programa, carteles, horas,
              recuerdos y la manera en que el pueblo se junta.
            </p>
          </div>
        </section>

        <section className="mt-10">{children}</section>
      </div>
    </main>
  );
}
