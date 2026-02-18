DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LandingOrderStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LandingOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LandingOrder" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerPreferenceId" TEXT,
  "paymentId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "LandingOrderStatus" NOT NULL DEFAULT 'PENDING',
  "clubName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LandingOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LandingOrder_paymentId_key" ON "LandingOrder"("paymentId");

