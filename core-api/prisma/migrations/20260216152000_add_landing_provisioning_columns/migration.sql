DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LandingProvisioningStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LandingProvisioningStatus" AS ENUM ('NOT_STARTED', 'PROVISIONED', 'FAILED');
  END IF;
END $$;

ALTER TABLE "LandingOrder"
  ADD COLUMN IF NOT EXISTS "provisioningStatus" "LandingProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS "managerUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "clubId" TEXT,
  ADD COLUMN IF NOT EXISTS "eventId" TEXT,
  ADD COLUMN IF NOT EXISTS "provisioningError" TEXT,
  ADD COLUMN IF NOT EXISTS "provisionedAt" TIMESTAMP(3);

