import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",   // ajusta la ruta si tu schema.ts está en otra carpeta
  out: "./drizzle",               // carpeta donde se generarán las migraciones
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
