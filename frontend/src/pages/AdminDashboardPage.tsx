import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAdminSummary,
  getJourneyAnalytics,
  getRecentBookings,
} from "../api/admin.api";

import {
  getJourneyById,
  getJourneys,
} from "../api/journey.api";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

import type {
  AdminBooking,
  AdminSummary,
  ApiErrorResponse,
  JourneyAnalytics,
  JourneyDetails,
  JourneySummary,
} from "../types";

import "./AdminDashboardPage.css";

function getErrorMessage(
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

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminDashboardPage() {
  const navigate = useNavigate();

  const {
    admin,
    logout,
  } = useAdminAuth();

  const [summary, setSummary] =
    useState<AdminSummary | null>(null);

  const [recentBookings, setRecentBookings] =
    useState<AdminBooking[]>([]);

  const [journeys, setJourneys] =
    useState<JourneySummary[]>([]);

  const [
    selectedJourneyId,
    setSelectedJourneyId,
  ] = useState("");

  const [
    selectedJourney,
    setSelectedJourney,
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
    analytics,
    setAnalytics,
  ] = useState<JourneyAnalytics | null>(
    null,
  );

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(true);

  const [
    isLoadingJourney,
    setIsLoadingJourney,
  ] = useState(false);

  const [
    isLoadingAnalytics,
    setIsLoadingAnalytics,
  ] = useState(false);

  const [
    dashboardError,
    setDashboardError,
  ] = useState("");

  const [
    analyticsError,
    setAnalyticsError,
  ] = useState("");

  const loadDashboardData =
    useCallback(async () => {
      setIsLoadingDashboard(true);
      setDashboardError("");

      try {
        const [
          summaryResult,
          bookingResult,
          journeyResult,
        ] = await Promise.all([
          getAdminSummary(),
          getRecentBookings(10),
          getJourneys(),
        ]);

        setSummary(summaryResult);
        setRecentBookings(bookingResult);
        setJourneys(journeyResult.data);

        if (
          journeyResult.data.length > 0
        ) {
          const firstJourney =
            journeyResult.data[0];

          if (firstJourney) {
            setSelectedJourneyId(
              firstJourney.id,
            );
          }
        }
      } catch (error: unknown) {
        setDashboardError(
          getErrorMessage(
            error,
            "Unable to load the administrator dashboard.",
          ),
        );
      } finally {
        setIsLoadingDashboard(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!selectedJourneyId) {
      setSelectedJourney(null);
      setOriginStationId("");
      setDestinationStationId("");
      setAnalytics(null);

      return;
    }

    async function loadJourneyDetails() {
      setIsLoadingJourney(true);
      setAnalyticsError("");
      setAnalytics(null);

      try {
        const journey =
          await getJourneyById(
            selectedJourneyId,
          );

        setSelectedJourney(journey);

        const firstStation =
          journey.route.stations[0];

        const lastStation =
          journey.route.stations[
            journey.route.stations.length -
              1
          ];

        if (
          firstStation &&
          lastStation
        ) {
          setOriginStationId(
            firstStation.id,
          );

          setDestinationStationId(
            lastStation.id,
          );
        }
      } catch (error: unknown) {
        setSelectedJourney(null);

        setAnalyticsError(
          getErrorMessage(
            error,
            "Unable to load journey details.",
          ),
        );
      } finally {
        setIsLoadingJourney(false);
      }
    }

    void loadJourneyDetails();
  }, [selectedJourneyId]);

  const selectedOrigin =
    useMemo(() => {
      return selectedJourney?.route.stations.find(
        (station) =>
          station.id ===
          originStationId,
      );
    }, [
      selectedJourney,
      originStationId,
    ]);

  const destinationOptions =
    useMemo(() => {
      if (
        !selectedJourney ||
        !selectedOrigin
      ) {
        return [];
      }

      return selectedJourney.route.stations.filter(
        (station) =>
          station.stopOrder >
          selectedOrigin.stopOrder,
      );
    }, [
      selectedJourney,
      selectedOrigin,
    ]);

  const handleOriginChange = (
    stationId: string,
  ) => {
    setOriginStationId(stationId);
    setDestinationStationId("");
    setAnalytics(null);
    setAnalyticsError("");
  };

  const handleDestinationChange = (
    stationId: string,
  ) => {
    setDestinationStationId(
      stationId,
    );

    setAnalytics(null);
    setAnalyticsError("");
  };

  async function loadAnalytics() {
    if (
      !selectedJourneyId ||
      !originStationId ||
      !destinationStationId
    ) {
      return;
    }

    setIsLoadingAnalytics(true);
    setAnalyticsError("");

    try {
      const result =
        await getJourneyAnalytics({
          journeyId:
            selectedJourneyId,

          originStationId,

          destinationStationId,
        });

      setAnalytics(result);
    } catch (error: unknown) {
      setAnalytics(null);

      setAnalyticsError(
        getErrorMessage(
          error,
          "Unable to load journey analytics.",
        ),
      );
    } finally {
      setIsLoadingAnalytics(false);
    }
  }

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  if (isLoadingDashboard) {
    return (
      <main className="admin-dashboard-loading">
        <span
          className="admin-dashboard-spinner"
          aria-hidden="true"
        />

        <p>
          Loading administrator dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-eyebrow">
            Railway department portal
          </p>

          <h1>
            Operations dashboard
          </h1>

          <p className="admin-dashboard-subtitle">
            Monitor reservations, revenue,
            journey occupancy and coach usage.
          </p>
        </div>

        <div className="admin-profile-area">
          <div className="admin-profile">
            <span className="admin-avatar">
              {admin?.name
                .charAt(0)
                .toUpperCase() ?? "A"}
            </span>

            <div>
              <strong>
                {admin?.name ??
                  "Administrator"}
              </strong>

              <span>
                {admin?.role ??
                  "ADMIN"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-dashboard-container">
        {dashboardError ? (
          <section
            className="admin-dashboard-error"
            role="alert"
          >
            <strong>
              Dashboard could not be loaded
            </strong>

            <p>{dashboardError}</p>

            <button
              type="button"
              onClick={() => {
                void loadDashboardData();
              }}
            >
              Try again
            </button>
          </section>
        ) : null}

        <section className="admin-metric-grid">
          <article className="admin-metric-card">
            <span className="admin-metric-label">
              Confirmed bookings
            </span>

            <strong className="admin-metric-value">
              {summary?.confirmedBookingCount ??
                0}
            </strong>

            <p>
              Active reservations across all
              journeys
            </p>
          </article>

          <article className="admin-metric-card">
            <span className="admin-metric-label">
              Total revenue
            </span>

            <strong className="admin-metric-value">
              {formatCurrency(
                summary?.totalRevenue ?? 0,
              )}
            </strong>

            <p>
              Revenue from confirmed bookings
            </p>
          </article>

          <article className="admin-metric-card">
            <span className="admin-metric-label">
              Cancelled bookings
            </span>

            <strong className="admin-metric-value">
              {summary?.cancelledBookingCount ??
                0}
            </strong>

            <p>
              Cancelled reservations excluded
              from revenue
            </p>
          </article>

          <article className="admin-metric-card">
            <span className="admin-metric-label">
              Scheduled journeys
            </span>

            <strong className="admin-metric-value">
              {summary?.journeyCount ?? 0}
            </strong>

            <p>
              Journeys currently available in
              the system
            </p>
          </article>
        </section>

        <section className="admin-dashboard-card">
          <div className="admin-section-heading">
            <div>
              <p className="admin-dashboard-eyebrow">
                Segment analytics
              </p>

              <h2>
                Journey occupancy
              </h2>

              <p>
                Select a journey and route
                segment to calculate reserved
                seat occupancy.
              </p>
            </div>
          </div>

          <div className="admin-filter-grid">
            <div className="admin-form-group">
              <label htmlFor="adminJourney">
                Journey
              </label>

              <select
                id="adminJourney"
                value={selectedJourneyId}
                onChange={(event) =>
                  setSelectedJourneyId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select journey
                </option>

                {journeys.map(
                  (journey) => (
                    <option
                      key={journey.id}
                      value={journey.id}
                    >
                      Train{" "}
                      {
                        journey.trainNumber
                      }{" "}
                      ·{" "}
                      {journey.route.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="adminOrigin">
                Origin
              </label>

              <select
                id="adminOrigin"
                value={originStationId}
                disabled={
                  !selectedJourney ||
                  isLoadingJourney
                }
                onChange={(event) =>
                  handleOriginChange(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select origin
                </option>

                {selectedJourney?.route.stations
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

            <div className="admin-form-group">
              <label htmlFor="adminDestination">
                Destination
              </label>

              <select
                id="adminDestination"
                value={
                  destinationStationId
                }
                disabled={
                  !originStationId ||
                  isLoadingJourney
                }
                onChange={(event) =>
                  handleDestinationChange(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select destination
                </option>

                {destinationOptions.map(
                  (station) => (
                    <option
                      key={station.id}
                      value={station.id}
                    >
                      {station.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="button"
              className="admin-analyse-button"
              disabled={
                !selectedJourneyId ||
                !originStationId ||
                !destinationStationId ||
                isLoadingAnalytics
              }
              onClick={() => {
                void loadAnalytics();
              }}
            >
              {isLoadingAnalytics
                ? "Calculating..."
                : "Analyse segment"}
            </button>
          </div>

          {analyticsError ? (
            <div
              className="admin-inline-error"
              role="alert"
            >
              {analyticsError}
            </div>
          ) : null}

          {analytics ? (
            <>
              <div className="admin-occupancy-summary">
                <article>
                  <span>
                    Total reserved seats
                  </span>

                  <strong>
                    {
                      analytics.summary
                        .totalReservedSeats
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Occupied seats
                  </span>

                  <strong>
                    {
                      analytics.summary
                        .occupiedSeats
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Available seats
                  </span>

                  <strong>
                    {
                      analytics.summary
                        .availableSeats
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Occupancy
                  </span>

                  <strong>
                    {
                      analytics.summary
                        .occupancyPercentage
                    }
                    %
                  </strong>
                </article>
              </div>

              <div className="admin-occupancy-progress">
                <div className="admin-progress-heading">
                  <span>
                    {
                      analytics.segment.origin
                        .name
                    }{" "}
                    →{" "}
                    {
                      analytics.segment
                        .destination.name
                    }
                  </span>

                  <strong>
                    {
                      analytics.summary
                        .occupancyPercentage
                    }
                    %
                  </strong>
                </div>

                <div className="admin-progress-track">
                  <span
                    style={{
                      width: `${Math.min(
                        analytics.summary
                          .occupancyPercentage,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="admin-coach-grid">
                {analytics.coaches.map(
                  (coach) => (
                    <article
                      className="admin-coach-card"
                      key={coach.coachId}
                    >
                      <div className="admin-coach-heading">
                        <div>
                          <strong>
                            Coach {coach.code}
                          </strong>

                          <span>
                            {coach.name}
                          </span>
                        </div>

                        <strong>
                          {
                            coach.occupancyPercentage
                          }
                          %
                        </strong>
                      </div>

                      <div className="admin-progress-track">
                        <span
                          style={{
                            width: `${Math.min(
                              coach.occupancyPercentage,
                              100,
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="admin-coach-statistics">
                        <span>
                          {coach.occupiedSeats}{" "}
                          occupied
                        </span>

                        <span>
                          {coach.availableSeats}{" "}
                          available
                        </span>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </>
          ) : (
            <div className="admin-empty-analytics">
              Select a segment and click
              “Analyse segment” to view
              occupancy information.
            </div>
          )}
        </section>

        <section className="admin-dashboard-card">
          <div className="admin-section-heading">
            <div>
              <p className="admin-dashboard-eyebrow">
                Booking activity
              </p>

              <h2>Recent bookings</h2>

              <p>
                The latest reservations created
                in the booking system.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={() => {
                void loadDashboardData();
              }}
            >
              Refresh
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="admin-empty-table">
              No bookings have been created
              yet.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Passenger</th>
                    <th>Journey</th>
                    <th>Segment</th>
                    <th>Seat</th>
                    <th>Fare</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map(
                    (booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>
                            {
                              booking.bookingReference
                            }
                          </strong>
                        </td>

                        <td>
                          <span>
                            {
                              booking.passengerName
                            }
                          </span>

                          <small>
                            {booking.passengerEmail ??
                              "No email"}
                          </small>
                        </td>

                        <td>
                          Train{" "}
                          {
                            booking.journey
                              .trainNumber
                          }
                        </td>

                        <td>
                          {
                            booking.segment
                              .origin
                          }{" "}
                          →{" "}
                          {
                            booking.segment
                              .destination
                          }
                        </td>

                        <td>
                          {
                            booking.seat
                              .coachCode
                          }
                          -
                          {
                            booking.seat
                              .seatNumber
                          }
                        </td>

                        <td>
                          {formatCurrency(
                            booking.fare,
                          )}
                        </td>

                        <td>
                          <span
                            className={`admin-status admin-status-${booking.status.toLowerCase()}`}
                          >
                            {booking.status}
                          </span>
                        </td>

                        <td>
                          {formatDateTime(
                            booking.createdAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}