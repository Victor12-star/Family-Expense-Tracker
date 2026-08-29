-- Repair older production databases where the FamilyInvite table was not
-- created even though the application release was deployed.
CREATE TABLE IF NOT EXISTS "FamilyInvite" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "maxUses" INTEGER,
  "uses" INTEGER NOT NULL DEFAULT 0,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FamilyInvite_code_key" ON "FamilyInvite"("code");
CREATE INDEX IF NOT EXISTS "FamilyInvite_familyId_createdAt_idx" ON "FamilyInvite"("familyId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "FamilyInvite"
    ADD CONSTRAINT "FamilyInvite_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FamilyInvite"
    ADD CONSTRAINT "FamilyInvite_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
