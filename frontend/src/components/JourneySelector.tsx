import type { JourneySummary } from "../types";

interface JourneySelectorProps {
  journeys: JourneySummary[];
  selectedJourneyId: string;
  isLoading: boolean;
  errorMessage?: string;
  onChange: (journeyId: string) => void;
}

function formatDepartureTime(value: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function JourneySelector({
  journeys,
  selectedJourneyId,
  isLoading,
  errorMessage,
  onChange,
}: JourneySelectorProps) {
  return (
    <section className="booking-card">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">Step 1</p>
          <h2>Select your journey</h2>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="journey">Journey</label>

        <select
          id="journey"
          value={selectedJourneyId}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">
            {isLoading
              ? "Loading journeys..."
              : "Select a journey"}
          </option>

          {journeys.map((journey) => {
            const originName =
              journey.route.origin?.name ?? "Unknown origin";

            const destinationName =
              journey.route.destination?.name ??
              "Unknown destination";

            return (
              <option key={journey.id} value={journey.id}>
                Train {journey.trainNumber} · {originName} →{" "}
                {destinationName} ·{" "}
                {formatDepartureTime(journey.departureTime)}
              </option>
            );
          })}
        </select>

        {errorMessage ? (
          <p className="field-error">{errorMessage}</p>
        ) : null}
      </div>

      {selectedJourneyId ? (
        <p className="helper-text">
          The stations for the selected journey will appear below.
        </p>
      ) : null}
    </section>
  );
}