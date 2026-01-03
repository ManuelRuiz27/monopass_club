-- CreateTable
CREATE TABLE "ScannerConfirmRequest" (
    "id" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "scannerId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScannerConfirmRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScannerConfirmRequest_clientRequestId_key" ON "ScannerConfirmRequest"("clientRequestId");

-- AddForeignKey
ALTER TABLE "ScannerConfirmRequest" ADD CONSTRAINT "ScannerConfirmRequest_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "ScannerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerConfirmRequest" ADD CONSTRAINT "ScannerConfirmRequest_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
