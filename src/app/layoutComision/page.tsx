"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tareas", label: "Tareas" },
  { href: "/calendario", label: "Calendario" },
  { href: "/documentos", label: "Documentos" },
  { href: "/tesoreria", label: "Tesorería" },
  { href: "/inventario", label: "Inventario" },
  { href: "/votaciones", label: "Votaciones" },
  { href: "/miembros", label: "Miembros" },
  { href: "/notificaciones", label: "Notificaciones" },
  { href: "/ajustes", label: "Ajustes" },
  { href: "/actividad", label: "Actividad" },
  { href: "/ayuda", label: "Ayuda" },
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
    <div className="min-h-screen bg-[#F5F3F0] text-[#0C2335]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0C2335]"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            <span>☰</span>
            <span>Menú</span>
          </button>
          <div className="font-semibold">Intranet Comisión</div>
          <div className="text-sm opacity-70">15 miembros</div>
        </div>
      </header>

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
        <h1 className="text-2xl font-bold mb-4">Hola Mundo</h1>
        <p className="text-sm text-gray-700">
          Este es el contenedor del layout de la comisión. Usa el botón Menú para navegar.
        </p>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold mb-2">Accesos rápidos</h2>
            <div className="flex flex-wrap gap-2">
              {NAV_LINKS.slice(0, 6).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="font-semibold mb-2">Estado rápido</h2>
            <ul className="text-sm list-disc ml-5 space-y-1 text-gray-700">
              <li>Próximas tareas: —</li>
              <li>Próximos eventos: —</li>
              <li>Últimos documentos: —</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}