import { db } from "@/db/client";
import { events } from "@/db/schema";
import { InferModel } from "drizzle-orm";

type Event = InferModel<typeof events>;

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
  const noComma = s.replace(", ", " ");
  return noComma.charAt(0).toUpperCase() + noComma.slice(1);
}

function getFranjaHorariaLabel(date: Date): string {
  const hh = date.getHours();
  if (hh >= 6 && hh < 14) return "de la mañana";
  if (hh >= 14 && hh < 21) return "de la tarde";
  return "de la noche";
}

function isNoche(date: Date): boolean {
  const hh = date.getHours();
  return hh >= 21 || hh < 6;
}

function getSecciones(eventsList: Event[]): { label: string; date: Date; key: string }[] {
  const today = startOfTodayLocal();
  const nocturnosFuturos = eventsList.filter(
    (f) => f.startsAt && f.startsAt >= today && isNoche(f.startsAt)
  );

  const byDate = new Map<string, Date>();
  for (const f of nocturnosFuturos) {
    const key = f.startsAt!.toISOString().split("T")[0];
    if (!byDate.has(key)) byDate.set(key, f.startsAt!);
  }

  return Array.from(byDate.entries())
    .map(([key, date]) => ({ key, date, label: formatSpanishLong(date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getEventosPorFecha(eventsList: Event[], dateKey: string): Event[] {
  const byDate = eventsList.filter(
    (f) => f.startsAt!.toISOString().split("T")[0] === dateKey && isNoche(f.startsAt!)
  );
  const parseTime = (d: Date) => {
    const hh = d.getHours();
    const mm = d.getMinutes();
    let minutes = hh * 60 + mm;
    if (hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.startsAt!) - parseTime(b.startsAt!));
}

export default async function Noche() {
  const allEvents = await db.select().from(events);
  const secciones = getSecciones(allEvents);

  return (
    <main className="min-h-screen bg-[#083279] text-[#FFD966]">
      <div className="mx-auto max-w-sm px-1 pt-10 pb-24">
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-tight text-[#FFD966]">
          Disfruta de todas las noches de fiesta de <strong className="block mt-2 text-[#FFD966]">MATET</strong>
        </h1>

        <div className="mt-5 border-t border-[#0C2335]" />
        {secciones.length === 0 ? (
          <div className="py-2 text-[12px] italic text-[#FFD966]">Sin próximas noches con eventos</div>
        ) : (
          secciones.map((sec) => (
            <div key={sec.key}>
              <div className="text-lg uppercase tracking-[0.18em] py-2 cursor-pointer text-[#FFD966]">
                <span className="border-b border-transparent">{sec.label}</span>
              </div>
              <div className="p-2 text-base">
                {getEventosPorFecha(allEvents, sec.key).length === 0 ? (
                  <div className="italic text-[#FFD966]">Sin eventos para este día</div>
                ) : (
                  <ul className="space-y-1">
                    {getEventosPorFecha(allEvents, sec.key).map((ev) => (
                      <li key={ev.id} className="text-lg text-[#FFD966]">
                        A las{" "}
                        {ev.startsAt?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{" "}
                        {getFranjaHorariaLabel(ev.startsAt!)}
                        {ev.provisional && " *"} - {ev.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-[#0C2335]" />
            </div>
          ))
        )}

        {allEvents.some((f) => f.provisional) && (
          <p className="mt-4 text-sm italic text-[#FFD966]">
            *La hora es provisional y puede variar.
          </p>
        )}

        <div className="mt-8">
          <p className="font-serif text-[28px] leading-tight text-[#FFD966]">Matet</p>
          <p className="font-serif text-[28px] leading-tight text-[#FFD966]">es su gente</p>
          <p className="mt-2 text-[12px] text-[#FFD966]">@comision2026</p>
        </div>
      </div>
    </main>
  );
}