import axios from "axios";
import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

import type {
  FormEvent,
} from "react";

import type {
  ApiErrorResponse,
} from "../types";

import "./AdminLoginPage.css";

interface LoginLocationState {
  from?: string;
}

function getLoginErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<
      ApiErrorResponse
    >(error)
  ) {
    return (
      error.response?.data?.error
        ?.message ??
      "Unable to sign in. Please try again."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sign in. Please try again.";
}

export function AdminLoginPage() {
  const {
    login,
    isAuthenticated,
    isInitializing,
  } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const locationState =
    location.state as
      | LoginLocationState
      | null;

  const destination =
    locationState?.from ??
    "/admin";

  useEffect(() => {
    setErrorMessage("");
  }, [email, password]);

  if (
    !isInitializing &&
    isAuthenticated
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate(destination, {
        replace: true,
      });
    } catch (error: unknown) {
      setErrorMessage(
        getLoginErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual">
        <div className="admin-login-overlay" />

        <div className="admin-login-visual-content">
          <div className="admin-login-brand">
            Train Operations
          </div>

          <p className="admin-login-eyebrow">
            Department administration
          </p>

          <h1>
            Monitor bookings, occupancy,
            and revenue
          </h1>

          <p className="admin-login-description">
            Secure access for authorized
            railway department administrators.
          </p>

          <div className="admin-login-features">
            <div>
              <strong>
                Segment analytics
              </strong>

              <span>
                Review occupancy for any
                selected travel segment.
              </span>
            </div>

            <div>
              <strong>
                Revenue overview
              </strong>

              <span>
                Track confirmed booking
                revenue and activity.
              </span>
            </div>

            <div>
              <strong>
                Coach insights
              </strong>

              <span>
                Compare reserved coach
                utilization.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-login-form-panel">
        <div className="admin-login-form-container">
          <div className="admin-login-heading">
            <p className="admin-login-eyebrow">
              Administrator portal
            </p>

            <h2>Sign in to continue</h2>

            <p>
              Enter your administrator account
              credentials.
            </p>
          </div>

          <form
            className="admin-login-form"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="admin-login-field">
              <label htmlFor="adminEmail">
                Email address
              </label>

              <input
                id="adminEmail"
                type="email"
                value={email}
                autoComplete="email"
                placeholder="admin@trainbooking.lk"
                required
                disabled={isSubmitting}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="admin-login-field">
              <label htmlFor="adminPassword">
                Password
              </label>

              <input
                id="adminPassword"
                type="password"
                value={password}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                minLength={8}
                maxLength={72}
                disabled={isSubmitting}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
              />
            </div>

            {errorMessage ? (
              <div
                className="admin-login-error"
                role="alert"
              >
                <strong>
                  Sign-in failed
                </strong>

                <p>{errorMessage}</p>
              </div>
            ) : null}

            <button
              type="submit"
              className="admin-login-button"
              disabled={
                isSubmitting ||
                !email.trim() ||
                password.length < 8
              }
            >
              {isSubmitting
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <div className="admin-login-security-note">
            <span
              aria-hidden="true"
              className="admin-login-lock"
            >
              ●
            </span>

            <p>
              This area is restricted to
              authorized administrators.
              Sessions automatically expire.
            </p>
          </div>

          <a
            className="admin-login-back-link"
            href="/"
          >
            ← Return to passenger booking
          </a>
        </div>
      </section>
    </main>
  );
}