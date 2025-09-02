"use client";
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

  // Futuras (>= hoy), ordenadas por fecha
  const futuras = fiestaLista
    .map((f) => ({ ...f, dateObj: parseISODateLocal(f.date) }))
    .filter((f) => !isNaN(f.dateObj.getTime()) && f.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Tomar las próximas 5 fechas distintas con eventos (sin limitar a 7 días)
  const seen = new Set<string>();
  const result: { label: string; date: Date; key: string }[] = [];

  for (const f of futuras) {
    if (!seen.has(f.date)) {
      seen.add(f.date);
      result.push({ key: f.date, date: f.dateObj, label: formatSpanishLong(f.dateObj) });
      if (result.length >= 5) break;
    }
  }

  return result;
}

function getEventosPorFecha(fiestaLista: Fiesta[], dateKey: string): Fiesta[] {
  const byDate = fiestaLista.filter(f => f.date === dateKey);
  // Madrugada (00:00–05:59) cuenta como final del día
  const parseTime = (t: string) => {
    const [hh, mm] = (t || "00:00").split(":").map(Number);
    let minutes = (hh || 0) * 60 + (mm || 0);
    // Si es madrugada (00:00–05:59), lo empujamos al final del día
    if (!isNaN(hh) && hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.time) - parseTime(b.time));
}

function getFranjaHorariaLabel(time: string): string {
  const [hhStr, mmStr] = (time || "00:00").split(":");
  const hh = Number(hhStr);
  // Mañana: 06:00–13:59, Tarde: 14:00–20:59, Noche: 21:00–05:59
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}

export default function ProximasPage() {
  const secciones = getSecciones(fiestasData);

  return (
    <main className="min-h-screen bg-[#FFF5BA] text-[#0C2335]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        {/* Headline */}
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-tight">
          Enterate de todas las proximas fiestas de <strong className="block mt-2">MATET</strong>
        </h1>

        {/* Divider rows of chips */}
        <div className="mt-5 border-t border-[#0C2335]" />
        {secciones.length === 0 ? (
          <div className="py-2 text-[12px] italic">Sin próximas fiestas</div>
        ) : (
          <>
            {secciones.map((sec, idx) => (
              <div key={sec.key}>
                <div
                  className="text-lg uppercase tracking-[0.18em] py-2 cursor-pointer"
                >
                  <span className="border-b border-transparent">{sec.label}</span>
                </div>
                <>
                  <div className="p-2 text-base">
                    {getEventosPorFecha(fiestasData, sec.key).length === 0 ? (
                      <div className="italic">Sin eventos para este día</div>
                    ) : (
                      <ul className="space-y-1">
                        {getEventosPorFecha(fiestasData, sec.key).map((ev, i) => (
                          <li key={i} className="text-lg">
                            A las {ev.time} {getFranjaHorariaLabel(ev.time)}{ev.provisional && " *"} - {ev.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/*
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
                  */}
                </>
                <div className="border-t border-[#0C2335]" />
              </div>
            ))}
            {secciones.length > 0 && secciones.length < 5 && (
              <>
                <div className="border-t border-[#0C2335]" />
                <div className="text-lg uppercase tracking-[0.18em] py-2">
                  <span className="border-b border-transparent">¡Próximamente más! 🚀</span>
                </div>
                <div className="border-t border-[#0C2335]" />
              </>
            )}
            {fiestasData.some(f => f.provisional) && (
              <p className="mt-4 text-sm italic">
                *La hora es provisional y puede variar.
              </p>
            )}
          </>
        )}

        {/* Call to action serif */}
        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight">Matet</p>
          <p className="font-serif text-[28px] leading-tight">es su gente</p>
          <p className="mt-2 text-[12px]">@comision2026</p>
        </div>
      </div>
    </main>
  );
}