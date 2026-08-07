ALTER TABLE "turnos" ADD COLUMN IF NOT EXISTS "apoyo_2_id" integer;

ALTER TABLE "turnos" DROP CONSTRAINT IF EXISTS "turnos_tipo_check";
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_tipo_check"
CHECK ("tipo" IN ('cobro', 'barra', 'acto', 'misa', 'procesion', 'noche', 'toros', 'otros'));

DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_apoyo_2_id_personas_id_fk"
 FOREIGN KEY ("apoyo_2_id") REFERENCES "personas"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
