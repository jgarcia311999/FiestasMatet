export type IdeaItem = {
  id: string;        // para editar/borrar de forma estable
  text: string;
};

export type IdeaSection = {
  key: string;       // slug único (ej: "infra", "actos")
  title: string;
  items: IdeaItem[];
};

export type IdeasData = IdeaSection[];