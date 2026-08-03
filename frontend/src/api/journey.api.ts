import { apiClient } from "./client";

import type {
  ApiResponse,
  JourneyDetails,
  JourneyListResponse,
  SeatAvailability,
} from "../types";

export async function getJourneys(): Promise<
  JourneyListResponse
> {
  const response =
    await apiClient.get<JourneyListResponse>(
      "/journeys",
    );

  return response.data;
}

export async function getJourneyById(
  journeyId: string,
): Promise<JourneyDetails> {
  const response = await apiClient.get<
    ApiResponse<JourneyDetails>
  >(`/journeys/${journeyId}`);

  return response.data.data;
}

export interface GetSeatAvailabilityParams {
  journeyId: string;
  originStationId: string;
  destinationStationId: string;
}

export async function getSeatAvailability(
  params: GetSeatAvailabilityParams,
): Promise<SeatAvailability> {
  const response = await apiClient.get<
    ApiResponse<SeatAvailability>
  >(
    `/journeys/${params.journeyId}/available-seats`,
    {
      params: {
        originStationId:
          params.originStationId,
        destinationStationId:
          params.destinationStationId,
      },
    },
  );

  return response.data.data;
}