// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://matet-es-fiesta.vercel.app";

  // TODO: aquí iría la llamada a tu BD o API para traer eventos
  // const events = await fetch(`${baseUrl}/api/events`).then(res => res.json());

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/todas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Si quieres incluir dinámicamente cada evento:
    // ...events.map((event: any) => ({
    //   url: `${baseUrl}/eventos/${event.id}`,
    //   lastModified: new Date(event.updatedAt ?? event.createdAt),
    //   changeFrequency: "weekly",
    //   priority: 0.6,
    // })),
  ];
}