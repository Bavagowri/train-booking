import { useState } from "react";

import type {
  CoachAvailability,
  Seat,
  SeatAvailability,
} from "../types";

import "./CoachSeatMap.css";

interface CoachSeatMapProps {
  availability: SeatAvailability | null;
  selectedSeatId: string;
  isLoading: boolean;
  errorMessage?: string;
  onSeatSelect: (
    seat: Seat,
    coach: CoachAvailability,
  ) => void;
}

interface SeatRow {
  rowNumber: number;
  seats: Seat[];
}

function createSeatRows(
  seats: Seat[],
  seatsPerRow = 4,
): SeatRow[] {
  const rows: SeatRow[] = [];

  for (
    let index = 0;
    index < seats.length;
    index += seatsPerRow
  ) {
    rows.push({
      rowNumber:
        Math.floor(index / seatsPerRow) + 1,
      seats: seats.slice(
        index,
        index + seatsPerRow,
      ),
    });
  }

  return rows;
}

export function CoachSeatMap({
  availability,
  selectedSeatId,
  isLoading,
  errorMessage,
  onSeatSelect,
}: CoachSeatMapProps) {
  const [activeCoachId, setActiveCoachId] =
    useState<string>("");

  if (isLoading) {
    return (
      <section className="seat-map-card">
        <div className="seat-map-loading">
          <span className="seat-map-spinner" />
          <div>
            <strong>
              Checking seat availability
            </strong>

            <p>
              Please wait while we load the
              reserved coaches.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="seat-map-card">
        <div className="seat-map-error">
          <strong>
            Unable to load the seat map
          </strong>

          <p>{errorMessage}</p>
        </div>
      </section>
    );
  }

  if (!availability) {
    return null;
  }

  const activeCoach =
    availability.coaches.find(
      (coach) => coach.id === activeCoachId,
    ) ?? availability.coaches[0];

  if (!activeCoach) {
    return (
      <section className="seat-map-card">
        <div className="seat-map-empty">
          No reserved coaches are assigned to
          this journey.
        </div>
      </section>
    );
  }

  const rows = createSeatRows(
    activeCoach.seats,
  );

  return (
    <section className="seat-map-card">
      <div className="seat-map-header">
        <div>
          <p className="seat-map-eyebrow">
            Step 3
          </p>

          <h2>Choose your reserved seat</h2>

          <p className="seat-map-description">
            Select an available seat from one
            of the reserved coaches assigned
            to this journey.
          </p>
        </div>

        <div className="seat-map-availability">
          <strong>
            {
              availability.availability
                .availableSeatCount
            }
          </strong>

          <span>
            of{" "}
            {
              availability.availability
                .totalSeatCount
            }{" "}
            seats available
          </span>
        </div>
      </div>

      <div className="seat-map-trip-summary">
        <div>
          <span>Travel segment</span>

          <strong>
            {availability.segment.origin.name}
            <span className="seat-map-arrow">
              →
            </span>
            {
              availability.segment
                .destination.name
            }
          </strong>
        </div>

        <div>
          <span>Distance</span>

          <strong>
            {availability.segment.distanceKm}{" "}
            km
          </strong>
        </div>

        <div>
          <span>Fare per passenger</span>

          <strong>
            LKR{" "}
            {availability.segment.fare.toLocaleString(
              "en-LK",
            )}
          </strong>
        </div>
      </div>

      <div className="coach-tabs">
        {availability.coaches.map(
          (coach) => {
            const isActive =
              coach.id === activeCoach.id;

            return (
              <button
                key={coach.id}
                type="button"
                className={[
                  "coach-tab",
                  isActive
                    ? "coach-tab-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isActive}
                onClick={() =>
                  setActiveCoachId(
                    coach.id,
                  )
                }
              >
                <span className="coach-tab-code">
                  {coach.code}
                </span>

                <span className="coach-tab-name">
                  {coach.name}
                </span>

                <span className="coach-tab-count">
                  {coach.availableSeatCount}/
                  {coach.totalSeatCount}{" "}
                  available
                </span>
              </button>
            );
          },
        )}
      </div>

      <div className="seat-map-legend">
        <div>
          <span className="seat-key seat-key-available" />
          Available
        </div>

        <div>
          <span className="seat-key seat-key-selected" />
          Selected
        </div>

        <div>
          <span className="seat-key seat-key-unavailable" />
          Unavailable
        </div>
      </div>

      <div className="train-coach">
        <div className="coach-front">
          <div className="driver-cabin">
            <span className="driver-window" />
            <span className="driver-window" />
          </div>

          <div>
            <strong>
              Coach {activeCoach.code}
            </strong>

            <span>
              {activeCoach.availableSeatCount}{" "}
              seats available
            </span>
          </div>
        </div>

        <div className="coach-body">
          <div className="coach-labels">
            <span>Window</span>
            <span>Aisle</span>
            <span>Window</span>
          </div>

          <div className="seat-rows">
            {rows.map((row) => {
              const [
                leftWindow,
                leftAisle,
                rightAisle,
                rightWindow,
              ] = row.seats;

              return (
                <div
                  className="seat-row"
                  key={row.rowNumber}
                >
                  <span className="row-number">
                    {String(
                      row.rowNumber,
                    ).padStart(2, "0")}
                  </span>

                  <div className="seat-pair">
                    {leftWindow ? (
                      <SeatButton
                        seat={leftWindow}
                        coach={activeCoach}
                        selectedSeatId={
                          selectedSeatId
                        }
                        position="window"
                        onSeatSelect={
                          onSeatSelect
                        }
                      />
                    ) : (
                      <span className="seat-placeholder" />
                    )}

                    {leftAisle ? (
                      <SeatButton
                        seat={leftAisle}
                        coach={activeCoach}
                        selectedSeatId={
                          selectedSeatId
                        }
                        position="aisle"
                        onSeatSelect={
                          onSeatSelect
                        }
                      />
                    ) : (
                      <span className="seat-placeholder" />
                    )}
                  </div>

                  <div
                    className="coach-aisle"
                    aria-hidden="true"
                  >
                    <span />
                  </div>

                  <div className="seat-pair">
                    {rightAisle ? (
                      <SeatButton
                        seat={rightAisle}
                        coach={activeCoach}
                        selectedSeatId={
                          selectedSeatId
                        }
                        position="aisle"
                        onSeatSelect={
                          onSeatSelect
                        }
                      />
                    ) : (
                      <span className="seat-placeholder" />
                    )}

                    {rightWindow ? (
                      <SeatButton
                        seat={rightWindow}
                        coach={activeCoach}
                        selectedSeatId={
                          selectedSeatId
                        }
                        position="window"
                        onSeatSelect={
                          onSeatSelect
                        }
                      />
                    ) : (
                      <span className="seat-placeholder" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="coach-rear">
            <span>Rear exit</span>
          </div>
        </div>
      </div>

      <div className="seat-map-note">
        <strong>Reserved seating only</strong>

        <p>
          This map displays the three reserved
          coaches. The five unreserved coaches
          operate without assigned seating and
          are therefore not shown.
        </p>
      </div>
    </section>
  );
}

interface SeatButtonProps {
  seat: Seat;
  coach: CoachAvailability;
  selectedSeatId: string;
  position: "window" | "aisle";
  onSeatSelect: (
    seat: Seat,
    coach: CoachAvailability,
  ) => void;
}

function SeatButton({
  seat,
  coach,
  selectedSeatId,
  position,
  onSeatSelect,
}: SeatButtonProps) {
  const isSelected =
    seat.id === selectedSeatId;

  const className = [
    "coach-seat",
    seat.available
      ? "coach-seat-available"
      : "coach-seat-unavailable",
    isSelected
      ? "coach-seat-selected"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const status = isSelected
    ? "selected"
    : seat.available
      ? "available"
      : "unavailable";

  return (
    <button
      type="button"
      className={className}
      disabled={!seat.available}
      aria-pressed={isSelected}
      aria-label={`Coach ${coach.code}, seat ${seat.seatNumber}, ${position} seat, ${status}`}
      title={`Coach ${coach.code} · Seat ${seat.seatNumber} · ${position} · ${status}`}
      onClick={() =>
        onSeatSelect(seat, coach)
      }
    >
      <span className="seat-backrest" />

      <span className="seat-number">
        {seat.seatNumber}
      </span>

      {isSelected ? (
        <span
          className="seat-check"
          aria-hidden="true"
        >
          ✓
        </span>
      ) : null}
    </button>
  );
}