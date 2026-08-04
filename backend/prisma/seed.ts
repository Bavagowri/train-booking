import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  AdminRole,
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

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  /*
   * Delete dependent data first.
   * JourneyCoach must be deleted before Journey and Coach.
   */
  await prisma.waitlistEntry.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.journeyCoach.deleteMany();
  await prisma.journey.deleteMany();
  await prisma.routeStation.deleteMany();
  await prisma.route.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.station.deleteMany();
  await prisma.fareBand.deleteMany();
  await prisma.farePolicy.deleteMany();
  await prisma.admin.deleteMany();

  /* -----------------------------
      Stations
  -------------------------------- */

  const stationMap = new Map<string, string>();

  for (const station of stations) {
    const createdStation =
      await prisma.station.create({
        data: {
          code: station.code,
          name: station.name,
        },
      });

    stationMap.set(
      station.code,
      createdStation.id,
    );
  }

  console.log("10 stations created");

  /* -----------------------------
      Route
  -------------------------------- */

  const route = await prisma.route.create({
    data: {
      name: "Colombo Fort - Badulla",
    },
  });

  /* -----------------------------
      Ordered Route Stations
  -------------------------------- */

  for (
    let stationIndex = 0;
    stationIndex < stations.length;
    stationIndex += 1
  ) {
    const station = stations[stationIndex];

    if (!station) {
      continue;
    }

    const stationId =
      stationMap.get(station.code);

    if (!stationId) {
      throw new Error(
        `Station ID was not found for ${station.code}.`,
      );
    }

    await prisma.routeStation.create({
      data: {
        routeId: route.id,
        stationId,
        stopOrder: stationIndex + 1,
        distanceFromStartKm:
          station.distance,
      },
    });
  }

  console.log(
    "Route and ordered route stations created",
  );

  /* -----------------------------
      Coaches + Reserved Seats
  -------------------------------- */

  const createdCoaches: Array<{
    id: string;
    code: string;
    displayOrder: number;
  }> = [];

  for (
    let coachNumber = 1;
    coachNumber <= reservedCoachCount;
    coachNumber += 1
  ) {
    const displayOrder = coachNumber;

    const createdCoach =
      await prisma.coach.create({
        data: {
          code: `R${coachNumber}`,
          name: `Reserved Coach ${coachNumber}`,
          type: CoachType.RESERVED,
          displayOrder,
        },
      });

    createdCoaches.push({
      id: createdCoach.id,
      code: createdCoach.code,
      displayOrder,
    });

    await prisma.seat.createMany({
      data: Array.from(
        {
          length: seatsPerReservedCoach,
        },
        (_, seatIndex) => ({
          coachId: createdCoach.id,
          seatNumber: String(
            seatIndex + 1,
          ).padStart(2, "0"),
          displayOrder: seatIndex + 1,
        }),
      ),
    });
  }

  for (
    let coachNumber = 1;
    coachNumber <= unreservedCoachCount;
    coachNumber += 1
  ) {
    const displayOrder =
      reservedCoachCount + coachNumber;

    const createdCoach =
      await prisma.coach.create({
        data: {
          code: `U${coachNumber}`,
          name: `Unreserved Coach ${coachNumber}`,
          type: CoachType.UNRESERVED,
          displayOrder,
        },
      });

    createdCoaches.push({
      id: createdCoach.id,
      code: createdCoach.code,
      displayOrder,
    });
  }

  console.log(
    "3 reserved coaches, 5 unreserved coaches, and 120 reserved seats created",
  );

  /* -----------------------------
      Journey
  -------------------------------- */

  const departure = new Date();

  departure.setDate(
    departure.getDate() + 1,
  );

  departure.setHours(
    5,
    55,
    0,
    0,
  );

  const journey =
    await prisma.journey.create({
      data: {
        routeId: route.id,
        trainNumber: "1005",
        departureTime: departure,
      },
    });

  console.log("Journey created");

  /* -----------------------------
      Assign Coaches to Journey
  -------------------------------- */

  await prisma.journeyCoach.createMany({
    data: createdCoaches.map(
      (coach) => ({
        journeyId: journey.id,
        coachId: coach.id,
        displayOrder:
          coach.displayOrder,
      }),
    ),
  });

  console.log(
    `✅ ${createdCoaches.length} coaches assigned to train ${journey.trainNumber}`,
  );

  const farePolicy = await prisma.farePolicy.create({
    data: {
      name: "Standard Reserved Fare 2026",
      baseFare: 100,
      minimumFare: 150,
      reservedSurcharge: 100,
      peakMultiplier: 1.1,
      isActive: true,
    },
  });

  await prisma.fareBand.createMany({
    data: [
      {
        farePolicyId: farePolicy.id,
        fromKm: 0,
        toKm: 50,
        ratePerKm: 5,
        displayOrder: 1,
      },
      {
        farePolicyId: farePolicy.id,
        fromKm: 50,
        toKm: 150,
        ratePerKm: 4,
        displayOrder: 2,
      },
      {
        farePolicyId: farePolicy.id,
        fromKm: 150,
        toKm: null,
        ratePerKm: 3,
        displayOrder: 3,
      },
    ],
  });

  console.log("✅ Fare policy and distance bands created");

  /* -----------------------------
   Development Admin
-------------------------------- */

const adminName =
  process.env.SEED_ADMIN_NAME ??
  "System Administrator";

const adminEmail =
  process.env.SEED_ADMIN_EMAIL ??
  "admin@trainbooking.lk";

const adminPassword =
  process.env.SEED_ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error(
    "SEED_ADMIN_PASSWORD is required to seed the admin account.",
  );
}

if (bcrypt.truncates(adminPassword)) {
  throw new Error(
    "SEED_ADMIN_PASSWORD exceeds bcrypt's 72-byte limit.",
  );
}

const passwordHash = await bcrypt.hash(
  adminPassword,
  12,
);

await prisma.admin.create({
  data: {
    name: adminName,
    email: adminEmail.trim().toLowerCase(),
    passwordHash,
    role: AdminRole.SUPER_ADMIN,
    isActive: true,
  },
});

console.log(
  `✅ Development admin created: ${adminEmail}`,
);

  console.log(
    "Database seeded successfully",
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Database seed failed:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });