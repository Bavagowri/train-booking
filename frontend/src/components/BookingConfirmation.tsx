import type {
  Booking,
  FareBreakdown,
  PassengerCategory,
} from "../types";

import "./BookingConfirmation.css";

interface BookingConfirmationProps {
  booking: Booking;
  onBookAnother: () => void;
}

const passengerCategoryLabels: Record<
  PassengerCategory,
  string
> = {
  ADULT: "Adult",
  CHILD: "Child",
  SENIOR: "Senior",
  STUDENT: "Student",
};

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(
  value: number,
): string {
  return `LKR ${Math.round(
    value,
  ).toLocaleString("en-LK")}`;
}

function FareBreakdownSection({
  breakdown,
  total,
}: {
  breakdown: FareBreakdown;
  total: number;
}) {
  return (
    <div className="confirmation-fare-breakdown">
      <div className="confirmation-fare-heading">
        <span>Fare calculation</span>

        <strong>
          {breakdown.isPeak
            ? "Peak-time fare"
            : "Standard-time fare"}
        </strong>
      </div>

      <dl>
        <div>
          <dt>Base fare</dt>
          <dd>
            {formatCurrency(
              breakdown.baseFare,
            )}
          </dd>
        </div>

        <div>
          <dt>Distance charge</dt>
          <dd>
            {formatCurrency(
              breakdown.distanceCharge,
            )}
          </dd>
        </div>

        <div>
          <dt>Reserved-seat surcharge</dt>
          <dd>
            {formatCurrency(
              breakdown.reservedSurcharge,
            )}
          </dd>
        </div>

        {breakdown.peakSurcharge > 0 ? (
          <div>
            <dt>Peak surcharge</dt>
            <dd>
              {formatCurrency(
                breakdown.peakSurcharge,
              )}
            </dd>
          </div>
        ) : null}

        {breakdown.passengerDiscount > 0 ? (
          <div className="confirmation-discount-row">
            <dt>Passenger discount</dt>
            <dd>
              −{" "}
              {formatCurrency(
                breakdown.passengerDiscount,
              )}
            </dd>
          </div>
        ) : null}

        <div className="confirmation-fare-total">
          <dt>Total paid</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function BookingConfirmation({
  booking,
  onBookAnother,
}: BookingConfirmationProps) {
  const passengerCategory =
    booking.passenger.category ??
    "ADULT";

  return (
    <section className="booking-confirmation-card">
      <div
        className="booking-confirmation-icon"
        aria-hidden="true"
      >
        ✓
      </div>

      <p className="booking-confirmation-eyebrow">
        Booking confirmed
      </p>

      <h2>Your reserved seat is confirmed</h2>

      <p className="booking-confirmation-message">
        Keep the booking reference below for
        future use.
      </p>

      <div className="booking-confirmation-reference">
        <span>Booking reference</span>
        <strong>
          {booking.bookingReference}
        </strong>
      </div>

      <div className="booking-confirmation-grid">
        <div>
          <span>Passenger</span>
          <strong>
            {booking.passenger.name}
          </strong>
        </div>

        <div>
          <span>Category</span>
          <strong>
            {
              passengerCategoryLabels[
                passengerCategory
              ]
            }
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong>{booking.status}</strong>
        </div>

        <div>
          <span>Train</span>
          <strong>
            {booking.journey.trainNumber}
          </strong>
        </div>

        <div>
          <span>Departure</span>
          <strong>
            {formatDateTime(
              booking.journey.departureTime,
            )}
          </strong>
        </div>

        <div>
          <span>Travel segment</span>
          <strong>
            {booking.segment.origin.name} →{" "}
            {booking.segment.destination.name}
          </strong>
        </div>

        <div>
          <span>Distance</span>
          <strong>
            {booking.segment.distanceKm} km
          </strong>
        </div>

        <div>
          <span>Coach and seat</span>
          <strong>
            {booking.seat.coach.code} ·{" "}
            {booking.seat.seatNumber}
          </strong>
        </div>

        <div>
          <span>Email</span>
          <strong>
            {booking.passenger.email ??
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Total fare</span>
          <strong>
            {formatCurrency(
              booking.fare.amount,
            )}
          </strong>
        </div>
      </div>

      {booking.fare.breakdown ? (
        <FareBreakdownSection
          breakdown={
            booking.fare.breakdown
          }
          total={booking.fare.amount}
        />
      ) : null}

      <div className="booking-confirmation-actions">
        <button
          type="button"
          onClick={onBookAnother}
        >
          Book another seat
        </button>
      </div>
    </section>
  );
}