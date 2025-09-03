import type { IdeasData } from "./ideas.types";

export const ideasData: IdeasData = [
  {
    "key": "sec-fiestas",
    "title": "Actividades de fiesta",
    "items": [
      {
        "id": "dj",
        "text": "Duelo de djs"
      },
      {
        "id": "disco-ruedas",
        "text": "Disco móvil sobre ruedas: de la plaza a la piscina y volver."
      },
      {
        "id": "rey-reina",
        "text": "Rey y reina de fiesta"
      },
      {
        "id": "noche-tematica",
        "text": "Noche temática: ibicenca, hawaiana, fluorescente, disfraces improvisados"
      },
      {
        "id": "premios-tontos",
        "text": "Entrega de premios tontos (ej: “el que más baila”, “el que más canta”, “el más ligón/a de la fiesta”)."
      },
      {
        "id": "photocall",
        "text": "Photocall del pueblo con accesorios y un mural pintado"
      },
      {
        "id": "libro-firmas",
        "text": "Libro de firmas / recuerdos de la fiesta"
      }
    ]
  },
  {
    "key": "sec-juegos",
    "title": "Juegos y competiciones",
    "items": [
      {
        "id": "hundir-flota",
        "text": "Hundir la flota por equipos, pero, con chupitos"
      },
      {
        "id": "beer-pong",
        "text": "Campeonato de beer pong gigante (con cubos y pelotas grandes)."
      },
      {
        "id": "videojuegos",
        "text": "Torneo de videojuegos"
      },
      {
        "id": "juegos-barra",
        "text": "Juegos en la barra: un cronómetro, el que lo pare a los 10s, cubata gratis, participación 1€"
      },
      {
        "id": "futbol-bolas",
        "text": "Fútbol de bolas gigantes rollo humor amarillo"
      }
    ]
  },
  {
    "key": "sec-concursos",
    "title": "Concursos",
    "items": [
      {
        "id": "carrera-bicis",
        "text": "Carrera de bicis"
      },
      {
        "id": "concurso-tapas",
        "text": "Concurso de tapas (para semana santa)"
      },
      {
        "id": "concurso-plastelina",
        "text": "Concurso de plastelina"
      }
    ]
  },
  {
    "key": "sec-extras",
    "title": "Extras y recuerdos",
    "items": [
      {
        "id": "llaveros",
        "text": "Hacer llaveros personalizados, para la comisión, de metal"
      },
      {
        "id": "perseidas",
        "text": "Al acabar el cine/jotas/mago/espectaculo, todo el mundo a la era a ver las perseidas (lagrimas de San Lorenzo)"
      }
    ]
  }
] as const;

export default ideasData;
