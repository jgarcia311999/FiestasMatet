CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "calendar_token" varchar(96);
ALTER TABLE "turnos" ADD COLUMN IF NOT EXISTS "fecha_hora_inicio" timestamp with time zone;
ALTER TABLE "turnos" ADD COLUMN IF NOT EXISTS "fecha_hora_fin" timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "personas_calendar_token_unique" ON "personas" ("calendar_token");
CREATE INDEX IF NOT EXISTS "turnos_fecha_hora_inicio_idx" ON "turnos" ("fecha_hora_inicio");

UPDATE "personas"
SET "calendar_token" = encode(gen_random_bytes(24), 'hex')
WHERE "calendar_token" IS NULL;

UPDATE "turnos"
SET
  "fecha_hora_inicio" = (
    (
      "fecha"::timestamp
      + CASE WHEN "hora_inicio" < time '06:00' THEN interval '1 day' ELSE interval '0 day' END
      + "hora_inicio"
    ) AT TIME ZONE 'Europe/Madrid'
  ),
  "fecha_hora_fin" = (
    (
      "fecha"::timestamp
      + CASE
          WHEN COALESCE("hora_fin", "hora_inicio" + interval '1 hour') < "hora_inicio"
            OR "hora_inicio" < time '06:00'
          THEN interval '1 day'
          ELSE interval '0 day'
        END
      + COALESCE("hora_fin", "hora_inicio" + interval '1 hour')
    ) AT TIME ZONE 'Europe/Madrid'
  )
WHERE "fecha_hora_inicio" IS NULL OR "fecha_hora_fin" IS NULL;

UPDATE "turnos"
SET "hora_fin" = ("fecha_hora_fin" AT TIME ZONE 'Europe/Madrid')::time
WHERE "hora_fin" IS NULL AND "fecha_hora_fin" IS NOT NULL;

ALTER TABLE "turnos" ALTER COLUMN "fecha_hora_inicio" SET NOT NULL;
ALTER TABLE "turnos" ALTER COLUMN "fecha_hora_fin" SET NOT NULL;
