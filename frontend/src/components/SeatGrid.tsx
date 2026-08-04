import type {
  CoachAvailability,
  Seat,
  SeatAvailability,
} from "../types";

interface SeatGridProps {
  availability: SeatAvailability | null;
  selectedSeatId: string;
  isLoading: boolean;
  errorMessage?: string;
  onSeatSelect: (seat: Seat, coach: CoachAvailability) => void;
}

export function SeatGrid({
  availability,
  selectedSeatId,
  isLoading,
  errorMessage,
  onSeatSelect,
}: SeatGridProps) {
  if (isLoading) {
    return (
      <section className="booking-card">
        <div className="loading-state">
          <span className="loading-spinner" />
          <p>Loading available seats...</p>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="booking-card">
        <div className="error-banner">
          <strong>Could not load seats</strong>
          <p>{errorMessage}</p>
        </div>
      </section>
    );
  }

  if (!availability) {
    return null;
  }

  return (
    <section className="booking-card">
      <div className="section-heading split-heading">
        <div>
          <p className="section-eyebrow">Step 3</p>
          <h2>Select a reserved seat</h2>
        </div>

        <div className="availability-summary">
          <strong>
            {availability.availability.availableSeatCount}
          </strong>
          <span>
            of {availability.availability.totalSeatCount} seats
            available
          </span>
        </div>
      </div>

      <div className="segment-summary">
        <div>
          <span>Route</span>
          <strong>
            {availability.segment.origin.name} →{" "}
            {availability.segment.destination.name}
          </strong>
        </div>

        <div>
          <span>Distance</span>
          <strong>
            {availability.segment.distanceKm} km
          </strong>
        </div>

        <div>
          <span>Fare</span>
          <strong>
            LKR{" "}
            {availability.segment.fare.toLocaleString("en-LK")}
          </strong>
        </div>
      </div>

      <div className="seat-legend">
        <div>
          <span className="legend-seat available" />
          Available
        </div>

        <div>
          <span className="legend-seat selected" />
          Selected
        </div>

        <div>
          <span className="legend-seat unavailable" />
          Unavailable
        </div>
      </div>

      <div className="coach-list">
        {availability.coaches.map((coach) => (
          <article className="coach-card" key={coach.id}>
            <div className="coach-header">
              <div>
                <h3>{coach.name}</h3>
                <p>Coach {coach.code}</p>
              </div>

              <span className="coach-count">
                {coach.availableSeatCount} available
              </span>
            </div>

            <div className="seat-grid">
              {coach.seats.map((seat) => {
                const isSelected =
                  selectedSeatId === seat.id;

                const seatClassNames = [
                  "seat-button",
                  seat.available
                    ? "seat-available"
                    : "seat-unavailable",
                  isSelected ? "seat-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={seatClassNames}
                    disabled={!seat.available}
                    aria-pressed={isSelected}
                    title={
                      seat.available
                        ? `Select seat ${seat.seatNumber} in coach ${coach.code}`
                        : `Seat ${seat.seatNumber} is unavailable`
                    }
                    onClick={() =>
                      onSeatSelect(seat, coach)
                    }
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}