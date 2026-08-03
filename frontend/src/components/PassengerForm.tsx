interface PassengerFormProps {
  passengerName: string;
  passengerEmail: string;
  selectedSeatLabel?: string;
  fare?: number;
  isSubmitting: boolean;
  errorMessage?: string;
  canSubmit: boolean;
  onPassengerNameChange: (value: string) => void;
  onPassengerEmailChange: (value: string) => void;
  onSubmit: () => void;
}

export function PassengerForm({
  passengerName,
  passengerEmail,
  selectedSeatLabel,
  fare,
  isSubmitting,
  errorMessage,
  canSubmit,
  onPassengerNameChange,
  onPassengerEmailChange,
  onSubmit,
}: PassengerFormProps) {
  return (
    <section className="booking-card">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">Step 4</p>
          <h2>Passenger details</h2>
        </div>
      </div>

      {selectedSeatLabel ? (
        <div className="selected-seat-summary">
          <div>
            <span>Selected seat</span>
            <strong>{selectedSeatLabel}</strong>
          </div>

          {typeof fare === "number" ? (
            <div>
              <span>Total fare</span>
              <strong>
                LKR {fare.toLocaleString("en-LK")}
              </strong>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="information-banner">
          Select an available seat before entering the
          passenger details.
        </div>
      )}

      <div className="form-grid two-columns">
        <div className="form-group">
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
            disabled={!selectedSeatLabel || isSubmitting}
            onChange={(event) =>
              onPassengerNameChange(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="passengerEmail">
            Passenger email
            <span className="optional-label">
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
            disabled={!selectedSeatLabel || isSubmitting}
            onChange={(event) =>
              onPassengerEmailChange(event.target.value)
            }
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="error-banner">
          <strong>Booking could not be completed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="card-actions">
        <button
          type="button"
          className="primary-button"
          disabled={!canSubmit || isSubmitting}
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