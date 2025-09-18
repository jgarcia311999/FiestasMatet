// scripts/seed-events.ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { events } from "../src/db/schema";
type JsonEvent = {
  id?: number;
  title: string;
  img?: string | null;
  description?: string | null;
  starts_at: string; // UTC string from JSON
  location?: string | null;
  provisional?: boolean | null;
  attendees?: string[] | null;
  tags?: string[] | null;
};
import eventsData from "../events.json"; // ajusta la ruta si guardas el JSON en otra carpeta
const eventsDataTyped = eventsData as unknown as JsonEvent[];

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("🌱 Seeding events from JSON...");

  await db.delete(events);
  console.log("🗑️ Existing events deleted");

  const rows: typeof events.$inferInsert[] = eventsDataTyped.map((ev) => {
    const startsAt = new Date(ev.starts_at);
    return {
      title: ev.title,
      startsAt,
      // Si tu columna `location` es NOT NULL, damos valor por defecto "" cuando falte.
      location: ev.location ?? "",
      // Si `img` y `description` son NULLABLE en el esquema, pasamos null cuando no vengan.
      // Si `provisional` es NOT NULL con default false, enviamos false si falta.
      provisional: ev.provisional ?? false,
      // Evitamos `any`: asumimos columna nullable tipo text[]/jsonb[] -> string[] | null
      attendees: ev.attendees ?? null,
      tags: ev.tags ?? [],
    } satisfies typeof events.$inferInsert;
  });

  await db.insert(events).values(rows).onConflictDoNothing();

  console.log("✅ Events inserted");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});