export interface ApiResponse<T> {
  data: T;
}

export interface JourneyListResponse {
  data: JourneySummary[];
  count: number;
}

export interface JourneySummary {
  id: string;
  trainNumber: string;
  departureTime: string;
  route: {
    id: string;
    name: string;
    origin: RouteEndpoint | null;
    destination: RouteEndpoint | null;
    stationCount: number;
  };
}

export interface RouteEndpoint {
  id: string;
  stationId: string;
  code: string;
  name: string;
}

export interface JourneyDetails {
  id: string;
  trainNumber: string;
  departureTime: string;
  route: {
    id: string;
    name: string;
    stations: RouteStation[];
  };
}

export interface RouteStation {
  id: string;
  stationId: string;
  code: string;
  name: string;
  stopOrder: number;
  distanceFromStartKm: number;
}

export interface SeatAvailability {
  journey: {
    id: string;
    trainNumber: string;
    departureTime: string;
  };

  segment: {
    origin: RouteStation;
    destination: RouteStation;
    distanceKm: number;
    baseFare: number;
    distanceCharge: number;
    fare: number;
    currency: "LKR";
  };

  availability: {
    totalSeatCount: number;
    availableSeatCount: number;
    unavailableSeatCount: number;
  };

  coaches: CoachAvailability[];
}

export interface CoachAvailability {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
  totalSeatCount: number;
  availableSeatCount: number;
  seats: Seat[];
}

export interface Seat {
  id: string;
  seatNumber: string;
  displayOrder: number;
  available: boolean;
}

export interface CreateBookingRequest {
  journeyId: string;
  seatId: string;
  originStationId: string;
  destinationStationId: string;
  passengerName: string;
  passengerEmail?: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  status: "CONFIRMED" | "CANCELLED";

  passenger: {
    name: string;
    email: string | null;
  };

  journey: {
    id: string;
    trainNumber: string;
    departureTime: string;
    route: {
      id: string;
      name: string;
    };
  };

  seat: {
    id: string;
    seatNumber: string;
    coach: {
      id: string;
      code: string;
      name: string;
      type: "RESERVED" | "UNRESERVED";
    };
  };

  segment: {
    origin: {
      id: string;
      stationId: string;
      code: string;
      name: string;
      stopOrder: number;
    };

    destination: {
      id: string;
      stationId: string;
      code: string;
      name: string;
      stopOrder: number;
    };

    distanceKm: number;
  };

  fare: {
    amount: number;
    currency: "LKR";
  };

  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingResponse {
  data: Booking;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}