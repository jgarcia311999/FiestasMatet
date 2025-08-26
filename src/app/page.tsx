"use client";
import { useEffect, useRef, useState } from "react";

type CardProps = { img: string; title: string; description: string; date: string; time: string };

function Card({ img, title, description, date, time }: CardProps) {
  return (
    <article className="min-w-[220px] rounded-3xl bg-white p-4 shadow">
      <div className="h-40 w-full overflow-hidden rounded-2xl bg-gray-200">
        <img src={img} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 px-2">
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        <p className="mt-2 text-xs text-gray-600">{description}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <time>{date}</time>
          <time>{time}</time>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const tabs = ["Proximas", "Por la mañana", "Por la tarde", "Por la noche", "Todas"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Proximas");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fiestas = [
    // --- AGOSTO (primeras tres se mantienen en agosto) ---
    { title: "Día de los jubilados", img: "/next.svg", description: "Jornada dedicada a nuestros mayores.", date: "2025-08-08", time: "12:00" },
    { title: "Merienda con Dúo Musical Gonsy", img: "/next.svg", description: "Merienda de confraternidad amenizada por Gonsy.", date: "2025-08-08", time: "20:30" },

    { title: "Concurso de adornos de balcones", img: "/next.svg", description: "Inicio del 5º concurso (hasta el 17 a las 12:00).", date: "2025-08-09", time: "09:00" },
    { title: "Torneo de fútbol sala", img: "/next.svg", description: "Eliminatorias del torneo.", date: "2025-08-09", time: "18:00" },
    { title: "Disco móvil con animación", img: "/next.svg", description: "Música y animación para todos.", date: "2025-08-09", time: "23:59" },

    { title: "Torneo de fútbol sala", img: "/next.svg", description: "Nueva jornada del torneo.", date: "2025-08-10", time: "18:00" },
    { title: "Disco móvil", img: "/next.svg", description: "Sesión nocturna.", date: "2025-08-10", time: "23:59" },

    // --- SEPTIEMBRE (resto de eventos pasan a septiembre) ---
    { title: "Parque infantil", img: "/next.svg", description: "Atracciones infantiles para los peques.", date: "2025-09-11", time: "18:00" },
    { title: "Cine Búfalo Kids", img: "/next.svg", description: "Sesión de cine para público infantil.", date: "2025-09-11", time: "23:30" },

    { title: "Teatro: Las aventuras de Elsa y Pato", img: "/next.svg", description: "Espectáculo teatral familiar.", date: "2025-09-12", time: "23:00" },

    { title: "Concurso de paellas", img: "/next.svg", description: "Tradicional concurso popular.", date: "2025-09-13", time: "21:00" },
    { title: "Noche de Playbacks", img: "/next.svg", description: "Actuaciones y diversión.", date: "2025-09-13", time: "23:59" },

    { title: "Volteo de campanas y cohetes", img: "/next.svg", description: "Inicio oficial de fiestas.", date: "2025-09-14", time: "13:30" },
    { title: "Cabalgata de disfraces", img: "/next.svg", description: "Desfile y reparto de fartons con horchata.", date: "2025-09-14", time: "19:00" },
    { title: "Orquesta LEGADO", img: "/next.svg", description: "Baile y música en directo.", date: "2025-09-14", time: "23:59" },

    { title: "Pasacalles (Asunción)", img: "/next.svg", description: "Celebración de Ntra. Sra. de la Asunción.", date: "2025-09-15", time: "11:30" },
    { title: "Eucaristía solemne (Asunción)", img: "/next.svg", description: "Misa mayor en honor a la Virgen.", date: "2025-09-15", time: "12:00" },
    { title: "Procesión (Asunción)", img: "/next.svg", description: "Procesión por las calles del pueblo.", date: "2025-09-15", time: "21:00" },
    { title: "Orquesta CONTRABANDA", img: "/next.svg", description: "Verbena nocturna.", date: "2025-09-15", time: "23:59" },

    { title: "Volteo y cohetes (Virgen del Rosario)", img: "/next.svg", description: "Inicio de las fiestas de la Virgen del Rosario.", date: "2025-09-16", time: "13:30" },
    { title: "Ofrenda de flores", img: "/next.svg", description: "Ofrenda a la Virgen.", date: "2025-09-16", time: "20:00" },
    { title: "Rock en Matet", img: "/next.svg", description: "MENUDA G-TA + EL SALMÓN (tributo) + Disco móvil.", date: "2025-09-16", time: "23:59" },

    { title: "Pasacalles y recogida de Clavarias", img: "/next.svg", description: "Fiesta en honor a Ntra. Sra. del Rosario.", date: "2025-09-17", time: "11:30" },
    { title: "Eucaristía solemne (Rosario)", img: "/next.svg", description: "Misa mayor.", date: "2025-09-17", time: "12:00" },
    { title: "Procesión (Rosario)", img: "/next.svg", description: "Procesión y traca final.", date: "2025-09-17", time: "21:00" },
    { title: "Orquesta VENUS", img: "/next.svg", description: "Verbena nocturna.", date: "2025-09-17", time: "23:59" },

    { title: "Día de Almas: Eucaristía en la Ermita", img: "/next.svg", description: "Misa en Santa Bárbara.", date: "2025-09-18", time: "10:30" },
    { title: "Montaje de barreras", img: "/next.svg", description: "Preparativos para los toros.", date: "2025-09-18", time: "09:00" },

    { title: "Montaje de barreras", img: "/next.svg", description: "Trabajos durante todo el día.", date: "2025-09-19", time: "09:00" },
    { title: "Montaje de barreras", img: "/next.svg", description: "Trabajos durante todo el día.", date: "2025-09-20", time: "09:00" },
    { title: "Montaje de barreras", img: "/next.svg", description: "Trabajos durante todo el día.", date: "2025-09-21", time: "09:00" },
    { title: "Toro embolado (La Morada)", img: "/next.svg", description: "Espectáculo nocturno.", date: "2025-09-21", time: "00:30" },

    { title: "1º Día de toros: Entrada infantil", img: "/next.svg", description: "Actividades infantiles.", date: "2025-09-22", time: "11:00" },
    { title: "Entrada y prueba (Capota)", img: "/next.svg", description: "Entrada de toros y prueba de ganado.", date: "2025-09-22", time: "14:00" },
    { title: "Suelta y toro de la merienda (Capota)", img: "/next.svg", description: "Tarde de vaquillas.", date: "2025-09-22", time: "18:00" },
    { title: "Toro embolado (Capota)", img: "/next.svg", description: "Espectáculo nocturno.", date: "2025-09-22", time: "23:59" },

    { title: "2º Día de toros: Entrada infantil", img: "/next.svg", description: "Actividades infantiles.", date: "2025-09-23", time: "11:00" },
    { title: "Pasacalle Xarançaina", img: "/next.svg", description: "Agrupación Musical Xaranga Xarançaina.", date: "2025-09-23", time: "13:00" },
    { title: "Entrada y prueba (El Cid)", img: "/next.svg", description: "Entrada de toros y prueba de ganado.", date: "2025-09-23", time: "14:00" },
    { title: "Suelta y toro de la merienda (El Cid)", img: "/next.svg", description: "Tarde de vaquillas.", date: "2025-09-23", time: "18:00" },
    { title: "Toro embolado (El Cid)", img: "/next.svg", description: "Espectáculo nocturno.", date: "2025-09-23", time: "23:59" },

    { title: "3º Día de toros: Trashumancia de \"Mansets\"", img: "/next.svg", description: "Recorrido de reses por las calles.", date: "2025-09-24", time: "12:30" },
    { title: "Entrada y prueba (La Morada)", img: "/next.svg", description: "Entrada de toros y prueba de ganado.", date: "2025-09-24", time: "14:00" },
    { title: "Suelta y toro de la merienda (La Morada)", img: "/next.svg", description: "Cierre taurino de tarde.", date: "2025-09-24", time: "18:00" },
  ];

  // Helpers for dates
  const today = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`; // YYYY-MM-DD
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
  const isSoon = (d: string) => d > todayStr && d <= next3Limit;
  const isOngoingDate = (d: string) => {
    if (d !== todayStr) return false;
    // Consider an event "en curso" si comenzó hace <= 2h y ya ha pasado su hora de inicio
    const now = new Date();
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
    const now = new Date();

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
          {fiestasFiltradas.map((f, i) => (
            <Card key={i} img={f.img} title={f.title} description={f.description} date={f.date} time={f.time} />
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
