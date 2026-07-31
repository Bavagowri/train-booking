# Segment-Based Train Seat Booking System

A full-stack train reservation application designed for Sri Lanka's Colombo Fort–Badulla railway line.

The system allows the same reserved seat to be booked by multiple passengers for non-overlapping sections of one train journey. For example, one passenger can reserve a seat from Colombo Fort to Kandy, and another passenger can reserve the same physical seat from Kandy to Badulla.

## Project Status

The project foundation and database layer are currently implemented.

Completed:

* React and TypeScript frontend setup
* Express and TypeScript backend setup
* PostgreSQL database running through Docker Compose
* Prisma ORM configuration
* Initial database migration
* Configurable station, route, coach, seat, journey, and booking models
* Seed data for the Colombo Fort–Badulla route
* Three reserved coaches with forty seats each
* Five unreserved coaches
* One sample train journey

In progress:

* Journey and station APIs
* Segment-based seat availability
* Concurrency-safe booking
* Fare calculation
* React booking interface
* Complete Docker setup for frontend and backend

## Core Requirement

A reserved seat should become available again after the passenger using it leaves the train.

Example:

```text
Passenger A: Colombo Fort → Kandy
Passenger B: Kandy → Badulla
```

Both passengers can use the same seat because their journey segments are adjacent and do not overlap.

However:

```text
Passenger A: Colombo Fort → Kandy
Passenger B: Gampaha → Ella
```

These bookings cannot use the same seat because their journey segments overlap.

## Segment Model

Each route station has a numerical stop order.

Example:

```text
Colombo Fort  1
Ragama        2
Gampaha       3
Veyangoda     4
Rambukkana    5
Kandy         6
Hatton        7
Nanu Oya      8
Ella          9
Badulla      10
```

A booking is treated as a half-open interval:

```text
[originOrder, destinationOrder)
```

Two bookings overlap when:

```text
existingOrigin < requestedDestination
AND
existingDestination > requestedOrigin
```

Using half-open intervals allows adjacent journeys to reuse the same seat.

For example:

```text
Colombo Fort → Kandy = [1, 6)
Kandy → Badulla      = [6, 10)
```

These intervals do not overlap.

## Planned Concurrency Strategy

Creating a booking will happen inside a PostgreSQL transaction.

The planned flow is:

1. Begin a database transaction.
2. Lock the selected seat using `SELECT ... FOR UPDATE`.
3. Check for overlapping confirmed bookings.
4. Reject the request if a conflict exists.
5. Create the booking if the seat remains available.
6. Commit the transaction.

This ensures that two passengers cannot successfully reserve the same seat for overlapping segments at the same time.

## Planned Fare Calculation

The initial fare model will use the distance between the selected stations.

```text
fare = base fare + distance travelled × price per kilometre
```

The backend will calculate the fare. The frontend will not be allowed to submit or control the final price.

The fare model can later be extended to support:

* Different coach classes
* Peak and off-peak pricing
* Discounts
* Taxes
* Minimum fares
* Station-specific rates

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* TanStack Query
* Axios

### Backend

* Node.js
* Express
* TypeScript
* Zod
* Prisma ORM

### Database and Infrastructure

* PostgreSQL
* Docker
* Docker Compose

## Project Structure

```text
train-booking/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── prisma.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Database Design

### Station

Represents a physical railway station.

Important fields:

* `id`
* `code`
* `name`

### Route

Represents an ordered railway route.

The initial route is:

```text
Colombo Fort → Badulla
```

### RouteStation

Connects a station to a route.

It stores:

* Station position using `stopOrder`
* Distance from the beginning of the route
* Relationship to the route and station

This keeps route ordering configurable instead of hardcoding station positions in application logic.

### Journey

Represents a specific train departure.

A journey includes:

* Route
* Train number
* Departure time

Bookings belong to a journey so the same physical seat can be booked independently on different train departures.

### Coach

Represents a train coach.

Coach types:

* `RESERVED`
* `UNRESERVED`

The initial configuration contains:

* Three reserved coaches
* Five unreserved coaches

### Seat

Represents an assignable seat inside a reserved coach.

Each reserved coach initially contains forty seats.

Seat counts are generated from configuration rather than manually hardcoded into the database.

### Booking

Represents a passenger seat reservation.

A booking stores:

* Journey
* Seat
* Origin route station
* Destination route station
* Origin stop order
* Destination stop order
* Travel distance
* Fare
* Booking status
* Passenger information
* Booking reference

## Seed Data

The development database contains:

* 10 stations
* 1 route
* 10 ordered route stations
* 3 reserved coaches
* 5 unreserved coaches
* 40 seats per reserved coach
* 120 reserved seats in total
* 1 sample journey
* 0 initial bookings

## Prerequisites

Install the following:

* Node.js 22
* npm
* Docker Desktop
* Git

Confirm the versions:

```bash
node --version
npm --version
docker --version
docker compose version
```

## Environment Configuration

Create:

```text
backend/.env
```

Use:

```env
DATABASE_URL="postgresql://train_user:train_password@localhost:5433/train_booking?schema=public"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

The Docker PostgreSQL service uses host port `5433` because port `5432` may already be used by a locally installed PostgreSQL server.

Do not commit `.env`.

Use `.env.example` to document required environment variables.

## Running the Database

From the project root:

```bash
docker compose up -d database
```

Check the service:

```bash
docker compose ps
```

View database logs:

```bash
docker compose logs database
```

Stop the services:

```bash
docker compose down
```

Stop services and delete database data:

```bash
docker compose down -v
```

The `-v` command permanently removes the development database volume.

## Prisma Commands

Run these commands from the `backend` directory.

Format the schema:

```bash
npx prisma format
```

Validate the schema:

```bash
npx prisma validate
```

Generate Prisma Client:

```bash
npx prisma generate
```

Create or apply a development migration:

```bash
npx prisma migrate dev
```

Check migration status:

```bash
npx prisma migrate status
```

Seed the database:

```bash
npm run prisma:seed
```

Open Prisma Studio:

```bash
npx prisma studio
```

## Initial Setup

Clone the repository:

```bash
git clone <repository-url>
cd train-booking
```

Start PostgreSQL:

```bash
docker compose up -d database
```

Install backend dependencies:

```bash
cd backend
nvm use
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npm run prisma:seed
```

Start the backend during development:

```bash
npm run dev
```

In another terminal, install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Planned API Endpoints

### Health check

```http
GET /api/health
```

### List journeys

```http
GET /api/journeys
```

### Get journey and ordered stations

```http
GET /api/journeys/:journeyId
```

### Find available seats

```http
GET /api/journeys/:journeyId/available-seats
```

Expected query parameters:

```text
originStationId
destinationStationId
```

### Create booking

```http
POST /api/bookings
```

### Retrieve booking

```http
GET /api/bookings/:bookingReference
```

## Planned Core User Flow

1. Select a train journey.
2. Select an origin station.
3. Select a destination station.
4. Search for seats available on that segment.
5. Select an available reserved seat.
6. Enter passenger details.
7. Confirm the booking.
8. Receive a booking reference.

## Design Decisions

### Why PostgreSQL?

PostgreSQL provides reliable transactions and row-level locking, which are important for preventing concurrent booking conflicts.

### Why Prisma?

Prisma provides:

* Type-safe database access
* Database migrations
* Schema-based modelling
* A convenient development interface through Prisma Studio

### Why store station order?

Seat availability depends on whether journey segments overlap. Numerical station ordering makes overlap checks straightforward and efficient.

### Why include Journey?

Availability must be calculated for a particular train departure. The same seat can therefore be booked for the same segment on different journeys.

### Why not create one database row for every segment?

A separate occupancy row for every seat and every station pair would create more records and more complicated updates.

The current design stores one booking interval and detects conflicts using station order values. This is simpler for the initial implementation while remaining scalable for the assignment requirements.

### Why are unreserved coaches included without seats?

The assignment distinguishes reserved and unreserved coaches. Only reserved coaches require seat assignment. Unreserved coaches are represented for accurate train configuration, but individual seats are not created for them.

## Future Improvements

After the core booking system is complete, possible enhancements include:

* Visual seat map
* Booking cancellation
* Waitlist support
* Admin occupancy dashboard
* Revenue reports
* Authentication
* Payment integration
* Email booking confirmation
* Real-time seat availability updates
* Multiple routes and return journeys
* Coach-specific fares
* Automated integration and concurrency tests

## Version Control

The project uses Git and GitHub.

Development should use small, meaningful commits such as:

```text
feat: initialize train booking application foundation
feat: add journey and station endpoints
feat: implement segment-based seat availability
feat: add concurrency-safe booking transactions
feat: build train booking interface
test: cover overlapping and adjacent booking segments
chore: add complete Docker Compose setup
docs: document architecture and design decisions
```

## Security

* Secrets are stored in environment variables.
* `.env` files are excluded from version control.
* The backend will validate request data using Zod.
* Fare values will be calculated by the backend.
* Database transactions will protect booking consistency.

## License

This project was created as part of a Software Engineer interview assignment.
