import { apiClient } from "./client";

import type {
  ApiResponse,
  Booking,
  CreateBookingRequest,
  CreateBookingResponse,
} from "../types";

export async function createBooking(
  bookingData: CreateBookingRequest,
): Promise<CreateBookingResponse> {
  const response =
    await apiClient.post<CreateBookingResponse>(
      "/bookings",
      bookingData,
    );

  return response.data;
}

export async function getBookingByReference(
  bookingReference: string,
): Promise<Booking> {
  const response = await apiClient.get<
    ApiResponse<Booking>
  >(
    `/bookings/${encodeURIComponent(
      bookingReference,
    )}`,
  );

  return response.data.data;
}