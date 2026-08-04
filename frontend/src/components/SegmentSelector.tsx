import type { RouteStation } from "../types";

interface SegmentSelectorProps {
  stations: RouteStation[];
  originStationId: string;
  destinationStationId: string;
  isLoading: boolean;
  isSearching: boolean;
  onOriginChange: (stationId: string) => void;
  onDestinationChange: (stationId: string) => void;
  onSearch: () => void;
}

export function SegmentSelector({
  stations,
  originStationId,
  destinationStationId,
  isLoading,
  isSearching,
  onOriginChange,
  onDestinationChange,
  onSearch,
}: SegmentSelectorProps) {
  const selectedOrigin = stations.find(
    (station) => station.id === originStationId,
  );

  const destinationOptions = selectedOrigin
    ? stations.filter(
        (station) =>
          station.stopOrder > selectedOrigin.stopOrder,
      )
    : [];

  const canSearch =
    originStationId !== "" &&
    destinationStationId !== "" &&
    !isLoading &&
    !isSearching;

  return (
    <section className="booking-card">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">Step 2</p>
          <h2>Choose your travel segment</h2>
        </div>
      </div>

      <div className="form-grid two-columns">
        <div className="form-group">
          <label htmlFor="origin">Origin station</label>

          <select
            id="origin"
            value={originStationId}
            disabled={isLoading || stations.length === 0}
            onChange={(event) =>
              onOriginChange(event.target.value)
            }
          >
            <option value="">
              {isLoading
                ? "Loading stations..."
                : "Select origin"}
            </option>

            {stations
              .slice(0, -1)
              .map((station) => (
                <option
                  key={station.id}
                  value={station.id}
                >
                  {station.name}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="destination">
            Destination station
          </label>

          <select
            id="destination"
            value={destinationStationId}
            disabled={
              !originStationId ||
              isLoading ||
              destinationOptions.length === 0
            }
            onChange={(event) =>
              onDestinationChange(event.target.value)
            }
          >
            <option value="">
              {!originStationId
                ? "Select origin first"
                : "Select destination"}
            </option>

            {destinationOptions.map((station) => (
              <option
                key={station.id}
                value={station.id}
              >
                {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedOrigin ? (
        <p className="helper-text">
          Only stations after {selectedOrigin.name} are shown as
          valid destinations.
        </p>
      ) : null}

      <div className="card-actions">
        <button
          type="button"
          className="primary-button"
          disabled={!canSearch}
          onClick={onSearch}
        >
          {isSearching
            ? "Checking availability..."
            : "Find available seats"}
        </button>
      </div>
    </section>
  );
}