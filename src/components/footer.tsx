"use client";
import { usePathname } from "next/navigation";
export default function Footer() {
  const pathname = usePathname() || "/";
  const hasSeg = (seg: string) => pathname.includes(`/` + seg);
  const isEditorial =
    pathname === "/" ||
    pathname.startsWith("/home2") ||
    hasSeg("proximas") ||
    hasSeg("noche") ||
    hasSeg("peques") ||
    hasSeg("todas") ||
    hasSeg("historia");

  let bgColor = isEditorial ? "#F0EAD6" : "#E7DAD1";
  if (!isEditorial && (hasSeg("quehaceres") || hasSeg("calendar"))) {
    bgColor = "#D9E3F0";
  }
  const textColor = isEditorial ? "#1B4332" : "#0C2335";
  const year = new Date().getFullYear();

  return (
    <footer
      className={isEditorial ? "border-t-2 border-[#1B4332]" : "border-t border-[#0C2335]/30"}
      style={{ backgroundColor: bgColor }}
    >
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
