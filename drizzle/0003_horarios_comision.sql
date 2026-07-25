CREATE TABLE IF NOT EXISTS "personas" (
  "id" serial PRIMARY KEY NOT NULL,
  "nombre" varchar(140) NOT NULL,
  "activo" boolean DEFAULT true NOT NULL,
  "orden" integer
);

CREATE TABLE IF NOT EXISTS "turnos" (
  "id" serial PRIMARY KEY NOT NULL,
  "fecha" date NOT NULL,
  "dia" varchar(80) NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time,
  "acto" varchar(220) NOT NULL,
  "tipo" varchar(40) NOT NULL,
  "persona_1_id" integer,
  "persona_2_id" integer,
  "apoyo_id" integer,
  "orden" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "turnos_persona_1_id_personas_id_fk" FOREIGN KEY ("persona_1_id") REFERENCES "personas"("id") ON DELETE set null,
  CONSTRAINT "turnos_persona_2_id_personas_id_fk" FOREIGN KEY ("persona_2_id") REFERENCES "personas"("id") ON DELETE set null,
  CONSTRAINT "turnos_apoyo_id_personas_id_fk" FOREIGN KEY ("apoyo_id") REFERENCES "personas"("id") ON DELETE set null,
  CONSTRAINT "turnos_tipo_check" CHECK ("tipo" IN ('cobro', 'barra', 'acto', 'misa', 'procesion', 'noche', 'otros'))
);

CREATE INDEX IF NOT EXISTS "personas_activo_orden_idx" ON "personas" ("activo", "orden", "nombre");
CREATE INDEX IF NOT EXISTS "turnos_fecha_orden_idx" ON "turnos" ("fecha", "orden", "hora_inicio");
CREATE INDEX IF NOT EXISTS "turnos_tipo_idx" ON "turnos" ("tipo");
