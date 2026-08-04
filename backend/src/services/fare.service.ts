// import { AppError } from "../utils/appError.js";

// export interface FareCalculationInput {
//   originDistanceKm: number;
//   destinationDistanceKm: number;
// }

// export interface FareCalculationResult {
//   distanceKm: number;
//   baseFare: number;
//   distanceCharge: number;
//   fare: number;
//   currency: "LKR";
// }

// const BASE_FARE_LKR = 100;
// const PRICE_PER_KM_LKR = 4;

// export class FareService {
//   calculateFare(
//     input: FareCalculationInput,
//   ): FareCalculationResult {
//     const distanceKm =
//       input.destinationDistanceKm -
//       input.originDistanceKm;

//     if (distanceKm <= 0) {
//       throw new AppError(
//         400,
//         "INVALID_DISTANCE",
//         "Journey distance must be greater than zero.",
//       );
//     }

//     const distanceCharge =
//       distanceKm * PRICE_PER_KM_LKR;

//     const fare = Math.ceil(
//       BASE_FARE_LKR + distanceCharge,
//     );

//     return {
//       distanceKm,
//       baseFare: BASE_FARE_LKR,
//       distanceCharge,
//       fare,
//       currency: "LKR",
//     };
//   }
// }

// export const fareService = new FareService();

import {
  PassengerCategory,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";

export interface FareCalculationInput {
  originDistanceKm: number;
  destinationDistanceKm: number;
  journeyDepartureTime: Date;
  passengerCategory?: PassengerCategory;
}

export interface FareBandBreakdown {
  fromKm: number;
  toKm: number | null;
  chargedKm: number;
  ratePerKm: number;
  amount: number;
}

export interface FareCalculationResult {
  distanceKm: number;
  baseFare: number;
  distanceCharge: number;
  reservedSurcharge: number;
  peakSurcharge: number;
  passengerDiscount: number;
  subtotal: number;
  fare: number;
  minimumFare: number;
  isPeak: boolean;
  passengerCategory: PassengerCategory;
  currency: "LKR";
  bands: FareBandBreakdown[];
}

const DISCOUNT_PERCENTAGES: Record<
  PassengerCategory,
  number
> = {
  ADULT: 0,
  CHILD: 50,
  SENIOR: 20,
  STUDENT: 10,
};

function isPeakDeparture(
  departureTime: Date,
): boolean {
  const hour = departureTime.getHours();

  return (
    (hour >= 6 && hour < 9) ||
    (hour >= 16 && hour < 19)
  );
}

export class FareService {
  async calculateFare(
    input: FareCalculationInput,
  ): Promise<FareCalculationResult> {
    const distanceKm =
      input.destinationDistanceKm -
      input.originDistanceKm;

    if (distanceKm <= 0) {
      throw new AppError(
        400,
        "INVALID_DISTANCE",
        "Journey distance must be greater than zero.",
      );
    }

    const farePolicy =
      await prisma.farePolicy.findFirst({
        where: {
          isActive: true,
          AND: [
            {
              OR: [
                { activeFrom: null },
                {
                  activeFrom: {
                    lte: input.journeyDepartureTime,
                  },
                },
              ],
            },
            {
              OR: [
                { activeUntil: null },
                {
                  activeUntil: {
                    gte: input.journeyDepartureTime,
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          fareBands: {
            orderBy: {
              displayOrder: "asc",
            },
          },
        },
      });

    if (!farePolicy) {
      throw new AppError(
        500,
        "FARE_POLICY_NOT_FOUND",
        "No active fare policy is configured.",
      );
    }

    let remainingDistance = distanceKm;
    let distanceCharge = 0;

    const bands: FareBandBreakdown[] = [];

    for (const band of farePolicy.fareBands) {
      if (remainingDistance <= 0) {
        break;
      }

      const fromKm = Number(band.fromKm);
      const toKm =
        band.toKm === null
          ? null
          : Number(band.toKm);

      const bandCapacity =
        toKm === null
          ? remainingDistance
          : Math.max(toKm - fromKm, 0);

      const chargedKm = Math.min(
        remainingDistance,
        bandCapacity,
      );

      if (chargedKm <= 0) {
        continue;
      }

      const ratePerKm =
        Number(band.ratePerKm);

      const amount =
        chargedKm * ratePerKm;

      bands.push({
        fromKm,
        toKm,
        chargedKm,
        ratePerKm,
        amount,
      });

      distanceCharge += amount;
      remainingDistance -= chargedKm;
    }

    if (remainingDistance > 0) {
      throw new AppError(
        500,
        "INCOMPLETE_FARE_BANDS",
        "The configured fare bands do not cover the selected distance.",
      );
    }

    const baseFare =
      Number(farePolicy.baseFare);

    const reservedSurcharge =
      Number(farePolicy.reservedSurcharge);

    const minimumFare =
      Number(farePolicy.minimumFare);

    const subtotalBeforePeak =
      baseFare +
      distanceCharge +
      reservedSurcharge;

    const isPeak = isPeakDeparture(
      input.journeyDepartureTime,
    );

    const peakMultiplier =
      Number(farePolicy.peakMultiplier);

    const peakSurcharge = isPeak
      ? subtotalBeforePeak *
        (peakMultiplier - 1)
      : 0;

    const subtotal =
      subtotalBeforePeak + peakSurcharge;

    const passengerCategory =
      input.passengerCategory ??
      PassengerCategory.ADULT;

    const discountPercentage =
      DISCOUNT_PERCENTAGES[
        passengerCategory
      ];

    const passengerDiscount =
      subtotal *
      (discountPercentage / 100);

    const fare = Math.max(
      minimumFare,
      Math.ceil(
        subtotal - passengerDiscount,
      ),
    );

    return {
      distanceKm,
      baseFare,
      distanceCharge,
      reservedSurcharge,
      peakSurcharge:
        Math.round(peakSurcharge),
      passengerDiscount:
        Math.round(passengerDiscount),
      subtotal: Math.round(subtotal),
      fare,
      minimumFare,
      isPeak,
      passengerCategory,
      currency: "LKR",
      bands,
    };
  }
}

export const fareService =
  new FareService();