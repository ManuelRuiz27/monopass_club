-- Initial migration for MonoPass Club

CREATE TYPE "UserRole" AS ENUM ('MANAGER','RP','SCANNER');
CREATE TYPE "TicketType" AS ENUM ('GENERAL','VIP','OTHER');
CREATE TYPE "TicketStatus" AS ENUM ('PENDING','SCANNED');

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role "UserRole" NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "ManagerSetting" (
  id TEXT PRIMARY KEY,
  "managerId" TEXT UNIQUE NOT NULL,
  "otherLabel" TEXT DEFAULT 'Otro',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_manager FOREIGN KEY ("managerId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "Club" (
  id TEXT PRIMARY KEY,
  "managerId" TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_club_manager FOREIGN KEY ("managerId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "Event" (
  id TEXT PRIMARY KEY,
  "clubId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "startsAt" TIMESTAMP NOT NULL,
  "endsAt" TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_event_club FOREIGN KEY ("clubId") REFERENCES "Club"(id) ON DELETE CASCADE
);

CREATE TABLE "RpProfile" (
  id TEXT PRIMARY KEY,
  "managerId" TEXT NOT NULL,
  "userId" TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_rp_manager FOREIGN KEY ("managerId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "ScannerProfile" (
  id TEXT PRIMARY KEY,
  "managerId" TEXT NOT NULL,
  "userId" TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_scanner_manager FOREIGN KEY ("managerId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT fk_scanner_user FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "EventRp" (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "rpId" TEXT NOT NULL,
  "limitAccesses" INT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_eventrp_event FOREIGN KEY ("eventId") REFERENCES "Event"(id) ON DELETE CASCADE,
  CONSTRAINT fk_eventrp_rp FOREIGN KEY ("rpId") REFERENCES "RpProfile"(id) ON DELETE CASCADE,
  CONSTRAINT uq_eventrp UNIQUE ("eventId","rpId")
);

CREATE TABLE "Ticket" (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "rpId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "guestType" "TicketType" NOT NULL,
  note TEXT,
  "qrToken" TEXT UNIQUE NOT NULL,
  status "TicketStatus" DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_ticket_event FOREIGN KEY ("eventId") REFERENCES "Event"(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_rp FOREIGN KEY ("rpId") REFERENCES "RpProfile"(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_assignment FOREIGN KEY ("assignmentId") REFERENCES "EventRp"(id) ON DELETE CASCADE
);

CREATE TABLE "TicketScan" (
  id TEXT PRIMARY KEY,
  "ticketId" TEXT UNIQUE NOT NULL,
  "scannerId" TEXT,
  "scannedAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_scan_ticket FOREIGN KEY ("ticketId") REFERENCES "Ticket"(id) ON DELETE CASCADE,
  CONSTRAINT fk_scan_scanner FOREIGN KEY ("scannerId") REFERENCES "ScannerProfile"(id) ON DELETE SET NULL
);

CREATE TABLE "Cut" (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "rpId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "from" TIMESTAMP NOT NULL,
  "to" TIMESTAMP NOT NULL,
  total INT DEFAULT 0,
  "totalGeneral" INT DEFAULT 0,
  "totalVip" INT DEFAULT 0,
  "totalOther" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT fk_cut_event FOREIGN KEY ("eventId") REFERENCES "Event"(id) ON DELETE CASCADE,
  CONSTRAINT fk_cut_rp FOREIGN KEY ("rpId") REFERENCES "RpProfile"(id) ON DELETE CASCADE,
  CONSTRAINT fk_cut_assignment FOREIGN KEY ("assignmentId") REFERENCES "EventRp"(id) ON DELETE CASCADE
);
