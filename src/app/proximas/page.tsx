"use client";
import { useState } from "react";
import { fiestas as fiestasData, type Fiesta } from "../../data/fiestas";


function parseISODateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatSpanishLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  // Quitar coma y capitalizar primera letra
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

function getSecciones(fiestaLista: Fiesta[]): { label: string; date: Date; key: string }[] {
  const today = startOfTodayLocal();
  const end = new Date(today);
  end.setDate(end.getDate() + 6); // próximos 7 días (hoy + 6)

  // Futuras (>= hoy), agrupadas por fecha YYYY-MM-DD
  const futuras = fiestaLista
    .map((f) => ({ ...f, dateObj: parseISODateLocal(f.date) }))
    .filter((f) => !isNaN(f.dateObj.getTime()) && f.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const byDate = new Map<string, Date>();
  for (const f of futuras) {
    const key = f.date;
    if (!byDate.has(key)) byDate.set(key, f.dateObj);
  }

  const allDates = Array.from(byDate.entries())
    .map(([key, date]) => ({ key, date, label: formatSpanishLong(date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const en7dias = allDates.filter((d) => d.date <= end);
  if (en7dias.length > 0) return en7dias;

  // Si no hay nada en 7 días, devolver solo la primera futura (si existe)
  return allDates.length > 0 ? [allDates[0]] : [];
}

function getEventosPorFecha(fiestaLista: Fiesta[], dateKey: string): Fiesta[] {
  const byDate = fiestaLista.filter(f => f.date === dateKey);
  const parseTime = (t: string) => {
    const [hh, mm] = (t || "00:00").split(":").map(Number);
    return (hh || 0) * 60 + (mm || 0);
  };
  return byDate.sort((a, b) => parseTime(a.time) - parseTime(b.time));
}

export default function ProximasPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const secciones = getSecciones(fiestasData);

  return (
    <main className="min-h-screen bg-[#E85D6A] text-[#0C2335]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        {/* Headline */}
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-tight">
          Enterate de todas las proximas fiestas de <strong>MATET</strong>
        </h1>

        {/* Divider rows of chips */}
        <div className="mt-5 border-t border-[#0C2335]" />
        {secciones.length === 0 ? (
          <div className="py-2 text-[12px] italic">Sin próximas fiestas</div>
        ) : (
          secciones.map((sec, idx) => (
            <div key={sec.key}>
              <div
                className="grid grid-cols-3 text-[11px] uppercase tracking-[0.18em] py-2 gap-x-4 cursor-pointer"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="border-b border-transparent">{sec.label}</span>
              </div>
              {openIndex === idx && (
                <>
                  <div className="p-2 text-sm">
                    {getEventosPorFecha(fiestasData, sec.key).length === 0 ? (
                      <div className="italic">Sin eventos para este día</div>
                    ) : (
                      <ul className="space-y-1">
                        {getEventosPorFecha(fiestasData, sec.key).map((ev, i) => (
                          <li key={i}>A las {ev.time} - {ev.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-5 mb-5 relative h-[180px] rounded-3xl bg-[#083279] overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-24 rounded-full border border-[#0C2335] flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="12" y1="4" x2="12" y2="18" stroke="#0C2335" strokeWidth="2"/>
                          <polyline points="6,12 12,18 18,12" stroke="#0C2335" strokeWidth="2" fill="none"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="border-t border-[#0C2335]" />
            </div>
          ))
        )}

        {/* Call to action serif */}
        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight">Let’s start</p>
          <p className="font-serif text-[28px] leading-tight">something</p>
          <p className="mt-2 text-[12px]">hi@203.com</p>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] opacity-90">
          <span>203.@ 2023</span>
          <span>About</span>
          <span>Contact</span>
        </div>
      </div>
    </main>
  );
}