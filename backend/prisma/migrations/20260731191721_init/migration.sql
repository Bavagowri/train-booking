-- CreateEnum
CREATE TYPE "CoachType" AS ENUM ('RESERVED', 'UNRESERVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStation" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "distanceFromStartKm" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "RouteStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "trainNumber" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CoachType" NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerEmail" TEXT,
    "journeyId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "originRouteStationId" TEXT NOT NULL,
    "destinationRouteStationId" TEXT NOT NULL,
    "originOrder" INTEGER NOT NULL,
    "destinationOrder" INTEGER NOT NULL,
    "distanceKm" DECIMAL(10,2) NOT NULL,
    "fare" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE INDEX "RouteStation_routeId_stopOrder_idx" ON "RouteStation"("routeId", "stopOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStation_routeId_stopOrder_key" ON "RouteStation"("routeId", "stopOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStation_routeId_stationId_key" ON "RouteStation"("routeId", "stationId");

-- CreateIndex
CREATE INDEX "Journey_routeId_departureTime_idx" ON "Journey"("routeId", "departureTime");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_code_key" ON "Coach"("code");

-- CreateIndex
CREATE INDEX "Seat_coachId_idx" ON "Seat"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_coachId_seatNumber_key" ON "Seat"("coachId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");

-- CreateIndex
CREATE INDEX "Booking_journeyId_seatId_status_idx" ON "Booking"("journeyId", "seatId", "status");

-- CreateIndex
CREATE INDEX "Booking_journeyId_originOrder_destinationOrder_idx" ON "Booking"("journeyId", "originOrder", "destinationOrder");

-- AddForeignKey
ALTER TABLE "RouteStation" ADD CONSTRAINT "RouteStation_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStation" ADD CONSTRAINT "RouteStation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_originRouteStationId_fkey" FOREIGN KEY ("originRouteStationId") REFERENCES "RouteStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_destinationRouteStationId_fkey" FOREIGN KEY ("destinationRouteStationId") REFERENCES "RouteStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
