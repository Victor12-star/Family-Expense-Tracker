-- Additive production-readiness migration.
-- IMPORTANT: apply to staging first and back up production before deployment.

ALTER TABLE "Expense" ALTER COLUMN "familyId" DROP NOT NULL;
ALTER TABLE "Expense" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expense" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Reminder" ALTER COLUMN "familyId" DROP NOT NULL;
ALTER TABLE "Reminder" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE "Reminder" ADD COLUMN "remindBeforeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reminder" ADD COLUMN "sound" TEXT NOT NULL DEFAULT 'soft';
ALTER TABLE "Reminder" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Reminder" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ShoppingItem" ALTER COLUMN "familyId" DROP NOT NULL;
ALTER TABLE "ShoppingItem" ADD COLUMN "tripId" TEXT;
ALTER TABLE "ShoppingItem" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE "ShoppingItem" ADD COLUMN "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1;
ALTER TABLE "ShoppingItem" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'piece';
ALTER TABLE "ShoppingItem" ADD COLUMN "estimatedUnitPrice" DECIMAL(12,2);
ALTER TABLE "ShoppingItem" ADD COLUMN "store" TEXT;
ALTER TABLE "ShoppingItem" ADD COLUMN "notes" TEXT;
ALTER TABLE "ShoppingItem" ADD COLUMN "purchasedAt" TIMESTAMP(3);
ALTER TABLE "ShoppingItem" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ShoppingItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Activity" ALTER COLUMN "familyId" DROP NOT NULL;

CREATE TABLE "Budget" (
  "id" TEXT NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "familyId" TEXT,
  "userId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'SEK',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShoppingTrip" (
  "id" TEXT NOT NULL,
  "familyId" TEXT,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Shopping trip',
  "store" TEXT,
  "estimatedTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "actualTotal" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'SEK',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShoppingTrip_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");
CREATE INDEX "Reminder_familyId_date_idx" ON "Reminder"("familyId", "date");
CREATE INDEX "Reminder_userId_date_idx" ON "Reminder"("userId", "date");
CREATE INDEX "ShoppingItem_familyId_done_idx" ON "ShoppingItem"("familyId", "done");
CREATE INDEX "ShoppingItem_userId_done_idx" ON "ShoppingItem"("userId", "done");
CREATE INDEX "ShoppingItem_tripId_idx" ON "ShoppingItem"("tripId");
CREATE INDEX "Budget_familyId_month_idx" ON "Budget"("familyId", "month");
CREATE INDEX "Budget_userId_month_idx" ON "Budget"("userId", "month");
CREATE UNIQUE INDEX "Budget_scopeKey_month_key" ON "Budget"("scopeKey", "month");
CREATE INDEX "ShoppingTrip_familyId_completedAt_idx" ON "ShoppingTrip"("familyId", "completedAt");
CREATE INDEX "ShoppingTrip_userId_completedAt_idx" ON "ShoppingTrip"("userId", "completedAt");

ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingTrip" ADD CONSTRAINT "ShoppingTrip_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingTrip" ADD CONSTRAINT "ShoppingTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "ShoppingTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "FamilyInvite" (
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
CREATE UNIQUE INDEX "FamilyInvite_code_key" ON "FamilyInvite"("code");
CREATE INDEX "FamilyInvite_familyId_createdAt_idx" ON "FamilyInvite"("familyId", "createdAt");
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyInvite" ADD CONSTRAINT "FamilyInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Chat reliability: soft-delete sent messages for everyone and support replies.
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "replyToId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ChatMessage_familyId_createdAt_idx" ON "ChatMessage"("familyId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
