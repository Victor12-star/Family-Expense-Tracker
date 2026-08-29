-- Repair Reminder schema drift without changing or deleting existing reminders.
ALTER TABLE "Reminder" ALTER COLUMN "familyId" DROP NOT NULL;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "remindBeforeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "sound" TEXT NOT NULL DEFAULT 'soft';
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Reminder_familyId_date_idx" ON "Reminder"("familyId", "date");
CREATE INDEX IF NOT EXISTS "Reminder_userId_date_idx" ON "Reminder"("userId", "date");

DO $$ BEGIN
  ALTER TABLE "Reminder"
    ADD CONSTRAINT "Reminder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
