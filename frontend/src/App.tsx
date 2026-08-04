import {
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { BookingPage } from "./pages/BookingPage";

function PassengerBookingLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <p className="app-eyebrow">
              Sri Lanka Railways
            </p>

            <h1>
              Segment-Based Train Booking
            </h1>
          </div>

          <div className="app-badge">
            Colombo Fort → Badulla
          </div>
        </div>
      </header>

      <main className="app-main">
        <BookingPage />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PassengerBookingLayout />}
      />

      <Route
        path="/admin/login"
        element={<AdminLoginPage />}
      />

      <Route element={<ProtectedAdminRoute />}>
        <Route
          path="/admin"
          element={<AdminDashboardPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;