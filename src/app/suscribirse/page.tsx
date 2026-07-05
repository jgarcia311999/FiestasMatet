"use client";

import Link from "next/link";
import React from "react";

function buildUrls(origin: string) {
  return {
    webcal: `webcal://${new URL("/cal/fiestas-matet.ics", origin).host}/cal/fiestas-matet.ics`,
    https: new URL("/cal/fiestas-matet.ics", origin).toString(),
    testWebcal: `webcal://${new URL("/cal/fiestas-matet-prueba.ics", origin).host}/cal/fiestas-matet-prueba.ics`,
    testHttps: new URL("/cal/fiestas-matet-prueba.ics", origin).toString(),
  };
}

export default function SuscribirsePage() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [attemptedOpen, setAttemptedOpen] = React.useState(false);

  const urls =
    typeof window === "undefined"
      ? {
          webcal: "/cal/fiestas-matet.ics",
          https: "/cal/fiestas-matet.ics",
          testWebcal: "/cal/fiestas-matet-prueba.ics",
          testHttps: "/cal/fiestas-matet-prueba.ics",
        }
      : buildUrls(window.location.origin);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      setAttemptedOpen(true);
      window.location.href = urls.webcal;
    }, 150);

    return () => window.clearTimeout(timer);
  }, [urls.webcal]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <main className="min-h-[100svh] bg-[#F0EAD6] text-[#1B4332]">
      <header className="sticky top-0 z-30 border-b-2 border-[#1B4332] bg-[#F0EAD6]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.32em] text-[#1B4332] transition hover:opacity-70"
          >
            ← Volver al inicio
          </Link>
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#1B4332]/45">
            Fiestas de Matet 2026
          </p>
        </div>
      </header>

      <section className="border-b-2 border-[#1B4332]">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#1B4332]/45">
            Calendario suscrito
          </p>
          <h1
            className="mt-4 text-[4.2rem] uppercase leading-[0.86] sm:text-[6rem]"
            style={{ fontFamily: "var(--font-bebas-neue)" }}
          >
            Suscribirse
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#1B4332]/80">
            En algunos iPhone, tocar un archivo <code>.ics</code> lo importa como eventos sueltos.
            Para crear un calendario suscrito de verdad, la opcion mas fiable es usar la URL del feed
            desde los ajustes del iPhone.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#A61F24]">
            {attemptedOpen
              ? "Estamos intentando abrir la suscripcion automaticamente. Si no salta Calendario, usa una de las opciones de abajo."
              : "Preparando la apertura automatica del calendario..."}
          </p>
        </div>
      </section>

      <section className="border-b-2 border-[#1B4332] bg-[#E5DDC4]">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2">
          <div className="border-2 border-[#1B4332] bg-[#F0EAD6] p-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#1B4332]/45">
              Opcion directa
            </p>
            <h2
              className="mt-4 text-[2.5rem] uppercase leading-[0.9]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Intentar suscripcion
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#1B4332]/75">
              Si Safari coopera, este boton deberia abrir la suscripcion del calendario.
            </p>
            <a
              href={urls.webcal}
              className="mt-8 inline-block border-2 border-[#1B4332] bg-[#1B4332] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#F0EAD6] transition hover:bg-transparent hover:text-[#1B4332]"
            >
              Suscribirse ahora
            </a>
          </div>

          <div className="border-2 border-[#A61F24] bg-[#F0EAD6] p-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#A61F24]/55">
              Opcion fiable
            </p>
            <h2
              className="mt-4 text-[2.5rem] uppercase leading-[0.9] text-[#A61F24]"
              style={{ fontFamily: "var(--font-bebas-neue)" }}
            >
              Pegar URL en iPhone
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#1B4332]/75">
              Ve a Ajustes &gt; Calendario &gt; Cuentas &gt; Anadir cuenta &gt; Otra &gt; Anadir calendario suscrito y pega esta URL:
            </p>
            <div className="mt-5 border border-[#1B4332]/20 bg-white/70 p-4 text-sm break-all">
              {urls.https}
            </div>
            <button
              type="button"
              onClick={() => copy(urls.https, "main")}
              className="mt-5 border-2 border-[#A61F24] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#A61F24] transition hover:bg-[#A61F24] hover:text-[#F0EAD6]"
            >
              {copied === "main" ? "URL copiada" : "Copiar URL"}
            </button>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#1B4332]">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#1B4332]/45">
            Prueba segura
          </p>
          <h2
            className="mt-4 text-[2.8rem] uppercase leading-[0.9]"
            style={{ fontFamily: "var(--font-bebas-neue)" }}
          >
            Calendario de 1 evento
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#1B4332]/75">
            Usa esta version si quieres comprobar primero el flujo sin importar todos los actos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={urls.testWebcal}
              className="border-2 border-[#1B4332] bg-[#1B4332] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#F0EAD6] transition hover:bg-transparent hover:text-[#1B4332]"
            >
              Suscribir prueba
            </a>
            <button
              type="button"
              onClick={() => copy(urls.testHttps, "test")}
              className="border-2 border-[#A61F24] px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-[#A61F24] transition hover:bg-[#A61F24] hover:text-[#F0EAD6]"
            >
              {copied === "test" ? "URL copiada" : "Copiar URL de prueba"}
            </button>
          </div>
          <div className="mt-5 border border-[#1B4332]/20 bg-[#E5DDC4] p-4 text-sm break-all">
            {urls.testHttps}
          </div>
        </div>
      </section>
    </main>
  );
}
