"use client";
import { useEffect, useRef, useState } from "react";

type CardProps = {
  img?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  isSingle?: boolean;
  isPast?: boolean;
  onToggle?: () => void;
  forceExpanded?: boolean;
};

function ClientDate({ isoDate }: { isoDate: string }) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    setFormatted(
      new Date(isoDate + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).toUpperCase()
    );
  }, [isoDate]);
  return formatted ? <time className="block text-sm font-bold text-gray-800">{formatted}</time> : null;
}

function Card({
  img,
  title,
  description,
  date,
  time,
  location,
  isSingle,
  isPast,
  onToggle,
  forceExpanded,
}: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const hour = parseInt(time.split(":")[0], 10);
  let label = "";
  if (hour >= 9 && hour < 15) label = "Por la mañana";
  else if (hour >= 15 && hour < 22) label = "Por la tarde";
  else label = "Por la noche";

  const isExpanded = forceExpanded || expanded;

  return (
    <article
      className={
        (isSingle ? "" : "border-b border-gray-200 ") +
        "pb-4 bg-transparent shadow-none rounded-none" +
        (isPast ? " opacity-50 pointer-events-none" : "")
      }
    >
      {/* Hora y ubicación */}
      <div
        className="flex items-center gap-1 text-xs text-gray-500"
        onClick={() => {
          if (onToggle) {
            onToggle();
          } else if (!forceExpanded) {
            setExpanded((prev) => !prev);
          }
        }}
        style={{ cursor: onToggle || !forceExpanded ? "pointer" : undefined }}
      >
        <span>
          {label}, a las {time}
        </span>
        {location && (
          <span className="flex items-center gap-1">
            📍 <span>{location}</span>
          </span>
        )}
      </div>

      {/* Imagen opcional */}
      {img && (
        <div className="mt-2 h-40 w-full overflow-hidden rounded-2xl bg-gray-200">
          <img src={img} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Título */}
      <h3 className="mt-2 text-base font-semibold text-gray-800">{title}</h3>

      {/* Descripción */}
      <p className="mt-1 text-sm text-gray-700">{description}</p>
    </article>
  );
}

export default function Home() {
  const tabs = ["Proximas", "Por la mañana", "Por la tarde", "Por la noche", "Todas"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Proximas");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  // Track expanded cards by unique key `${date}-${time}`
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const fiestas = [
    // --- AGOSTO (primeras tres se mantienen en agosto) ---
    { title: "Día de los jubilados", img: "/bannerGenerico.png", description: "Jornada dedicada a nuestros mayores.", date: "2025-08-08", time: "12:00", location: "" },
    { title: "Merienda con Dúo Musical Gonsy", img: "/bannerDisco.png", description: "Merienda de confraternidad amenizada por Gonsy.", date: "2025-08-08", time: "20:30", location: "" },

    { title: "Concurso de adornos de balcones", img: "/bannerGenerico.png", description: "Inicio del 5º concurso (hasta el 17 a las 12:00).", date: "2025-08-09", time: "09:00", location: "" },
    { title: "Torneo de fútbol sala", img: "/bannerGenerico.png", description: "Eliminatorias del torneo.", date: "2025-08-09", time: "18:00", location: "" },
    { title: "Disco móvil con animación", img: "/bannerDisco.png", description: "Música y animación para todos.", date: "2025-08-09", time: "23:59", location: "" },

    { title: "Torneo de fútbol sala", img: "/bannerGenerico.png", description: "Nueva jornada del torneo.", date: "2025-08-10", time: "18:00", location: "" },
    { title: "Disco móvil", img: "/bannerDisco.png", description: "Sesión nocturna.", date: "2025-08-10", time: "23:59", location: "" },

    // --- SEPTIEMBRE (resto de eventos pasan a septiembre) ---
    { title: "Parque infantil", img: "/bannerNinyos.png", description: "Atracciones infantiles para los peques.", date: "2025-09-11", time: "18:00", location: "" },
    { title: "Cine Búfalo Kids", img: "/bannerNinyos.png", description: "Sesión de cine para público infantil.", date: "2025-09-11", time: "23:30", location: "" },

    { title: "Teatro: Las aventuras de Elsa y Pato", img: "/bannerGenerico.png", description: "Espectáculo teatral familiar.", date: "2025-09-12", time: "23:00", location: "" },

    { title: "Concurso de paellas", img: "/bannerGenerico.png", description: "Tradicional concurso popular.", date: "2025-09-13", time: "21:00", location: "" },
    { title: "Noche de Playbacks", img: "/bannerDisco.png", description: "Actuaciones y diversión.", date: "2025-09-13", time: "23:59", location: "" },

    { title: "Volteo de campanas y cohetes", img: "/bannerGenerico.png", description: "Inicio oficial de fiestas.", date: "2025-09-14", time: "13:30", location: "" },
    { title: "Cabalgata de disfraces", img: "/bannerGenerico.png", description: "Desfile y reparto de fartons con horchata.", date: "2025-09-14", time: "19:00", location: "" },
    { title: "Orquesta LEGADO", img: "/bannerDisco.png", description: "Baile y música en directo.", date: "2025-09-14", time: "23:59", location: "" },

    { title: "Pasacalles (Asunción)", img: "/bannerGenerico.png", description: "Celebración de Ntra. Sra. de la Asunción.", date: "2025-09-15", time: "11:30", location: "" },
    { title: "Eucaristía solemne (Asunción)", img: "/bannerGenerico.png", description: "Misa mayor en honor a la Virgen.", date: "2025-09-15", time: "12:00", location: "" },
    { title: "Procesión (Asunción)", img: "/bannerGenerico.png", description: "Procesión por las calles del pueblo.", date: "2025-09-15", time: "21:00", location: "" },
    { title: "Orquesta CONTRABANDA", img: "/bannerDisco.png", description: "Verbena nocturna.", date: "2025-09-15", time: "23:59", location: "" },

    { title: "Volteo y cohetes (Virgen del Rosario)", img: "/bannerGenerico.png", description: "Inicio de las fiestas de la Virgen del Rosario.", date: "2025-09-16", time: "13:30", location: "" },
    { title: "Ofrenda de flores", img: "/bannerGenerico.png", description: "Ofrenda a la Virgen.", date: "2025-09-16", time: "20:00", location: "" },
    { title: "Rock en Matet", img: "/bannerDisco.png", description: "MENUDA G-TA + EL SALMÓN (tributo) + Disco móvil.", date: "2025-09-16", time: "23:59", location: "" },

    { title: "Pasacalles y recogida de Clavarias", img: "/bannerGenerico.png", description: "Fiesta en honor a Ntra. Sra. del Rosario.", date: "2025-09-17", time: "11:30", location: "" },
    { title: "Eucaristía solemne (Rosario)", img: "/bannerGenerico.png", description: "Misa mayor.", date: "2025-09-17", time: "12:00", location: "" },
    { title: "Procesión (Rosario)", img: "/bannerGenerico.png", description: "Procesión y traca final.", date: "2025-09-17", time: "21:00", location: "" },
    { title: "Orquesta VENUS", img: "/bannerDisco.png", description: "Verbena nocturna.", date: "2025-09-17", time: "23:59", location: "" },

    { title: "Día de Almas: Eucaristía en la Ermita", img: "/bannerGenerico.png", description: "Misa en Santa Bárbara.", date: "2025-09-18", time: "10:30", location: "" },
    { title: "Montaje de barreras", img: "/bannerToros.png", description: "Preparativos para los toros.", date: "2025-09-18", time: "09:00", location: "" },

    { title: "Montaje de barreras", img: "/bannerToros.png", description: "Trabajos durante todo el día.", date: "2025-09-19", time: "09:00", location: "" },
    { title: "Montaje de barreras", img: "/bannerToros.png", description: "Trabajos durante todo el día.", date: "2025-09-20", time: "09:00", location: "" },
    { title: "Montaje de barreras", img: "/bannerToros.png", description: "Trabajos durante todo el día.", date: "2025-09-21", time: "09:00", location: "" },
    { title: "Toro embolado (La Morada)", img: "/bannerToros.png", description: "Espectáculo nocturno.", date: "2025-09-21", time: "00:30", location: "" },

    { title: "1º Día de toros: Entrada infantil", img: "/bannerToros.png", description: "Actividades infantiles.", date: "2025-09-22", time: "11:00", location: "" },
    { title: "Entrada y prueba (Capota)", img: "/bannerToros.png", description: "Entrada de toros y prueba de ganado.", date: "2025-09-22", time: "14:00", location: "" },
    { title: "Suelta y toro de la merienda (Capota)", img: "/bannerToros.png", description: "Tarde de vaquillas.", date: "2025-09-22", time: "18:00", location: "" },
    { title: "Toro embolado (Capota)", img: "/bannerToros.png", description: "Espectáculo nocturno.", date: "2025-09-22", time: "23:59", location: "" },

    { title: "2º Día de toros: Entrada infantil", img: "/bannerToros.png", description: "Actividades infantiles.", date: "2025-09-23", time: "11:00", location: "" },
    { title: "Pasacalle Xarançaina", img: "/bannerGenerico.png", description: "Agrupación Musical Xaranga Xarançaina.", date: "2025-09-23", time: "13:00", location: "" },
    { title: "Entrada y prueba (El Cid)", img: "/bannerToros.png", description: "Entrada de toros y prueba de ganado.", date: "2025-09-23", time: "14:00", location: "" },
    { title: "Suelta y toro de la merienda (El Cid)", img: "/bannerToros.png", description: "Tarde de vaquillas.", date: "2025-09-23", time: "18:00", location: "" },
    { title: "Toro embolado (El Cid)", img: "/bannerToros.png", description: "Espectáculo nocturno.", date: "2025-09-23", time: "23:59", location: "" },

    { title: "3º Día de toros: Trashumancia de \"Mansets\"", img: "/bannerToros.png", description: "Recorrido de reses por las calles.", date: "2025-09-24", time: "12:30", location: "" },
    { title: "Entrada y prueba (La Morada)", img: "/bannerToros.png", description: "Entrada de toros y prueba de ganado.", date: "2025-09-24", time: "14:00", location: "" },
    { title: "Suelta y toro de la merienda (La Morada)", img: "/bannerToros.png", description: "Cierre taurino de tarde.", date: "2025-09-24", time: "18:00", location: "" },
  ];

  // Helpers for dates
  const [now, setNow] = useState<Date>(new Date());
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const addDays = (iso: string, days: number) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const next3Limit = addDays(todayStr, 3);
  const formatShort = (isoDate: string) => {
    const d = new Date(isoDate + "T00:00:00");
    const day = d.getDate();
    const month = d.getMonth() + 1; // 1-12
    return `${day}/${month}`; // 18/8
  };
  const uniqueDates = Array.from(new Set(fiestas.map((f) => f.date))).sort();
  const futureDates = uniqueDates.filter((d) => d >= todayStr);
  const orderedDates = [...futureDates];

  // Badge helpers
  const isSoon = (d: string) => {
    if (!now || !todayStr || !next3Limit) return false;
    return d > todayStr && d <= next3Limit;
  };
  const isOngoingDate = (d: string) => {
    if (!now || d !== todayStr) return false;
    // Consider an event "en curso" si comenzó hace <= 2h y ya ha pasado su hora de inicio
    return fiestas.some((f) => {
      if (f.date !== d) return false;
      const start = new Date(`${f.date}T${f.time}:00`);
      const diffMs = now.getTime() - start.getTime();
      return diffMs >= 0 && diffMs <= 2 * 60 * 60 * 1000; // dentro de 2h desde el inicio
    });
  };

  // Refs para auto-scroll centrado
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());


  // Auto-scroll: centra el chip seleccionado en el carrusel de fechas
  useEffect(() => {
    const container = scrollerRef.current;
    const chip = selectedDate ? chipRefs.current.get(selectedDate) : null;
    if (!container || !chip) return;
    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const offsetLeft = chip.offsetLeft - container.offsetLeft;
    const target = offsetLeft - containerRect.width / 2 + chipRect.width / 2;
    container.scrollTo({ left: target, behavior: "smooth" });
  }, [selectedDate]);

  function filterFiestas() {
    return fiestas.filter((f) => {
      const fiestaDate = new Date(`${f.date}T${f.time}:00`);
      const hour = fiestaDate.getHours();

      const dateMatch = selectedDate ? f.date === selectedDate : true;

      let timeMatch = true;
      switch (activeTab) {
        case "Por la mañana":
          timeMatch = hour >= 9 && hour < 15;
          break;
        case "Por la tarde":
          timeMatch = hour >= 15 && hour < 22;
          break;
        case "Por la noche":
          timeMatch = hour >= 22 || hour < 9;
          break;
        case "Proximas":
          timeMatch = fiestaDate >= now;
          break;
        case "Todas":
        default:
          timeMatch = true;
      }

      return dateMatch && timeMatch;
    });
  }

  const fiestasFiltradas = filterFiestas();

  // Group fiestas by date
  function groupByDate(events: typeof fiestasFiltradas) {
    const grouped: Record<string, typeof fiestasFiltradas> = {};
    events.forEach((f) => {
      if (!grouped[f.date]) grouped[f.date] = [];
      grouped[f.date].push(f);
    });
    return grouped;
  }
  const groupedFiestas = groupByDate(fiestasFiltradas);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-sm px-5 pb-32 pt-7">
        {/* Top bar */}
        <div className="flex justify-end gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow"
            aria-label="Elegir día"
            onClick={() => setShowDatePicker(true)}
          >
            📅
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow" aria-label="Search">🔍</button>
        </div>

        {/* Title */}
        <h1 className="mt-5 text-3xl font-black tracking-tight text-black">Bienvenidos Matetanos</h1>
        <p className="mt-1 text-xs text-gray-500">Descubre todas las fiestas!</p>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                if (t === "Todas") {
                  setSelectedDate("");
                }
              }}
              className={
                "rounded-full px-4 py-2 text-xs font-medium transition " +
                (t === activeTab ? "bg-black text-white" : "bg-white text-gray-700 shadow")
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bottom sheet date picker */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <div className="w-full rounded-t-3xl bg-white p-6 shadow-lg">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
              <h2 className="mb-3 text-lg font-semibold">Selecciona un día</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-inner outline-none focus:ring-2 focus:ring-black/10"
              />
              <div className="mt-4 flex justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setShowDatePicker(false);
                  }}
                  className="flex-1 rounded-2xl border px-4 py-3 text-sm hover:bg-gray-100"
                >
                  Quitar fecha
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 rounded-2xl bg-black px-4 py-3 text-sm text-white"
                >
                  Confirmar
                </button>
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="mt-3 w-full text-center text-xs text-gray-500"
                aria-label="Cerrar selector"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Cards list (filtered) */}
        <div className="mt-5 flex flex-col gap-4">
          {Object.entries(groupedFiestas).map(([date, events], i) => (
            <article key={i} className="rounded-3xl bg-white px-2 py-4 shadow">
              <button
                onClick={() => {
                  setExpandedDates((prev) =>
                    prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
                  );
                }}
                className="w-full text-left"
              >
                <ClientDate isoDate={date} />
              </button>
              <div className="mt-3 flex flex-col gap-3">
                {events.map((f, j) => {
                  const eventDate = new Date(`${f.date}T${f.time}:00`);
                  const isPast = eventDate < new Date();
                  const cardKey = `${f.date}-${f.time}`;
                  return (
                    <Card
                      key={j}
                      img={f.img}
                      title={f.title}
                      description={f.description}
                      date={f.date}
                      time={f.time}
                      location={f.location}
                      isSingle={events.length === 1}
                      isPast={isPast}
                      onToggle={() => {
                        setExpandedCards(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(cardKey)) newSet.delete(cardKey);
                          else newSet.add(cardKey);
                          return newSet;
                        });
                      }}
                      forceExpanded={
                        expandedDates.includes(date) ||
                        activeTab === "Por la mañana" ||
                        activeTab === "Por la tarde" ||
                        activeTab === "Por la noche" ||
                        expandedCards.has(cardKey)
                      }
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Bottom date scroller */}
      <nav className="fixed inset-x-0 bottom-4 mx-auto w-[92%] max-w-sm rounded-3xl bg-white/95 shadow-lg backdrop-blur">
        <div ref={scrollerRef} className="overflow-x-auto scroll-px-6">
          <div className="flex items-center gap-2 pl-6 pr-8 py-4">
            {orderedDates.map((d) => (
              <button
                key={d}
                ref={(el) => { chipRefs.current.set(d, el); }}
                onClick={() => {
                  if (selectedDate === d) {
                    setSelectedDate("");
                  } else {
                    setSelectedDate(d);
                    setActiveTab("Todas");
                  }
                }}
                className={
                  "relative whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-medium transition " +
                  (selectedDate === d ? "bg-black text-white" : "bg-white text-gray-700 shadow")
                }
                aria-pressed={selectedDate === d}
              >
                {formatShort(d)}
                {/* Badges */}
                {isOngoingDate(d) && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    En curso 
                  </span>
                )}
                {!isOngoingDate(d) && isSoon(d) && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Próximamente
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </main>
  );
}