import type {
  FareBreakdown,
  PassengerCategory,
} from "../types";

import "./PassengerForm.css";

interface PassengerFormProps {
  passengerName: string;
  passengerEmail: string;
  passengerCategory: PassengerCategory;

  selectedSeatLabel?: string;
  fare?: number;
  fareBreakdown?: FareBreakdown;

  isSubmitting: boolean;
  errorMessage?: string;
  canSubmit: boolean;

  onPassengerNameChange: (
    value: string,
  ) => void;

  onPassengerEmailChange: (
    value: string,
  ) => void;

  onPassengerCategoryChange: (
    value: PassengerCategory,
  ) => void;

  onSubmit: () => void;
}

const categoryLabels: Record<
  PassengerCategory,
  string
> = {
  ADULT: "Adult",
  CHILD: "Child — 50% discount",
  SENIOR: "Senior — 20% discount",
  STUDENT: "Student — 10% discount",
};

function formatCurrency(
  value: number,
): string {
  return `LKR ${Math.round(
    value,
  ).toLocaleString("en-LK")}`;
}

export function PassengerForm({
  passengerName,
  passengerEmail,
  passengerCategory,
  selectedSeatLabel,
  fare,
  fareBreakdown,
  isSubmitting,
  errorMessage,
  canSubmit,
  onPassengerNameChange,
  onPassengerEmailChange,
  onPassengerCategoryChange,
  onSubmit,
}: PassengerFormProps) {
  return (
    <section className="passenger-form-card">
      <div className="passenger-form-heading">
        <div>
          <p className="passenger-form-eyebrow">
            Step 4
          </p>

          <h2>Passenger details</h2>

          <p>
            Enter the passenger information and
            review the estimated fare.
          </p>
        </div>
      </div>

      {selectedSeatLabel ? (
        <div className="passenger-seat-summary">
          <div>
            <span>Selected seat</span>
            <strong>{selectedSeatLabel}</strong>
          </div>

          {typeof fare === "number" ? (
            <div>
              <span>Estimated fare</span>

              <strong>
                {formatCurrency(fare)}
              </strong>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="passenger-information-banner">
          Select an available reserved seat before
          entering passenger details.
        </div>
      )}

      <div className="passenger-form-grid">
        <div className="passenger-form-group">
          <label htmlFor="passengerName">
            Passenger name
          </label>

          <input
            id="passengerName"
            type="text"
            value={passengerName}
            maxLength={100}
            autoComplete="name"
            placeholder="Enter passenger name"
            disabled={
              !selectedSeatLabel ||
              isSubmitting
            }
            onChange={(event) =>
              onPassengerNameChange(
                event.target.value,
              )
            }
          />
        </div>

        <div className="passenger-form-group">
          <label htmlFor="passengerEmail">
            Passenger email
            <span className="passenger-optional-label">
              Optional
            </span>
          </label>

          <input
            id="passengerEmail"
            type="email"
            value={passengerEmail}
            maxLength={255}
            autoComplete="email"
            placeholder="passenger@example.com"
            disabled={
              !selectedSeatLabel ||
              isSubmitting
            }
            onChange={(event) =>
              onPassengerEmailChange(
                event.target.value,
              )
            }
          />
        </div>

        <div className="passenger-form-group passenger-category-group">
          <label htmlFor="passengerCategory">
            Passenger category
          </label>

          <select
            id="passengerCategory"
            value={passengerCategory}
            disabled={
              !selectedSeatLabel ||
              isSubmitting
            }
            onChange={(event) =>
              onPassengerCategoryChange(
                event.target
                  .value as PassengerCategory,
              )
            }
          >
            {(
              Object.keys(
                categoryLabels,
              ) as PassengerCategory[]
            ).map((category) => (
              <option
                key={category}
                value={category}
              >
                {categoryLabels[category]}
              </option>
            ))}
          </select>

          <p className="passenger-field-help">
            Eligibility checks would normally be
            completed before boarding.
          </p>
        </div>
      </div>

      {fareBreakdown ? (
        <div className="passenger-fare-breakdown">
          <div className="passenger-fare-breakdown-heading">
            <div>
              <span>Fare breakdown</span>

              <strong>
                {fareBreakdown.isPeak
                  ? "Peak-time journey"
                  : "Standard-time journey"}
              </strong>
            </div>
          </div>

          <dl>
            <div>
              <dt>Base fare</dt>
              <dd>
                {formatCurrency(
                  fareBreakdown.baseFare,
                )}
              </dd>
            </div>

            <div>
              <dt>Distance charge</dt>
              <dd>
                {formatCurrency(
                  fareBreakdown.distanceCharge,
                )}
              </dd>
            </div>

            <div>
              <dt>Reserved-seat surcharge</dt>
              <dd>
                {formatCurrency(
                  fareBreakdown.reservedSurcharge,
                )}
              </dd>
            </div>

            {fareBreakdown.peakSurcharge >
            0 ? (
              <div>
                <dt>Peak-time surcharge</dt>
                <dd>
                  {formatCurrency(
                    fareBreakdown.peakSurcharge,
                  )}
                </dd>
              </div>
            ) : null}

            {fareBreakdown.passengerDiscount >
            0 ? (
              <div className="passenger-discount-row">
                <dt>Passenger discount</dt>
                <dd>
                  −{" "}
                  {formatCurrency(
                    fareBreakdown.passengerDiscount,
                  )}
                </dd>
              </div>
            ) : null}

            <div className="passenger-fare-total">
              <dt>Estimated total</dt>
              <dd>
                {formatCurrency(fare ?? 0)}
              </dd>
            </div>
          </dl>

          <p className="passenger-fare-note">
            The backend recalculates and confirms
            the final fare when the booking is
            submitted.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="passenger-form-error"
          role="alert"
        >
          <strong>
            Booking could not be completed
          </strong>

          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="passenger-form-actions">
        <button
          type="button"
          className="passenger-confirm-button"
          disabled={
            !canSubmit ||
            isSubmitting
          }
          onClick={onSubmit}
        >
          {isSubmitting
            ? "Confirming booking..."
            : "Confirm booking"}
        </button>
      </div>
    </section>
  );
}