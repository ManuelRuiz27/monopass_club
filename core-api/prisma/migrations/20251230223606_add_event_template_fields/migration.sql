/*
  Warnings:

  - Made the column `active` on table `Club` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Club` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Club` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total` on table `Cut` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalGeneral` on table `Cut` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalVip` on table `Cut` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalOther` on table `Cut` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Cut` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `EventRp` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `EventRp` required. This step will fail if there are existing NULL values in that column.
  - Made the column `otherLabel` on table `ManagerSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ManagerSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ManagerSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `RpProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `RpProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `RpProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `ScannerProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ScannerProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ScannerProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Ticket` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Ticket` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Ticket` required. This step will fail if there are existing NULL values in that column.
  - Made the column `scannedAt` on table `TicketScan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Club" DROP CONSTRAINT "fk_club_manager";

-- DropForeignKey
ALTER TABLE "Cut" DROP CONSTRAINT "fk_cut_assignment";

-- DropForeignKey
ALTER TABLE "Cut" DROP CONSTRAINT "fk_cut_event";

-- DropForeignKey
ALTER TABLE "Cut" DROP CONSTRAINT "fk_cut_rp";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "fk_event_club";

-- DropForeignKey
ALTER TABLE "EventRp" DROP CONSTRAINT "fk_eventrp_event";

-- DropForeignKey
ALTER TABLE "EventRp" DROP CONSTRAINT "fk_eventrp_rp";

-- DropForeignKey
ALTER TABLE "ManagerSetting" DROP CONSTRAINT "fk_manager";

-- DropForeignKey
ALTER TABLE "RpProfile" DROP CONSTRAINT "fk_rp_manager";

-- DropForeignKey
ALTER TABLE "RpProfile" DROP CONSTRAINT "fk_rp_user";

-- DropForeignKey
ALTER TABLE "ScannerProfile" DROP CONSTRAINT "fk_scanner_manager";

-- DropForeignKey
ALTER TABLE "ScannerProfile" DROP CONSTRAINT "fk_scanner_user";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "fk_ticket_assignment";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "fk_ticket_event";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "fk_ticket_rp";

-- DropForeignKey
ALTER TABLE "TicketScan" DROP CONSTRAINT "fk_scan_scanner";

-- DropForeignKey
ALTER TABLE "TicketScan" DROP CONSTRAINT "fk_scan_ticket";

-- AlterTable
ALTER TABLE "Club" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Cut" ALTER COLUMN "from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "to" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "total" SET NOT NULL,
ALTER COLUMN "totalGeneral" SET NOT NULL,
ALTER COLUMN "totalVip" SET NOT NULL,
ALTER COLUMN "totalOther" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "startsAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endsAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EventRp" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ManagerSetting" ALTER COLUMN "otherLabel" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RpProfile" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScannerProfile" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TicketScan" ALTER COLUMN "scannedAt" SET NOT NULL,
ALTER COLUMN "scannedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ManagerSetting" ADD CONSTRAINT "ManagerSetting_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpProfile" ADD CONSTRAINT "RpProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpProfile" ADD CONSTRAINT "RpProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerProfile" ADD CONSTRAINT "ScannerProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerProfile" ADD CONSTRAINT "ScannerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRp" ADD CONSTRAINT "EventRp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRp" ADD CONSTRAINT "EventRp_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "RpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "RpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "EventRp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "ScannerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cut" ADD CONSTRAINT "Cut_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cut" ADD CONSTRAINT "Cut_rpId_fkey" FOREIGN KEY ("rpId") REFERENCES "RpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cut" ADD CONSTRAINT "Cut_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "EventRp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "uq_eventrp" RENAME TO "EventRp_eventId_rpId_key";
