import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  CoachType,
  PrismaClient,
} from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/* -----------------------------
   CONFIGURATION
-------------------------------- */

const stations = [
  { code: "CFT", name: "Colombo Fort", distance: 0 },
  { code: "RGM", name: "Ragama", distance: 14 },
  { code: "GPH", name: "Gampaha", distance: 28 },
  { code: "VYG", name: "Veyangoda", distance: 45 },
  { code: "RBK", name: "Rambukkana", distance: 83 },
  { code: "KDY", name: "Kandy", distance: 120 },
  { code: "HTN", name: "Hatton", distance: 173 },
  { code: "NNO", name: "Nanu Oya", distance: 206 },
  { code: "ELA", name: "Ella", distance: 271 },
  { code: "BDL", name: "Badulla", distance: 292 },
];

const reservedCoachCount = 3;
const unreservedCoachCount = 5;
const seatsPerReservedCoach = 40;

/* -----------------------------
   MAIN
-------------------------------- */

async function main() {
  console.log("🌱 Seeding database...");

  // Delete data in correct order

  await prisma.booking.deleteMany();
  await prisma.journey.deleteMany();
  await prisma.routeStation.deleteMany();
  await prisma.route.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.station.deleteMany();

  /* -----------------------------
      Stations
  -------------------------------- */

  const stationMap = new Map<string, string>();

  for (const [index, station] of stations.entries()) {
    const created = await prisma.station.create({
      data: {
        code: station.code,
        name: station.name,
      },
    });

    stationMap.set(station.code, created.id);
  }

  console.log("✅ Stations created");

  /* -----------------------------
      Route
  -------------------------------- */

  const route = await prisma.route.create({
    data: {
      name: "Colombo Fort - Badulla",
    },
  });

  /* -----------------------------
      Route Stations
  -------------------------------- */

  for (const [index, station] of stations.entries()) {
    await prisma.routeStation.create({
      data: {
        routeId: route.id,
        stationId: stationMap.get(station.code)!,
        stopOrder: index + 1,
        distanceFromStartKm: station.distance,
      },
    });
  }

  console.log("✅ Route created");

  /* -----------------------------
      Coaches + Seats
  -------------------------------- */

  for (let coach = 1; coach <= reservedCoachCount; coach++) {
    const createdCoach = await prisma.coach.create({
      data: {
        code: `R${coach}`,
        name: `Reserved Coach ${coach}`,
        type: CoachType.RESERVED,
        displayOrder: coach,
      },
    });

    for (let seat = 1; seat <= seatsPerReservedCoach; seat++) {
      await prisma.seat.create({
        data: {
          coachId: createdCoach.id,
          seatNumber: seat.toString().padStart(2, "0"),
          displayOrder: seat,
        },
      });
    }
  }

  for (let coach = 1; coach <= unreservedCoachCount; coach++) {
    await prisma.coach.create({
      data: {
        code: `U${coach}`,
        name: `Unreserved Coach ${coach}`,
        type: CoachType.UNRESERVED,
        displayOrder: reservedCoachCount + coach,
      },
    });
  }

  console.log("✅ Coaches & Seats created");

  /* -----------------------------
      Journey
  -------------------------------- */

  const departure = new Date();

  departure.setDate(departure.getDate() + 1);

  departure.setHours(5, 55, 0, 0);

  await prisma.journey.create({
    data: {
      routeId: route.id,
      trainNumber: "1005",
      departureTime: departure,
    },
  });

  console.log("✅ Journey created");

  console.log("🎉 Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });