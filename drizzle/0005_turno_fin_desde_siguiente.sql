ALTER TABLE "turnos" ALTER COLUMN "fecha_hora_fin" DROP NOT NULL;

WITH next_turnos AS (
  SELECT
    t1."id",
    t1."fecha_hora_inicio" AS start_at,
    (
      SELECT min(t2."fecha_hora_inicio")
      FROM "turnos" t2
      WHERE t2."fecha_hora_inicio" > t1."fecha_hora_inicio"
    ) AS next_start
  FROM "turnos" t1
)
UPDATE "turnos" t
SET
  "fecha_hora_fin" = CASE
    WHEN next_turnos.next_start IS NOT NULL
      AND next_turnos.next_start - next_turnos.start_at <= interval '4 hours'
    THEN next_turnos.next_start
    ELSE NULL
  END,
  "hora_fin" = CASE
    WHEN next_turnos.next_start IS NOT NULL
      AND next_turnos.next_start - next_turnos.start_at <= interval '4 hours'
    THEN (next_turnos.next_start AT TIME ZONE 'Europe/Madrid')::time
    ELSE NULL
  END
FROM next_turnos
WHERE t."id" = next_turnos."id";
