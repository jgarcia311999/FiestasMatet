"use client";
import Link from "next/link";
import { useEffect } from "react";
import * as webVitals from "web-vitals";
import { useRouter } from "next/navigation";
import { initGA, trackEvent } from "@/lib/analytics";
export default function Home2Page() {
  const router = useRouter();
  useEffect(() => {
    // Prefetch Next.js RSC payloads for faster navigation
    router.prefetch("/todas");
    router.prefetch("/proximas");
    router.prefetch("/noche");
    router.prefetch("/calendar");
  }, [router]);

  useEffect(() => {
    initGA();
    trackEvent("page_view");
    const startTime = Date.now();
    return () => {
      const seconds = (Date.now() - startTime) / 1000;
      trackEvent("time_on_page", { seconds });
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest("[data-track-id]") as HTMLElement | null;
      if (el && el.dataset.trackId) {
        trackEvent("click", { element: el.dataset.trackId });
      }
    }
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    let maxDepth = 0;
    let scroll75Tracked = false;

    function handleScroll() {
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollableHeight = docHeight - winHeight;
      if (scrollableHeight <= 0) return;

      const newDepth = (scrollTop / scrollableHeight) * 100;

      if (newDepth > maxDepth) {
        maxDepth = newDepth;
        trackEvent("scroll_depth", { depth: newDepth });
      }

      if (newDepth >= 75 && !scroll75Tracked) {
        scroll75Tracked = true;
        trackEvent("scroll_75");
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    function handler(e: ErrorEvent) {
      trackEvent("js_error", { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
    }
    window.addEventListener("error", handler);
    return () => {
      window.removeEventListener("error", handler);
    };
  }, []);

  useEffect(() => {
    function onWebVital(metric: { name: string; value: number }) {
      trackEvent("web_vital", { name: metric.name, value: metric.value });
    }
    webVitals.onCLS(onWebVital);
    webVitals.onLCP(onWebVital);
    webVitals.onINP(onWebVital);
    webVitals.onFCP(onWebVital);
    webVitals.onTTFB(onWebVital);
  }, []);

  return (
    <main className="min-h-screen bg-[#E7DAD1]">
      <div className="mx-auto max-w-sm px-1 pb-2 pt-7 text-black">

        <div className="flex items-end justify-between mt-2">
          <h1 className="text-[64px] leading-none font-semibold">MATET</h1>
          <img src="/logoMatet.png" alt="Logo Matet" className="h-30 w-30 object-contain" />
        </div>
        <div className="border-t border-[#0C2335] mt-3" />

        {/* Meta info flex row (example, not changed) */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em]">Produced by:</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">LA COMISIÓN</span>
        </div>

        {/* New Production/Video block */}
        <div className="mt-6 flex items-end justify-end">
          <span className="text-[64px] leading-none font-semibold">FIESTAS</span>
        </div>
        <div className="border-t border-[#0C2335] mt-3" />

        {/* Duplicated Produced by row (now condition inverted) */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em]">Disfruta de nuestro</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">mayor tesoro</span>
        </div>

        <div className="mt-6 flex items-start justify-between">
          <div className="text-[84px] leading-none font-semibold mt-2">2026</div>
        </div>

        <Link href="/calendar" prefetch>
          <div className="mt-10 mb-0 mr-2 text-right text-[12px] uppercase tracking-[0.2em] text-[#0C2335] cursor-pointer hover:underline" data-track-id="btn_calendar">
            Busca por fecha →
          </div>
        </Link>
        {/* New Card: Todas */}
        <Link href="/todas" prefetch>
          <div className="mt-3 relative h-[250px] rounded-3xl bg-[#E85D6A] overflow-hidden" data-track-id="btn_todas">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">¡Enterate de todo!</div>

            {/* Giant word behind */}
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Todas
            </div>

            {/* Center circle with arrow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-[#0C2335] flex items-center justify-center mb-6 text-[#0C2335]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card */}
        <Link href="/proximas" prefetch>
          <div className="mt-8 relative h-[250px] rounded-3xl bg-[#FFF5BA] overflow-hidden" data-track-id="btn_proximas">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">¡Todas las proximas actividades!</div>

            {/* Giant word behind */}
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Proximas
            </div>

            {/* Center circle with arrow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-[#0C2335] flex items-center justify-center mb-6 text-[#0C2335]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card */}
        <Link href="/noche" prefetch>
          <div className="mt-8 relative h-[250px] rounded-3xl bg-[#083279] overflow-hidden" data-track-id="btn_noche">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-[#FFD966]">¡Disfruta de todas las noches de fiesta!</div>

            {/* Giant word behind */}
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#FFD966]/90 select-none">
              Noche
            </div>

            {/* Center circle with arrow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-[#FFD966] flex items-center justify-center text-[#FFD966] mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* New Card */}
        {/* <div className="mt-8 relative h-[250px] rounded-3xl bg-[#a3b18a] overflow-hidden">
          <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Para que disfrute toda la familia</div>

          <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
            Peques
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border border-[#0C2335] flex items-center justify-center mb-6 text-[#0C2335]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div> */}

      </div>
    </main>
  );
}
