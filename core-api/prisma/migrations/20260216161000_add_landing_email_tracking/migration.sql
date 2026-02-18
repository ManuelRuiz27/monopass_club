ALTER TABLE "LandingOrder"
  ADD COLUMN IF NOT EXISTS "credentialsEmailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "credentialsEmailError" TEXT;

