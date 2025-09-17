import { db } from "@/db/client";
import { events } from "@/db/schema";
import { InferModel } from "drizzle-orm";

const MADRID_TZ = "Europe/Madrid";

type Event = InferModel<typeof events>;

function formatSpanishLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: MADRID_TZ,
  }).format(date);
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatHHMMMadrid(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function hourMinuteMadrid(date: Date): { hour: number; minute: number } {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(date);
  const minuteStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return { hour: parseInt(hourStr, 10), minute: parseInt(minuteStr, 10) };
}

function getSecciones(eventos: Event[]): { label: string; date: Date; key: string }[] {
  const todayKey = dateKeyMadrid(new Date());

  const futuras = eventos
    .filter(e => e.startsAt && dateKeyMadrid(e.startsAt) >= todayKey)
    .sort((a, b) => a.startsAt!.getTime() - b.startsAt!.getTime());

  const seen = new Set<string>();
  const result: { label: string; date: Date; key: string }[] = [];

  for (const e of futuras) {
    const key = dateKeyMadrid(e.startsAt!);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ key, date: e.startsAt!, label: formatSpanishLong(e.startsAt!) });
      if (result.length >= 5) break;
    }
  }

  return result;
}

function getEventosPorFecha(eventos: Event[], dateKey: string): Event[] {
  const byDate = eventos.filter(e => e.startsAt && dateKeyMadrid(e.startsAt) === dateKey);
  const parseTime = (d: Date) => {
    const { hour: hh, minute: mm } = hourMinuteMadrid(d);
    let minutes = hh * 60 + mm;
    if (hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.startsAt!) - parseTime(b.startsAt!));
}

function getFranjaHorariaLabel(date: Date): string {
  const { hour: hh } = hourMinuteMadrid(date);
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}

export default async function ProximasPage() {
  const allEvents = await db.select().from(events);
  const secciones = getSecciones(allEvents);

  return (
    <main className="min-h-screen bg-[#FFF5BA] text-[#0C2335]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-tight">
          Descubre las <strong>proximas</strong> fiestas de <strong>MATET</strong>
        </h1>

        <div className="mt-5 border-t border-[#0C2335]" />
        {secciones.length === 0 ? (
          <div className="py-2 text-[12px] italic">Sin próximas fiestas</div>
        ) : (
          <>
            {secciones.map((sec) => (
              <div key={sec.key}>
                <div className="text-lg uppercase tracking-[0.18em] py-2 cursor-pointer">
                  <span className="border-b border-transparent">{sec.label}</span>
                </div>
                <div className="p-2 text-base">
                  {getEventosPorFecha(allEvents, sec.key).length === 0 ? (
                    <div className="italic">Sin eventos para este día</div>
                  ) : (
                    <ul className="space-y-1">
                      {getEventosPorFecha(allEvents, sec.key).map((ev) => (
                        <li key={ev.id} className="text-lg">
                          {(() => {
                            const d = ev.startsAt!;
                            const hora = formatHHMMMadrid(d);
                            return (
                              <>
                                A las {hora} {getFranjaHorariaLabel(d)}
                              </>
                            );
                          })()}
                          {ev.provisional && " *"} - {ev.title}
                          {ev.location ? <span> ({ev.location})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
            {allEvents.some(f => f.provisional) && (
              <p className="mt-4 text-sm italic">
                *La hora es provisional y puede variar.
              </p>
            )}
          </>
        )}

        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight">Matet</p>
          <p className="font-serif text-[28px] leading-tight">es su gente</p>
          <p className="mt-2 text-[12px]">@comision2026</p>
        </div>
      </div>
    </main>
  );
}