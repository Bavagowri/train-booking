import type { Booking } from "../types";

interface BookingConfirmationProps {
  booking: Booking;
  onBookAnother: () => void;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BookingConfirmation({
  booking,
  onBookAnother,
}: BookingConfirmationProps) {
  return (
    <section className="booking-card confirmation-card">
      <div className="confirmation-icon" aria-hidden="true">
        ✓
      </div>

      <p className="section-eyebrow">
        Booking confirmed
      </p>

      <h2>Your reserved seat is confirmed</h2>

      <p className="confirmation-message">
        Keep the booking reference below for future use.
      </p>

      <div className="booking-reference">
        <span>Booking reference</span>
        <strong>{booking.bookingReference}</strong>
      </div>

      <div className="confirmation-grid">
        <div className="confirmation-item">
          <span>Passenger</span>
          <strong>{booking.passenger.name}</strong>
        </div>

        <div className="confirmation-item">
          <span>Status</span>
          <strong>{booking.status}</strong>
        </div>

        <div className="confirmation-item">
          <span>Train</span>
          <strong>
            {booking.journey.trainNumber}
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Departure</span>
          <strong>
            {formatDateTime(
              booking.journey.departureTime,
            )}
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Route</span>
          <strong>
            {booking.segment.origin.name} →{" "}
            {booking.segment.destination.name}
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Distance</span>
          <strong>
            {booking.segment.distanceKm} km
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Coach</span>
          <strong>
            {booking.seat.coach.code}
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Seat</span>
          <strong>{booking.seat.seatNumber}</strong>
        </div>

        <div className="confirmation-item">
          <span>Fare</span>
          <strong>
            LKR{" "}
            {booking.fare.amount.toLocaleString(
              "en-LK",
            )}
          </strong>
        </div>

        <div className="confirmation-item">
          <span>Email</span>
          <strong>
            {booking.passenger.email ?? "Not provided"}
          </strong>
        </div>
      </div>

      <div className="card-actions confirmation-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onBookAnother}
        >
          Book another seat
        </button>
      </div>
    </section>
  );
}