-- Repair production/staging schema drift: ChatMessage.duration is used by
-- every chat insert, including ordinary text messages, but the column was
-- previously present only in schema.prisma and never added by a migration.
ALTER TABLE "ChatMessage"
ADD COLUMN IF NOT EXISTS "duration" INTEGER NOT NULL DEFAULT 0;
