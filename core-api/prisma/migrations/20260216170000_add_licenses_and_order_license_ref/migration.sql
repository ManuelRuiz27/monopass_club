DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LicensePlanType' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LicensePlanType" AS ENUM ('EVENT', 'BASE', 'PRO');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LicenseBillingType' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LicenseBillingType" AS ENUM ('MANUAL', 'SUBSCRIPTION');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LicenseStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'GRACE', 'SUSPENDED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "License" (
  "id" TEXT NOT NULL,
  "managerUserId" TEXT NOT NULL,
  "clubId" TEXT,
  "planType" "LicensePlanType" NOT NULL,
  "billingType" "LicenseBillingType" NOT NULL,
  "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "eventsRemaining" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LandingOrder"
  ADD COLUMN IF NOT EXISTS "licenseId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'License_managerUserId_fkey'
  ) THEN
    ALTER TABLE "License"
      ADD CONSTRAINT "License_managerUserId_fkey"
      FOREIGN KEY ("managerUserId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'License_clubId_fkey'
  ) THEN
    ALTER TABLE "License"
      ADD CONSTRAINT "License_clubId_fkey"
      FOREIGN KEY ("clubId")
      REFERENCES "Club"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "License_managerUserId_idx" ON "License"("managerUserId");
CREATE INDEX IF NOT EXISTS "License_clubId_idx" ON "License"("clubId");

