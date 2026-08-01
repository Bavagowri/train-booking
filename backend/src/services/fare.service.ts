import { AppError } from "../utils/appError.js";

export interface FareCalculationInput {
  originDistanceKm: number;
  destinationDistanceKm: number;
}

export interface FareCalculationResult {
  distanceKm: number;
  baseFare: number;
  distanceCharge: number;
  fare: number;
  currency: "LKR";
}

const BASE_FARE_LKR = 100;
const PRICE_PER_KM_LKR = 4;

export class FareService {
  calculateFare(
    input: FareCalculationInput,
  ): FareCalculationResult {
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

    const distanceCharge =
      distanceKm * PRICE_PER_KM_LKR;

    const fare = Math.ceil(
      BASE_FARE_LKR + distanceCharge,
    );

    return {
      distanceKm,
      baseFare: BASE_FARE_LKR,
      distanceCharge,
      fare,
      currency: "LKR",
    };
  }
}

export const fareService = new FareService();