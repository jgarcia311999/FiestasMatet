"use client";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
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
  const [username, setUsername] = useState<string | null>(null);

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

  useEffect(() => {
    const user = getCookie("commission_user");
    if (user && typeof user === "string") {
      setUsername(user);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#E7DAD1] text-[#0C2335]">
      {/* Header */}
      {/*
      <header className="sticky top-0 z-30 bg-[#E7DAD1] border-b border-black">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-start">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-2xl focus:outline-none"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            ☰
          </button>
        </div>
      </header>
      */}

      <div className="mx-auto max-w-7xl px-4 py-4">
        <h1 className="text-[80px] leading-none font-semibold break-words">
          {username}, gestiona
        </h1>
      </div>

      {/* Cards de accesos (estilo plantilla) */}
      <div className="mx-auto max-w-md px-4 pb-8 space-y-4">
        {/* Horarios */}
        <Link href="/layoutComision/horarios">
          <div className="mt-2 relative h-[180px] rounded-3xl bg-[#E85D6A] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Consulta los turnos y actos</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Horarios
            </div>
          </div>
        </Link>

        {/* Ideas */}
        <Link href="/layoutComision/ideas">
          <div className="mt-2 relative h-[180px] rounded-3xl bg-[#083279] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-[#FFD966]">Propón y comparte mejoras</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#FFD966]/90 select-none">
              Ideas
            </div>
          </div>
        </Link>

        {/* Quehaceres */}
        <Link href="/layoutComision/quehaceres">
          <div className="mt-2 relative h-[180px] rounded-3xl bg-[#a3b18a] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Tareas pendientes y asignadas</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Quehaceres
            </div>
          </div>
        </Link>

        {/* Próximamente (sin link) */}
        <div>
          <div className="mt-2 relative h-[180px] rounded-3xl bg-gray-400/70 overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">En construcción</div>
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/80 select-none">
              Próximamente...
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
            <a
              href="/api/logout"
              className="block rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50 border border-red-200"
            >
              Cerrar sesión
            </a>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
      </main>
    </div>
  );
}