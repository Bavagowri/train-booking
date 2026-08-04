import axios from "axios";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createBooking } from "../api/booking.api";

import {
  getJourneyById,
  getJourneys,
  getSeatAvailability,
} from "../api/journey.api";

import { BookingConfirmation } from "../components/BookingConfirmation";
import { CoachSeatMap } from "../components/CoachSeatMap";
import { JourneySelector } from "../components/JourneySelector";
import { PassengerForm } from "../components/PassengerForm";
import { SegmentSelector } from "../components/SegmentSelector";

import type {
  ApiErrorResponse,
  Booking,
  CoachAvailability,
  FareBreakdown,
  JourneyDetails,
  JourneySummary,
  PassengerCategory,
  Seat,
  SeatAvailability,
} from "../types";

interface SelectedSeat {
  seat: Seat;
  coach: CoachAvailability;
}

const categoryDiscountPercentages: Record<
  PassengerCategory,
  number
> = {
  ADULT: 0,
  CHILD: 50,
  SENIOR: 20,
  STUDENT: 10,
};

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error,
    )
  ) {
    return (
      error.response?.data?.error?.message ??
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function calculateFarePreview(
  availability: SeatAvailability,
  category: PassengerCategory,
): {
  fare: number;
  breakdown: FareBreakdown;
} {
  const segment = availability.segment;

  const subtotal =
    segment.subtotal ??
    segment.baseFare +
      segment.distanceCharge +
      segment.reservedSurcharge +
      segment.peakSurcharge;

  const discountPercentage =
    categoryDiscountPercentages[category];

  const passengerDiscount =
    Math.round(
      subtotal *
        (discountPercentage / 100),
    );

  const fare = Math.max(
    segment.minimumFare,
    Math.ceil(
      subtotal - passengerDiscount,
    ),
  );

  return {
    fare,

    breakdown: {
      baseFare: segment.baseFare,
      distanceCharge:
        segment.distanceCharge,
      reservedSurcharge:
        segment.reservedSurcharge,
      peakSurcharge:
        segment.peakSurcharge,
      passengerDiscount,
      minimumFare: segment.minimumFare,
      subtotal,
      isPeak: segment.isPeak,
      bands: segment.bands,
    },
  };
}

export function BookingPage() {
  const [journeys, setJourneys] =
    useState<JourneySummary[]>([]);

  const [
    selectedJourneyId,
    setSelectedJourneyId,
  ] = useState("");

  const [
    journeyDetails,
    setJourneyDetails,
  ] = useState<JourneyDetails | null>(
    null,
  );

  const [
    originStationId,
    setOriginStationId,
  ] = useState("");

  const [
    destinationStationId,
    setDestinationStationId,
  ] = useState("");

  const [
    availability,
    setAvailability,
  ] = useState<SeatAvailability | null>(
    null,
  );

  const [
    selectedSeat,
    setSelectedSeat,
  ] = useState<SelectedSeat | null>(
    null,
  );

  const [
    passengerName,
    setPassengerName,
  ] = useState("");

  const [
    passengerEmail,
    setPassengerEmail,
  ] = useState("");

  const [
    passengerCategory,
    setPassengerCategory,
  ] =
    useState<PassengerCategory>("ADULT");

  const [
    confirmedBooking,
    setConfirmedBooking,
  ] = useState<Booking | null>(null);

  const [
    isLoadingJourneys,
    setIsLoadingJourneys,
  ] = useState(true);

  const [
    isLoadingJourneyDetails,
    setIsLoadingJourneyDetails,
  ] = useState(false);

  const [
    isLoadingAvailability,
    setIsLoadingAvailability,
  ] = useState(false);

  const [
    isSubmittingBooking,
    setIsSubmittingBooking,
  ] = useState(false);

  const [
    journeyError,
    setJourneyError,
  ] = useState("");

  const [
    availabilityError,
    setAvailabilityError,
  ] = useState("");

  const [
    bookingError,
    setBookingError,
  ] = useState("");

  useEffect(() => {
    async function loadJourneys() {
      setIsLoadingJourneys(true);
      setJourneyError("");

      try {
        const response =
          await getJourneys();

        setJourneys(response.data);

        if (response.data.length === 1) {
          const journey =
            response.data[0];

          if (journey) {
            setSelectedJourneyId(
              journey.id,
            );
          }
        }
      } catch (error: unknown) {
        setJourneyError(
          getApiErrorMessage(
            error,
            "Unable to load train journeys.",
          ),
        );
      } finally {
        setIsLoadingJourneys(false);
      }
    }

    void loadJourneys();
  }, []);

  useEffect(() => {
    if (!selectedJourneyId) {
      setJourneyDetails(null);
      return;
    }

    async function loadJourneyDetails() {
      setIsLoadingJourneyDetails(true);
      setJourneyError("");
      setJourneyDetails(null);

      setOriginStationId("");
      setDestinationStationId("");
      setAvailability(null);
      setSelectedSeat(null);
      setConfirmedBooking(null);

      setBookingError("");
      setAvailabilityError("");

      try {
        const journey =
          await getJourneyById(
            selectedJourneyId,
          );

        setJourneyDetails(journey);
      } catch (error: unknown) {
        setJourneyError(
          getApiErrorMessage(
            error,
            "Unable to load journey details.",
          ),
        );
      } finally {
        setIsLoadingJourneyDetails(false);
      }
    }

    void loadJourneyDetails();
  }, [selectedJourneyId]);

  const selectedSeatLabel =
    useMemo(() => {
      if (!selectedSeat) {
        return undefined;
      }

      return `Coach ${selectedSeat.coach.code} · Seat ${selectedSeat.seat.seatNumber}`;
    }, [selectedSeat]);

  const farePreview = useMemo(() => {
    if (!availability) {
      return null;
    }

    return calculateFarePreview(
      availability,
      passengerCategory,
    );
  }, [
    availability,
    passengerCategory,
  ]);

  const canSubmitBooking =
    selectedJourneyId !== "" &&
    originStationId !== "" &&
    destinationStationId !== "" &&
    selectedSeat !== null &&
    passengerName.trim().length >= 2 &&
    !isSubmittingBooking;

  function resetSegmentSelection() {
    setAvailability(null);
    setSelectedSeat(null);
    setBookingError("");
    setAvailabilityError("");
  }

  function handleJourneyChange(
    journeyId: string,
  ) {
    setSelectedJourneyId(journeyId);
  }

  function handleOriginChange(
    stationId: string,
  ) {
    setOriginStationId(stationId);
    setDestinationStationId("");

    resetSegmentSelection();
  }

  function handleDestinationChange(
    stationId: string,
  ) {
    setDestinationStationId(stationId);

    resetSegmentSelection();
  }

  async function loadAvailability() {
    if (
      !selectedJourneyId ||
      !originStationId ||
      !destinationStationId
    ) {
      return;
    }

    setIsLoadingAvailability(true);
    setAvailabilityError("");
    setBookingError("");
    setSelectedSeat(null);

    try {
      const result =
        await getSeatAvailability({
          journeyId:
            selectedJourneyId,

          originStationId,
          destinationStationId,
        });

      setAvailability(result);
    } catch (error: unknown) {
      setAvailability(null);

      setAvailabilityError(
        getApiErrorMessage(
          error,
          "Unable to load seat availability.",
        ),
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }

  function handleSeatSelect(
    seat: Seat,
    coach: CoachAvailability,
  ) {
    setSelectedSeat({
      seat,
      coach,
    });

    setBookingError("");
  }

  async function handleBookingSubmit() {
    if (
      !selectedSeat ||
      !selectedJourneyId ||
      !originStationId ||
      !destinationStationId
    ) {
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError("");

    try {
      const response =
        await createBooking({
          journeyId:
            selectedJourneyId,

          seatId:
            selectedSeat.seat.id,

          originStationId,
          destinationStationId,

          passengerName:
            passengerName.trim(),

          passengerCategory,

          ...(passengerEmail.trim()
            ? {
                passengerEmail:
                  passengerEmail.trim(),
              }
            : {}),
        });

      setConfirmedBooking(
        response.data,
      );

      setAvailability(null);
      setSelectedSeat(null);
    } catch (error: unknown) {
      if (
        axios.isAxiosError<ApiErrorResponse>(
          error,
        )
      ) {
        const errorCode =
          error.response?.data?.error?.code;

        if (
          error.response?.status === 409 ||
          errorCode ===
            "SEAT_UNAVAILABLE"
        ) {
          setBookingError(
            "This seat was just booked by another passenger. Please choose another available seat.",
          );

          await loadAvailability();
          return;
        }
      }

      setBookingError(
        getApiErrorMessage(
          error,
          "Unable to complete the booking.",
        ),
      );
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  function handleBookAnother() {
    setConfirmedBooking(null);

    setOriginStationId("");
    setDestinationStationId("");
    setAvailability(null);
    setSelectedSeat(null);

    setPassengerName("");
    setPassengerEmail("");
    setPassengerCategory("ADULT");

    setBookingError("");
    setAvailabilityError("");
  }

  if (confirmedBooking) {
    return (
      <BookingConfirmation
        booking={confirmedBooking}
        onBookAnother={
          handleBookAnother
        }
      />
    );
  }

  return (
    <div className="booking-page">
      <section className="booking-hero">
        <div className="booking-hero-overlay" />

        <div className="booking-hero-content">
          <div className="hero-route-badge">
            Colombo Fort → Badulla
          </div>

          <p className="hero-eyebrow">
            Sri Lanka Railway Reservations
          </p>

          <h1>
            Book only the distance you travel
          </h1>

          <p className="hero-description">
            Reserve a seat for your selected
            segment and allow the same seat to
            be reused after you leave the train.
          </p>

          <div className="hero-features">
            <div>
              <strong>120</strong>
              <span>Reserved seats</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Reserved coaches</span>
            </div>

            <div>
              <strong>5</strong>
              <span>Unreserved coaches</span>
            </div>

            <div>
              <strong>10</strong>
              <span>Route stations</span>
            </div>
          </div>

          <a
            className="hero-action"
            href="#journey-search"
          >
            Start your booking
          </a>
        </div>
      </section>

      <div
        id="journey-search"
        className="booking-layout"
      >
        <div className="booking-content">
          <JourneySelector
            journeys={journeys}
            selectedJourneyId={
              selectedJourneyId
            }
            isLoading={
              isLoadingJourneys
            }
            errorMessage={
              journeyError || undefined
            }
            onChange={
              handleJourneyChange
            }
          />

          {selectedJourneyId ? (
            <SegmentSelector
              stations={
                journeyDetails?.route
                  .stations ?? []
              }
              originStationId={
                originStationId
              }
              destinationStationId={
                destinationStationId
              }
              isLoading={
                isLoadingJourneyDetails
              }
              isSearching={
                isLoadingAvailability
              }
              onOriginChange={
                handleOriginChange
              }
              onDestinationChange={
                handleDestinationChange
              }
              onSearch={() => {
                void loadAvailability();
              }}
            />
          ) : null}

          <CoachSeatMap
            availability={availability}
            selectedSeatId={
              selectedSeat?.seat.id ?? ""
            }
            isLoading={
              isLoadingAvailability
            }
            errorMessage={
              availabilityError ||
              undefined
            }
            onSeatSelect={
              handleSeatSelect
            }
          />

          {availability ? (
            <PassengerForm
              passengerName={
                passengerName
              }
              passengerEmail={
                passengerEmail
              }
              passengerCategory={
                passengerCategory
              }
              selectedSeatLabel={
                selectedSeatLabel
              }
              fare={
                farePreview?.fare
              }
              fareBreakdown={
                farePreview?.breakdown
              }
              isSubmitting={
                isSubmittingBooking
              }
              errorMessage={
                bookingError || undefined
              }
              canSubmit={
                canSubmitBooking
              }
              onPassengerNameChange={
                setPassengerName
              }
              onPassengerEmailChange={
                setPassengerEmail
              }
              onPassengerCategoryChange={
                setPassengerCategory
              }
              onSubmit={() => {
                void handleBookingSubmit();
              }}
            />
          ) : null}
        </div>

        <aside className="booking-sidebar">
          <div className="booking-card sticky-summary">
            <p className="section-eyebrow">
              Booking summary
            </p>

            <h3>Your selected journey</h3>

            <dl className="summary-list">
              <div>
                <dt>Train</dt>

                <dd>
                  {journeyDetails
                    ? journeyDetails
                        .trainNumber
                    : "Not selected"}
                </dd>
              </div>

              <div>
                <dt>Origin</dt>

                <dd>
                  {journeyDetails?.route
                    .stations.find(
                      (station) =>
                        station.id ===
                        originStationId,
                    )?.name ??
                    "Not selected"}
                </dd>
              </div>

              <div>
                <dt>Destination</dt>

                <dd>
                  {journeyDetails?.route
                    .stations.find(
                      (station) =>
                        station.id ===
                        destinationStationId,
                    )?.name ??
                    "Not selected"}
                </dd>
              </div>

              <div>
                <dt>Passenger type</dt>

                <dd>
                  {passengerCategory}
                </dd>
              </div>

              <div>
                <dt>Seat</dt>

                <dd>
                  {selectedSeatLabel ??
                    "Not selected"}
                </dd>
              </div>

              <div>
                <dt>Distance</dt>

                <dd>
                  {availability
                    ? `${availability.segment.distanceKm} km`
                    : "—"}
                </dd>
              </div>

              <div>
                <dt>Estimated fare</dt>

                <dd>
                  {farePreview
                    ? `LKR ${farePreview.fare.toLocaleString(
                        "en-LK",
                      )}`
                    : "—"}
                </dd>
              </div>
            </dl>

            <div className="summary-note">
              The final fare is calculated and
              verified by the backend when the
              reservation is confirmed.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}