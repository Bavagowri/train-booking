-- CreateTable
CREATE TABLE "JourneyCoach" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyCoach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JourneyCoach_journeyId_idx" ON "JourneyCoach"("journeyId");

-- CreateIndex
CREATE INDEX "JourneyCoach_coachId_idx" ON "JourneyCoach"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyCoach_journeyId_coachId_key" ON "JourneyCoach"("journeyId", "coachId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyCoach_journeyId_displayOrder_key" ON "JourneyCoach"("journeyId", "displayOrder");

-- AddForeignKey
ALTER TABLE "JourneyCoach" ADD CONSTRAINT "JourneyCoach_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyCoach" ADD CONSTRAINT "JourneyCoach_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
