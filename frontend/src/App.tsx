import "./App.css";

import { BookingPage } from "./pages/BookingPage";

function App() {
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

export default App;