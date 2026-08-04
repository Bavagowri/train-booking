import { apiClient } from "./client";

import type {
  AdminBooking,
  AdminSummary,
  ApiResponse,
  JourneyAnalytics,
} from "../types";

export async function getAdminSummary(): Promise<AdminSummary> {
  const response = await apiClient.get<
    ApiResponse<AdminSummary>
  >("/admin/summary");

  return response.data.data;
}

export async function getRecentBookings(
  limit = 10,
): Promise<AdminBooking[]> {
  const response = await apiClient.get<{
    data: AdminBooking[];
    count: number;
  }>("/admin/bookings", {
    params: {
      limit,
    },
  });

  return response.data.data;
}

export interface GetJourneyAnalyticsParams {
  journeyId: string;
  originStationId: string;
  destinationStationId: string;
}

export async function getJourneyAnalytics(
  params: GetJourneyAnalyticsParams,
): Promise<JourneyAnalytics> {
  const response = await apiClient.get<
    ApiResponse<JourneyAnalytics>
  >(
    `/admin/journeys/${params.journeyId}/analytics`,
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