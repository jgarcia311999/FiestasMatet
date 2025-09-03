

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, events, ideaSections, ideaItems } from "../src/db/schema";
import { USERS } from "../src/data/users";
import { fiestas } from "../src/data/fiestas";
import ideasData from "../src/data/ideas";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log("🌱 Seeding database...");

  // Insert users
  for (const name of USERS) {
    await db.insert(users).values({ name }).onConflictDoNothing();
  }
  console.log("✅ Users inserted");

  // Insert fiestas as events
  for (const fiesta of fiestas) {
    const startsAt = new Date(`${fiesta.date}T${fiesta.time}:00`);
    await db.insert(events).values({
      title: fiesta.title,
      img: fiesta.img,
      description: fiesta.description,
      startsAt,
      location: fiesta.location,
      provisional: fiesta.provisional ?? false,
      attendees: fiesta.attendees ? JSON.stringify(fiesta.attendees) : null,
    }).onConflictDoNothing();
  }
  console.log("✅ Events inserted");

  // Insert ideasData (sections + items)
  for (const section of ideasData) {
    await db.insert(ideaSections).values({
      key: section.key,
      title: section.title,
    }).onConflictDoNothing();

    for (const item of section.items) {
      await db.insert(ideaItems).values({
        sectionKey: section.key,
        text: item.text,
      }).onConflictDoNothing();
    }
  }
  console.log("✅ Ideas inserted");

  console.log("🌱 Seeding finished!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});