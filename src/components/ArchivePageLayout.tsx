"use client";

import Link from "next/link";
import React, { useEffect } from "react";

type ArchivePageLayoutProps = {
  title: string;
  kicker: string;
  chapter: string;
  accent: string;
  intro?: string;
  children: React.ReactNode;
  contentWidthClassName?: string;
};

export default function ArchivePageLayout({
  title,
  kicker,
  chapter,
  accent,
  intro,
  children,
  contentWidthClassName,
}: ArchivePageLayoutProps) {
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

  return (
    <main className="min-h-[100svh] bg-[#F0EAD6] text-[#1B4332]">

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-[#F0EAD6] border-b-2 border-[#1B4332]">
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.45em] font-medium hover:opacity-50 transition-opacity"
          >
            ← Inicio
          </Link>
          <p className="text-[10px] uppercase tracking-[0.45em] font-medium hidden sm:block">
            Matet en fiestas&nbsp;&bull;&nbsp;{chapter}
          </p>
          <Link
            href="/historia"
            className="text-[10px] uppercase tracking-[0.45em] font-medium hover:opacity-50 transition-opacity hidden sm:block"
          >
            Historia
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b-2 border-[#1B4332]">
        <div className="grid lg:grid-cols-[1fr_minmax(260px,0.55fr)]">
          {/* Left: chapter + title + kicker */}
          <div className="px-5 py-14 sm:px-8 sm:py-20 border-b-2 border-[#1B4332] lg:border-b-0 lg:border-r-2">
            <p
              className="text-[10px] uppercase tracking-[0.5em] font-medium"
              style={{ color: accent }}
              data-reveal
            >
              {chapter}
            </p>
            <h1
              className="text-[4.5rem] sm:text-[7rem] lg:text-[9rem] uppercase leading-[0.84] mt-3"
              style={
                {
                  fontFamily: "var(--font-bebas-neue)",
                  "--reveal-delay": "0.07s",
                } as React.CSSProperties
              }
              data-reveal
            >
              {title}
            </h1>
            <p
              className="mt-4 text-[1.6rem] sm:text-[2rem]"
              style={
                {
                  fontFamily: "var(--font-dancing)",
                  color: accent,
                  opacity: 0.85,
                  "--reveal-delay": "0.14s",
                } as React.CSSProperties
              }
              data-reveal
            >
              {kicker}
            </p>
          </div>

          {/* Right: intro */}
          {intro && (
            <div
              className="px-5 py-14 sm:px-8 sm:py-20 flex items-end"
              data-reveal
              style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
            >
              <p className="text-[15px] leading-7 max-w-sm" style={{ opacity: 0.68 }}>
                {intro}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <div className={`mx-auto w-full px-5 py-12 sm:px-8 sm:py-16 ${contentWidthClassName ?? "max-w-5xl"}`}>
        {children}
      </div>
    </main>
  );
}
