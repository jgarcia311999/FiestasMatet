import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* USERS */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 191 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
});

/* EVENTS (fiestas) */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  // Combina date + time en un solo campo timestamp (UTC)
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 200 }).notNull(),
  provisional: boolean("provisional").default(false).notNull(),
  // Lista de asistentes (nombres) tal y como la manejas ahora
  attendees: jsonb("attendees"), // $type<string[]>() si quieres tipado más estricto en consultas
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
});

/* IDEAS: secciones + items */
export const ideaSections = pgTable("idea_sections", {
  key: varchar("key", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
});

export const ideaItems = pgTable("idea_items", {
  id: serial("id").primaryKey(),
  sectionKey: varchar("section_key", { length: 64 }).notNull().references(() => ideaSections.key, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* RELATIONS (opcional, por si las usas en Drizzle) */
export const ideaSectionsRelations = relations(ideaSections, ({ many }) => ({
  items: many(ideaItems),
}));

export const ideaItemsRelations = relations(ideaItems, ({ one }) => ({
  section: one(ideaSections, {
    fields: [ideaItems.sectionKey],
    references: [ideaSections.key],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  // si en el futuro asignas ownerId/authorId, lo añadimos aquí
}));