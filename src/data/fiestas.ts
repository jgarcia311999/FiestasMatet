// src/data/fiestas.ts
export type Fiesta = {
    title: string;
    img: string;
    description: string;
    date: string;   // YYYY-MM-DD
    time: string;   // HH:mm
    location: string;
    attendees?: string[];
};

export const fiestas: Fiesta[
    ] = [
    { title: "Día de los jubilados 2", img: "/bannerGenerico.png", description: "Jornada dedicada a nuestros mayores.", date: "2025-08-08", time: "12:00", location: "Jubilados", attendees: ["Jesus","Carla"]},
    { title: "Merienda con Dúo Musical Gonsy", img: "/bannerDisco.png", description: "Merienda de confraternidad amenizada por Gonsy.", date: "2025-08-08", time: "20:30", location: "" },
    { title: "Concurso de adornos de balcones", img: "/bannerGenerico.png", description: "Inicio del 5º concurso (hasta el 17 a las 12:00).", date: "2025-08-09", time: "09:00", location: "" },
    { title: "Torneo de fútbol sala", img: "/bannerGenerico.png", description: "Eliminatorias del torneo.", date: "2025-08-09", time: "18:00", location: "" },
    { title: "Disco móvil con animación", img: "/bannerDisco.png", description: "Música y animación para todos.", date: "2025-08-09", time: "23:59", location: "" },
    { title: "Torneo de fútbol sala", img: "/bannerGenerico.png", description: "Nueva jornada del torneo.", date: "2025-08-10", time: "18:00", location: "" },
    { title: "Disco móvil", img: "/bannerDisco.png", description: "Sesión nocturna.", date: "2025-08-10", time: "23:59", location: "" },
    { title: "Tardeo en la plaza", img: "/bannerGenerico.png", description: "Música ambiente y tapas.", date: "2025-08-30", time: "19:00", location: "" },
    { title: "Verbena popular", img: "/bannerDisco.png", description: "Música hasta la madrugada.", date: "2025-08-30", time: "23:00", location: "" },
    { title: "Cine al aire libre", img: "/bannerNinyos.png", description: "Proyección familiar bajo las estrellas.", date: "2025-09-01", time: "22:00", location: "" },
    // { title: "Taller de astronomía", img: "/bannerGenerico.png", description: "Observación de estrellas con telescopio.", date: "2025-09-01", time: "20:00", location: "" },
    { title: "Taller infantil de manualidades", img: "/bannerNinyos.png", description: "Actividades creativas para peques.", date: "2025-09-02", time: "18:00", location: "" },
    { title: "Exposición de pintura local", img: "/bannerGenerico.png", description: "Muestra de artistas de Matet.", date: "2025-09-02", time: "19:30", location: "" },
    { title: "Concierto acústico en la fuente 2222", img: "/bannerDisco.png", description: "Repertorio acústico para todos los públicos.", date: "2025-09-04", time: "21:30", location: "" },
    { title: "Monólogo cómico", img: "/bannerGenerico.png", description: "Sesión de humor para todos.", date: "2025-09-04", time: "23:00", location: "" },
    { title: "Ruta guiada por el casco antiguo", img: "/bannerGenerico.png", description: "Paseo comentado por las calles de Matet.", date: "2025-09-06", time: "10:00", location: "" },
    { title: "Degustación gastronómica", img: "/bannerGenerico.png", description: "Tapas y productos locales.", date: "2025-09-06", time: "13:00", location: "" },
    { title: "Torneo de guiñote", img: "/bannerGenerico.png", description: "Inscripciones media hora antes.", date: "2025-09-07", time: "17:00", location: "" },
    { title: "Cine clásico", img: "/bannerNinyos.png", description: "Proyección de una película clásica.", date: "2025-09-07", time: "22:00", location: "" },
    { title: "DJ Sunset en la era", img: "/bannerDisco.png", description: "Sesión al atardecer.", date: "2025-09-09", time: "20:00", location: "" },
    { title: "Noche de karaoke", img: "/bannerDisco.png", description: "Diversión cantando en grupo.", date: "2025-09-09", time: "23:30", location: "" },
    { title: "Mercadillo de artesanía", img: "/bannerGenerico.png", description: "Puestos locales y productos de proximidad.", date: "2025-09-10", time: "11:00", location: "" },
    { title: "Exhibición de danza", img: "/bannerGenerico.png", description: "Actuación de danza folclórica.", date: "2025-09-10", time: "19:00", location: "" },
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
    // { title: "eeee", img: "", description: "rrr", date: "2025-09-05", time: "12:01", location: "eee" }
];
