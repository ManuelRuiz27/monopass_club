-- CreateTable
CREATE TABLE "RpGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RpGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RpGroupToRpProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RpGroupToRpProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RpGroupToRpProfile_B_index" ON "_RpGroupToRpProfile"("B");

-- AddForeignKey
ALTER TABLE "RpGroup" ADD CONSTRAINT "RpGroup_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RpGroupToRpProfile" ADD CONSTRAINT "_RpGroupToRpProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "RpGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RpGroupToRpProfile" ADD CONSTRAINT "_RpGroupToRpProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "RpProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
