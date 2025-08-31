"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/layoutComision/horarios", label: "Horarios" },
  { href: "/layoutComision/ideas", label: "Ideas" },
  { href: "/layoutComision/quehaceres", label: "Quehaceres" },
  // { href: "/dashboard", label: "Dashboard" },
  // { href: "/tareas", label: "Tareas" },
  // { href: "/calendario", label: "Calendario" },
  // { href: "/documentos", label: "Documentos" },
  // { href: "/tesoreria", label: "Tesorería" },
  // { href: "/inventario", label: "Inventario" },
  // { href: "/votaciones", label: "Votaciones" },
  // { href: "/miembros", label: "Miembros" },
  // { href: "/notificaciones", label: "Notificaciones" },
  // { href: "/ajustes", label: "Ajustes" },
  // { href: "/actividad", label: "Actividad" },
  // { href: "/ayuda", label: "Ayuda" },
];

export default function LayoutComisionPage() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el menú con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cierra al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#E7DAD1] text-[#0C2335]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#E7DAD1] border-b border-black">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-2xl focus:outline-none"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            ☰
          </button>
          <div className="font-semibold">COMISIÓN</div>
        </div>
      </header>


      {/* Cards de accesos (estilo plantilla) */}
      <div className="mx-auto max-w-md px-4 pb-8 space-y-4">
        {/* Horarios */}
        <Link href="/layoutComision/horarios">
          <div className="mt-2 relative h-[250px] rounded-3xl bg-[#E85D6A] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Consulta los turnos y actos</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Horarios
            </div>
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

        {/* Ideas */}
        <Link href="/layoutComision/ideas">
          <div className="mt-2 relative h-[250px] rounded-3xl bg-[#083279] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-[#FFD966]">Propón y comparte mejoras</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#FFD966]/90 select-none">
              Ideas
            </div>
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

        {/* Quehaceres */}
        <Link href="/layoutComision/quehaceres">
          <div className="mt-2 relative h-[250px] rounded-3xl bg-[#a3b18a] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Tareas pendientes y asignadas</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Quehaceres
            </div>
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

        {/* Próximamente (sin link) */}
        <div>
          <div className="mt-2 relative h-[250px] rounded-3xl bg-gray-400/70 overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">En construcción</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/80 select-none">
              Próximamente...
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-[#0C2335]/70 flex items-center justify-center mb-6 text-[#0C2335]/70">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 ${open ? "block" : "hidden"}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed left-0 top-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú lateral"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="font-semibold">Menú</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm hover:bg-gray-100 ${
                      active ? "bg-[#0C2335] text-white hover:bg-[#0C2335]" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-gray-200 pt-3">
            <Link
              href="/login?next=/login"
              className="block rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50 border border-red-200"
            >
              Cerrar sesión
            </Link>
            <p className="mt-2 px-3 text-xs text-gray-500">
              (Para logout completo, añade la acción de servidor que borre la cookie.)
            </p>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
      </main>
    </div>
  );
}