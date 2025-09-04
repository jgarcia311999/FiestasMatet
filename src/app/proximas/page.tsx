export const metadata = {
  title: "Fiestas en Matet | Próximas fiestas",
  description: "Consulta las próximas fiestas y eventos en Matet. Encuentra las proximas fiestas y no te pierdas nada!",
  openGraph: {
    title: "Fiestas en Matet | Próximas fiestas",
    description: "Consulta las próximas fiestas y eventos en Matet. Encuentra las proximas fiestas y no te pierdas nada!",
    url: "https://matet-es-fiesta.vercel.app/proximas",
    siteName: "Fiestas Matet",
    images: [
      {
        url: "https://matet-es-fiesta.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};
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

function getSecciones(eventos: Event[]): { label: string; date: Date; key: string }[] {
  const today = startOfTodayLocal();

  const futuras = eventos
    .filter(e => e.startsAt && e.startsAt >= today)
    .sort((a, b) => a.startsAt!.getTime() - b.startsAt!.getTime());

  const seen = new Set<string>();
  const result: { label: string; date: Date; key: string }[] = [];

  for (const e of futuras) {
    const key = e.startsAt!.toISOString().split("T")[0];
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ key, date: e.startsAt!, label: formatSpanishLong(e.startsAt!) });
      if (result.length >= 5) break;
    }
  }

  return result;
}

function getEventosPorFecha(eventos: Event[], dateKey: string): Event[] {
  const byDate = eventos.filter(e => e.startsAt && e.startsAt.toISOString().split("T")[0] === dateKey);
  const parseTime = (d: Date) => {
    const hh = d.getHours();
    const mm = d.getMinutes();
    let minutes = hh * 60 + mm;
    if (hh >= 0 && hh < 6) minutes += 24 * 60;
    return minutes;
  };
  return byDate.sort((a, b) => parseTime(a.startsAt!) - parseTime(b.startsAt!));
}

function getFranjaHorariaLabel(date: Date): string {
  const hh = date.getHours();
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
          Enterate de todas las proximas fiestas de <strong className="block mt-2">MATET</strong>
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
                          A las {ev.startsAt?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{" "}
                          {getFranjaHorariaLabel(ev.startsAt!)}
                          {ev.provisional && " *"} - {ev.title}
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