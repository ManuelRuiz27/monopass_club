DO $$
BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'SubscriptionBillingPeriod' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "SubscriptionBillingPeriod" AS ENUM ('monthly', 'annual', 'one_time');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'SubscriptionPlanStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('active', 'archived');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PromotionStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "PromotionStatus" AS ENUM ('active', 'inactive', 'archived');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ClubSubscriptionStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "ClubSubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'InvoiceType' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "InvoiceType" AS ENUM ('subscription', 'topup', 'manual_adjustment');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'InvoiceStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'void');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PaymentMethod' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'card', 'provider');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PaymentProvider' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'stripe', 'conekta', 'mercadopago', 'openpay');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PaymentStatus' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LedgerEntryType' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "LedgerEntryType" AS ENUM ('revenue', 'expense', 'tax', 'refund', 'fee', 'adjustment');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'FinanceIsrMode' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "FinanceIsrMode" AS ENUM ('none', 'simple_rate', 'brackets');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "billingPeriod" "SubscriptionBillingPeriod" NOT NULL,
  "priceMxn" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MXN',
  "includedEventsPerMonth" INTEGER,
  "entitlements" JSONB,
  "overagePricePerEventMxn" INTEGER,
  "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Promotion" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "percentOff" INTEGER,
  "amountOffMxn" INTEGER,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "maxRedemptions" INTEGER,
  "redemptions" INTEGER NOT NULL DEFAULT 0,
  "status" "PromotionStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Promotion_code_key" ON "Promotion"("code");

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "ClubSubscriptionStatus" NOT NULL DEFAULT 'active',
  "startAt" TIMESTAMP(3) NOT NULL,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
  "trialEndAt" TIMESTAMP(3),
  "seatsHostsLimit" INTEGER,
  "metadata" JSONB,
  "overrides" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "type" "InvoiceType" NOT NULL,
  "subtotalMxn" INTEGER NOT NULL,
  "taxMxn" INTEGER NOT NULL,
  "totalMxn" INTEGER NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
  "issuedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "items" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "provider" "PaymentProvider",
  "providerRef" TEXT,
  "amountMxn" INTEGER NOT NULL,
  "feeMxn" INTEGER NOT NULL DEFAULT 0,
  "netMxn" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "refundedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LedgerEntry" (
  "id" TEXT NOT NULL,
  "clubId" TEXT,
  "type" "LedgerEntryType" NOT NULL,
  "category" TEXT NOT NULL,
  "amountMxn" INTEGER NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancePreset" (
  "id" TEXT NOT NULL,
  "directorUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.16,
  "isrMode" "FinanceIsrMode" NOT NULL DEFAULT 'none',
  "isrRate" DOUBLE PRECISION,
  "bracketsJson" JSONB,
  "defaultExpenseCategories" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancePreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DirectorAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectorAuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_clubId_fkey') THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_clubId_fkey"
      FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_planId_fkey') THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_clubId_fkey') THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_clubId_fkey"
      FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_subscriptionId_fkey') THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_invoiceId_fkey') THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_clubId_fkey') THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_clubId_fkey"
      FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LedgerEntry_clubId_fkey') THEN
    ALTER TABLE "LedgerEntry"
      ADD CONSTRAINT "LedgerEntry_clubId_fkey"
      FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancePreset_directorUserId_fkey') THEN
    ALTER TABLE "FinancePreset"
      ADD CONSTRAINT "FinancePreset_directorUserId_fkey"
      FOREIGN KEY ("directorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DirectorAuditLog_actorUserId_fkey') THEN
    ALTER TABLE "DirectorAuditLog"
      ADD CONSTRAINT "DirectorAuditLog_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Subscription_clubId_status_idx" ON "Subscription"("clubId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_clubId_status_dueAt_idx" ON "Invoice"("clubId", "status", "dueAt");
CREATE INDEX IF NOT EXISTS "Payment_clubId_createdAt_idx" ON "Payment"("clubId", "createdAt");
CREATE INDEX IF NOT EXISTS "LedgerEntry_occurredAt_type_idx" ON "LedgerEntry"("occurredAt", "type");
CREATE INDEX IF NOT EXISTS "LedgerEntry_clubId_occurredAt_idx" ON "LedgerEntry"("clubId", "occurredAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerRef_key" ON "Payment"("provider", "providerRef");
CREATE UNIQUE INDEX IF NOT EXISTS "FinancePreset_directorUserId_name_key" ON "FinancePreset"("directorUserId", "name");
CREATE INDEX IF NOT EXISTS "DirectorAuditLog_entityType_entityId_createdAt_idx" ON "DirectorAuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "DirectorAuditLog_actorUserId_createdAt_idx" ON "DirectorAuditLog"("actorUserId", "createdAt");
