# Segment-Based Train Booking System

A full-stack train reservation application that supports booking a physical seat for only part of a train journey.

Unlike a traditional reservation system, a seat becomes available again after a passenger leaves the train. For example:

- Passenger A books Colombo Fort → Kandy
- Passenger B can book the same physical seat from Kandy → Badulla
- A booking that overlaps Passenger A’s segment is rejected

The system includes a passenger booking interface, journey-specific coach allocation, concurrency-safe reservations, configurable fare calculation, and a protected administrator dashboard.

---

## Features

### Passenger booking

- View scheduled train journeys
- Select an origin and destination
- Restrict destinations to stations after the selected origin
- View available reserved seats for the selected journey segment
- Select seats using a visual coach seat map
- Enter passenger information
- Select a passenger category
- View a detailed fare breakdown
- Confirm a booking
- Retrieve booking information using a booking reference
- Reuse the same seat for adjacent non-overlapping journey segments

### Segment-based seat allocation

Seat occupancy is represented using half-open route intervals:

```text
[originOrder, destinationOrder)
```

Two bookings overlap when:

```text
existingOrigin < requestedDestination
AND
existingDestination > requestedOrigin
```

This allows adjacent bookings:

```text
Colombo Fort → Kandy
Kandy → Badulla
```

while rejecting overlapping bookings:

```text
Colombo Fort → Kandy
Gampaha → Ella
```

### Concurrency-safe booking

The availability endpoint is informative only. Availability is checked again during booking.

The booking transaction:

1. Validates the journey and route segment
2. Locks the selected seat row using PostgreSQL `FOR UPDATE`
3. Verifies that the seat belongs to a reserved coach assigned to the journey
4. Rechecks for overlapping confirmed bookings
5. Calculates the fare on the backend
6. Creates exactly one confirmed booking

When two users attempt to reserve the same seat for overlapping segments concurrently:

```text
One request succeeds with 201 Created
One request fails with 409 Conflict
```

### Journey-specific coach allocation

Coaches are assigned to journeys through the `JourneyCoach` model.

```text
Journey
  └── JourneyCoach
        └── Coach
              └── Seat
```

This ensures that the availability API returns only seats from reserved coaches assigned to the selected journey.

The current seed data contains:

- 3 reserved coaches
- 5 unreserved coaches
- 40 seats per reserved coach
- 120 reservable seats in total

Unreserved coaches are assigned to the journey but do not appear in the seat-selection interface because they do not use assigned seating.

### Configurable fare engine

Fare calculation is handled entirely by the backend.

The fare engine currently supports:

- Base fare
- Minimum fare
- Progressive distance bands
- Reserved-seat surcharge
- Peak-time surcharge
- Passenger-category discounts
- Detailed fare breakdown
- Fare snapshot stored with the booking

Current passenger categories:

| Category | Discount |
|---|---:|
| Adult | 0% |
| Child | 50% |
| Senior | 20% |
| Student | 10% |

Seeded progressive distance bands:

| Distance band | Rate |
|---|---:|
| First 50 km | LKR 5 per km |
| Next 100 km | LKR 4 per km |
| Above 150 km | LKR 3 per km |

The frontend displays an estimate, but the backend recalculates and confirms the final fare when the booking is created.

### Administrator portal

The application includes a protected administrator area with:

- Admin login
- Password hashing with bcrypt
- JWT authentication
- Protected admin API routes
- Dashboard summary
- Confirmed booking count
- Cancelled booking count
- Total revenue
- Scheduled journey count
- Segment-specific occupancy
- Coach occupancy
- Recent booking activity
- Administrator logout

The admin dashboard is available at:

```text
/admin/login
```

---

## Technology stack

### Frontend

- React
- TypeScript
- Vite
- Axios
- React Router
- CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JSON Web Tokens
- bcryptjs

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL container

---

## Project structure

```text
train-booking/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── compose.yaml
├── .gitignore
└── README.md
```

---

## Database design

Main models:

```text
Station
Route
RouteStation
Journey
Coach
JourneyCoach
Seat
Booking
FarePolicy
FareBand
Admin
WaitlistEntry
```

### Core relationships

```text
Route
  └── RouteStation
        └── Station

Route
  └── Journey
        ├── JourneyCoach
        │     └── Coach
        │           └── Seat
        ├── Booking
        └── WaitlistEntry
```

### Booking data snapshot

Each booking stores:

- Journey ID
- Seat ID
- Origin and destination route-station IDs
- Origin and destination stop order
- Distance
- Passenger details
- Passenger category
- Final charged fare
- Fare breakdown
- Booking status

The fare is stored at booking time so future fare-policy changes do not alter historical bookings.

---

## Seed data

The seed creates:

| Data | Count |
|---|---:|
| Stations | 10 |
| Routes | 1 |
| Route stations | 10 |
| Journeys | 1 |
| Coaches | 8 |
| Journey-coach assignments | 8 |
| Reserved coaches | 3 |
| Unreserved coaches | 5 |
| Reserved seats | 120 |
| Fare policies | 1 |
| Fare bands | 3 |
| Administrators | 1 |
| Bookings | 0 |
| Waitlist entries | 0 |

Seeded route:

```text
Colombo Fort
Ragama
Gampaha
Veyangoda
Rambukkana
Kandy
Hatton
Nanu Oya
Ella
Badulla
```

Seeded train:

```text
Train number: 1005
Route: Colombo Fort → Badulla
Departure: next day at 05:55
```

---

## Prerequisites

Install:

- Node.js 22 or later
- npm
- Docker Desktop
- Git

Verify:

```bash
node -v
npm -v
docker --version
docker compose version
```

Make sure Docker Desktop is running before starting the database.

---

## Environment variables

### Backend

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL="postgresql://train_user:train_password@localhost:5433/train_booking?schema=public"

PORT=4000
FRONTEND_URL="http://localhost:5173"

JWT_SECRET="replace-with-a-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="2h"

SEED_ADMIN_NAME="System Administrator"
SEED_ADMIN_EMAIL="admin@trainbooking.lk"
SEED_ADMIN_PASSWORD="replace-with-a-development-password"
```

Generate a JWT secret:

```bash
openssl rand -hex 32
```

Do not commit the real `.env` file.

### Frontend

Create:

```text
frontend/.env
```

```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

---

## Local development setup

### 1. Clone the repository

```bash
git clone https://github.com/Bavagowri/train-booking.git
cd train-booking
```

### 2. Start PostgreSQL

From the project root:

```bash
docker compose up -d database
```

Check the container:

```bash
docker compose ps
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Run Prisma migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Seed the database

```bash
npm run prisma:seed
```

### 6. Start the backend

```bash
npm run dev
```

Backend URL:

```text
http://localhost:4000
```

### 7. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 8. Start the frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Useful development commands

### Backend

```bash
npm run dev
npm run build
npm start
npm run prisma:seed
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Docker

```bash
docker compose up -d database
docker compose ps
docker compose logs database
docker compose down
```

---

## API endpoints

Base URL:

```text
http://localhost:4000/api
```

### General

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Application and database health |

### Journeys

| Method | Endpoint | Description |
|---|---|---|
| GET | `/journeys` | List journeys |
| GET | `/journeys/:journeyId` | Get journey details |
| GET | `/journeys/:journeyId/available-seats` | Get segment-specific availability and fare |

Availability query parameters:

```text
originStationId
destinationStationId
```

Example:

```text
GET /api/journeys/:journeyId/available-seats
    ?originStationId=:originRouteStationId
    &destinationStationId=:destinationRouteStationId
```

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings` | Create a booking |
| GET | `/bookings/:bookingReference` | Retrieve a booking |

Example request:

```json
{
  "journeyId": "journey-id",
  "seatId": "seat-id",
  "originStationId": "origin-route-station-id",
  "destinationStationId": "destination-route-station-id",
  "passengerName": "Example Passenger",
  "passengerEmail": "passenger@example.com",
  "passengerCategory": "ADULT"
}
```

### Admin authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/auth/login` | Admin login |
| GET | `/admin/auth/me` | Get authenticated admin |

Protected requests use:

```http
Authorization: Bearer <token>
```

### Admin dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/summary` | Dashboard summary |
| GET | `/admin/bookings` | Recent bookings |
| GET | `/admin/journeys/:journeyId/analytics` | Segment occupancy analytics |

Analytics query parameters:

```text
originStationId
destinationStationId
```

### Waitlist

The database schema supports segment-specific waitlist entries.

Planned or partially implemented endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/waitlist` | Join a fully booked segment waitlist |
| GET | `/waitlist/:waitlistReference` | Retrieve waitlist status |
| GET | `/admin/waitlist` | View waitlist entries |

Update this section when the complete waitlist frontend and admin workflow are finished.

---

## Example booking tests

### Valid booking

```text
Colombo Fort → Kandy
Seat R1-01
```

Expected:

```text
201 Created
```

### Overlapping booking

Existing:

```text
Colombo Fort → Kandy
```

Attempt:

```text
Gampaha → Ella
```

Expected:

```text
409 SEAT_UNAVAILABLE
```

### Adjacent booking

Existing:

```text
Colombo Fort → Kandy
```

Attempt:

```text
Kandy → Badulla
```

Expected:

```text
201 Created
```

### Invalid seat assignment

Attempt to book a seat from a coach that is not assigned to the selected journey.

Expected:

```text
400 SEAT_NOT_ASSIGNED_TO_JOURNEY
```

---

## Error response format

Errors use a consistent structure:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "This seat is no longer available for the selected segment."
  }
}
```

Validation errors may also include details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The booking request contains invalid data.",
    "details": {
      "formErrors": [],
      "fieldErrors": {}
    }
  }
}
```

---

## Design decisions

### Why use route-station IDs?

A station may appear on multiple routes. `RouteStation` stores the station’s position and distance within one specific route.

### Why store origin and destination order in bookings?

The stop order makes overlap checks efficient and avoids repeatedly reconstructing segment positions.

### Why use half-open intervals?

Using:

```text
[originOrder, destinationOrder)
```

allows a seat to be reused immediately at the station where the previous passenger leaves.

### Why lock the seat row?

A normal availability check can become stale before booking. Locking the selected seat inside the transaction serializes competing booking attempts for that physical seat.

### Why recheck availability inside the transaction?

Two customers can view the seat as available at the same time. The authoritative conflict check must happen after the lock is acquired.

### Why use `JourneyCoach`?

Without a journey-coach relationship, every journey would incorrectly see every coach in the database. `JourneyCoach` makes train formation configurable per scheduled departure.

### Why calculate fares on the backend?

Frontend values can be modified by users. The backend must calculate the final fare using the active policy and passenger category.

### Why store the fare breakdown?

Fare rules may change in the future. A stored snapshot explains exactly how the historical booking price was calculated.

---

## Security notes

Current security measures include:

- Passwords hashed with bcrypt
- JWT-based administrator authentication
- Protected admin API routes
- Active-admin verification
- Input validation with Zod
- Helmet security headers
- CORS configuration
- Parameterized Prisma queries
- Backend-authoritative fare and booking validation

For a production launch, additional measures should include:

- HTTP-only secure cookies
- Login rate limiting
- Refresh-token rotation or server-side sessions
- CSRF protection where applicable
- Audit logs
- Password reset workflow
- Role-based authorization
- HTTPS-only deployment
- Secret management
- Monitoring and alerting

---

## Current status

```text
✔ Project setup
✔ Docker PostgreSQL
✔ Prisma schema
✔ Database migrations
✔ Seed data
✔ Health API
✔ Journey API
✔ Station and segment validation
✔ Journey-specific coach allocation
✔ Configurable fare engine
✔ Progressive distance pricing
✔ Passenger-category discounts
✔ Seat availability service
✔ Availability API
✔ Concurrency-safe booking service
✔ Booking API
✔ Booking retrieval API
✔ Passenger React interface
✔ Visual reserved coach seat map
✔ Fare breakdown display
✔ Booking confirmation
✔ Admin database model
✔ Admin JWT authentication
✔ Protected admin routes
✔ Admin dashboard
△ Waitlist schema and backend workflow
⬜ Waitlist passenger interface
⬜ Admin waitlist management
⬜ Full application Dockerization
⬜ Automated tests
⬜ Production deployment configuration
```

---

## Planned improvements

- Complete waitlist passenger workflow
- Automatic waitlist promotion after cancellation
- Expiring seat offers
- Email notifications
- Booking cancellation API
- Admin waitlist management
- Fare-policy administration
- Additional journeys and routes
- Multiple train formations
- Automated unit, integration, and concurrency tests
- Full one-command Docker startup
- CSV report export
- Production authentication hardening

---

## Assumptions and limitations

- Only forward travel on the seeded route is supported
- Only reserved coaches allow seat selection
- Unreserved coaches do not have assigned seats
- One active fare policy is expected
- Fare-policy overlap and fare-band gaps are validated by application logic or seed configuration
- Passenger discount eligibility is not externally verified
- Waitlist automatic promotion is not yet complete
- Admin credentials created by the seed are for development only
- The current admin dashboard is primarily read-only
- The seeded departure time is created dynamically for the following day

---

## License

This project was created as a software engineering assignment and demonstration project.