CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "city" TEXT NOT NULL,
  "venues" INTEGER,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "instagram" TEXT,
  "club" TEXT,
  "eventDate" TIMESTAMP(3),
  "estimatedVolume" INTEGER,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "club" TEXT,
  ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "estimatedVolume" INTEGER,
  ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
  ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
  ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
  ADD COLUMN IF NOT EXISTS "utmTerm" TEXT,
  ADD COLUMN IF NOT EXISTS "utmContent" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Lead'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN "role" DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Lead'
      AND column_name = 'venues'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN "venues" DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Lead'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN "email" DROP NOT NULL;
  END IF;
END $$;

