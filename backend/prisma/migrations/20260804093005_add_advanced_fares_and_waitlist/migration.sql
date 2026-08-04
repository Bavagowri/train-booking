-- CreateEnum
CREATE TYPE "PassengerCategory" AS ENUM ('ADULT', 'CHILD', 'SENIOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "fareBreakdown" JSONB,
ADD COLUMN     "passengerCategory" "PassengerCategory" NOT NULL DEFAULT 'ADULT';

-- CreateTable
CREATE TABLE "FarePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseFare" DECIMAL(10,2) NOT NULL,
    "minimumFare" DECIMAL(10,2) NOT NULL,
    "reservedSurcharge" DECIMAL(10,2) NOT NULL,
    "peakMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.10,
    "activeFrom" TIMESTAMP(3),
    "activeUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FareBand" (
    "id" TEXT NOT NULL,
    "farePolicyId" TEXT NOT NULL,
    "fromKm" DECIMAL(10,2) NOT NULL,
    "toKm" DECIMAL(10,2),
    "ratePerKm" DECIMAL(10,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "waitlistReference" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "originRouteStationId" TEXT NOT NULL,
    "destinationRouteStationId" TEXT NOT NULL,
    "offeredSeatId" TEXT,
    "originOrder" INTEGER NOT NULL,
    "destinationOrder" INTEGER NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerEmail" TEXT NOT NULL,
    "passengerCategory" "PassengerCategory" NOT NULL DEFAULT 'ADULT',
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarePolicy_isActive_idx" ON "FarePolicy"("isActive");

-- CreateIndex
CREATE INDEX "FarePolicy_isActive_activeFrom_activeUntil_idx" ON "FarePolicy"("isActive", "activeFrom", "activeUntil");

-- CreateIndex
CREATE INDEX "FareBand_farePolicyId_idx" ON "FareBand"("farePolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "FareBand_farePolicyId_displayOrder_key" ON "FareBand"("farePolicyId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_waitlistReference_key" ON "WaitlistEntry"("waitlistReference");

-- CreateIndex
CREATE INDEX "WaitlistEntry_journeyId_status_createdAt_idx" ON "WaitlistEntry"("journeyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_journeyId_originOrder_destinationOrder_idx" ON "WaitlistEntry"("journeyId", "originOrder", "destinationOrder");

-- CreateIndex
CREATE INDEX "WaitlistEntry_journeyId_originRouteStationId_destinationRou_idx" ON "WaitlistEntry"("journeyId", "originRouteStationId", "destinationRouteStationId", "passengerEmail", "status");

-- AddForeignKey
ALTER TABLE "FareBand" ADD CONSTRAINT "FareBand_farePolicyId_fkey" FOREIGN KEY ("farePolicyId") REFERENCES "FarePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_originRouteStationId_fkey" FOREIGN KEY ("originRouteStationId") REFERENCES "RouteStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_destinationRouteStationId_fkey" FOREIGN KEY ("destinationRouteStationId") REFERENCES "RouteStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_offeredSeatId_fkey" FOREIGN KEY ("offeredSeatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
