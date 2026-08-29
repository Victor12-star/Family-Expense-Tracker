-- Repair production databases created before chat replies, soft deletion and
-- voice duration were introduced. IF NOT EXISTS keeps this migration safe on
-- databases that already contain the complete ChatMessage model.
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "isVoice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "duration" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "replyToId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ChatMessage_familyId_createdAt_idx"
ON "ChatMessage"("familyId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
