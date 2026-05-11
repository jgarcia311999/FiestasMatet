"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

interface BookPageLayoutProps {
  children: React.ReactNode;
  title: string;
  kicker: string;
  page: string;
  accent: string;
  pages?: React.ReactNode[];
}

function formatPageNumber(basePage: string, offset: number) {
  const numericPage = Number.parseInt(basePage, 10);
  if (Number.isNaN(numericPage)) {
    return basePage;
  }

  return String(numericPage + offset).padStart(basePage.length, "0");
}

function BookLeaf({
  title,
  kicker,
  page,
  accent,
  children,
}: {
  title: string;
  kicker: string;
  page: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100svh] w-full max-w-md flex-col overflow-hidden bg-[#f7f0e3] shadow-[4px_0_40px_rgba(0,0,0,0.45),-4px_0_40px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
        <Image
          src="/programa-collage.png"
          alt=""
          fill
          priority={false}
          className="object-cover"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,240,227,0.86),rgba(247,240,227,0.92)_24%,rgba(247,240,227,0.97)_100%)]" />

      <div className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(90deg,rgba(72,38,19,0.14),transparent)]" />
      <div className="absolute inset-y-0 right-0 w-[3px] bg-[linear-gradient(270deg,rgba(72,38,19,0.14),transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-[10.5rem] z-[1] h-56 w-56 -translate-x-1/2 opacity-[0.14]">
        <Image src="/logoMatet.png" alt="" fill className="object-contain" />
      </div>

      <header className="border-b border-[#9a8366]/24 bg-[#f7f0e3]/96 px-6 pb-3 pt-5 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/"
            className="text-[8px] uppercase tracking-[0.3em] text-[#8c7259] transition-colors hover:text-[#6f5944]"
          >
            ← Índice
          </Link>
          <span className="font-serif text-base leading-none" style={{ color: accent }}>
            {page}
          </span>
        </div>
        <p className="text-[7px] uppercase tracking-[0.28em] text-[#8c7259]">Programa de festejos</p>
        <h1 className="mt-0.5 font-sans text-[1.95rem] font-black uppercase leading-none tracking-[0.03em]" style={{ color: accent }}>
          {title}
        </h1>
        <p className="mt-1 text-[7px] uppercase tracking-[0.28em] text-[#8c7259]">{kicker}</p>
      </header>

      <div className="relative flex-1 px-6 py-5 text-[#3a2418]">
        <div
          className="pointer-events-none absolute left-6 right-6 top-4 h-[1px]"
          style={{ backgroundColor: `${accent}33` }}
        />
        {children}
      </div>

      <footer className="border-t border-[#9a8366]/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[7px] uppercase tracking-[0.28em] text-[#8c7259]/70">
            Fiestas de Matet · 2026
          </span>
          <span className="font-serif text-sm text-[#8c7259]/60">{page}</span>
        </div>
      </footer>
    </div>
  );
}

export default function BookPageLayout({ children, title, kicker, page, accent, pages }: BookPageLayoutProps) {
  const contentPages = pages && pages.length > 0 ? pages : [children];

  return (
    <div className="flex min-h-[100svh] justify-center bg-[#140d0b] px-4 py-6">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(157,29,35,0.08) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-[1] flex w-full flex-col items-center gap-6">
        {contentPages.map((content, index) => (
          <BookLeaf
            key={index}
            title={title}
            kicker={kicker}
            page={formatPageNumber(page, index)}
            accent={accent}
          >
            {content}
          </BookLeaf>
        ))}
      </div>
    </div>
  );
}
