"use client";
import { usePathname } from "next/navigation";
export default function Footer() {
  const pathname = usePathname() || "/";
  const hasSeg = (seg: string) => pathname.includes(`/` + seg);
  let bgColor = "#E7DAD1";
  if (hasSeg("proximas") || hasSeg("ideas")) {
    bgColor = "#FFF5BA";
  } else if (hasSeg("todas") || hasSeg("horarios")) {
    bgColor = "#E85D6A";
  } else if (hasSeg("noche")) {
    bgColor = "#083279";
  } else if (hasSeg("quehaceres") || hasSeg("calendar")) {
    bgColor = "#D9E3F0";
  } else if (pathname.startsWith("/layoutComision")) {
    bgColor = "#E7DAD1";
  }
  let textColor = "#0C2335";
  if (hasSeg("noche")) {
    textColor = "#FFD966";
  }
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#0C2335]/30" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-sm px-1 py-6" style={{ color: textColor }}>
        <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed">
          <div>
            <span className="uppercase tracking-[0.2em]">© {year} Matet</span>
            <br />
            Contáctanos a través de{" "}
            <a
              href="https://www.instagram.com/comisionmatet2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-70"
            >
              Instagram
            </a>
          </div>
          <div className="flex flex-col items-center justify-center uppercase tracking-[0.2em] text-center">
            <span>Produced by:</span>
            <a href="/login" className="no-underline text-inherit cursor-default">
              La comisión
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}