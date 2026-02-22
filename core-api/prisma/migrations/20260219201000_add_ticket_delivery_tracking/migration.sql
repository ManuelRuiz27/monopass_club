CREATE TYPE "TicketDeliveryMethod" AS ENUM ('WHATSAPP', 'DOWNLOAD');

CREATE TABLE "TicketDelivery" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "rpId" TEXT NOT NULL,
    "method" "TicketDeliveryMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketDelivery_ticketId_createdAt_idx" ON "TicketDelivery"("ticketId", "createdAt");
CREATE INDEX "TicketDelivery_rpId_createdAt_idx" ON "TicketDelivery"("rpId", "createdAt");

ALTER TABLE "TicketDelivery" ADD CONSTRAINT "TicketDelivery_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketDelivery" ADD CONSTRAINT "TicketDelivery_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "RpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
