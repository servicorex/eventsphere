# EventSphere — Smart Event Planning & Resource Management System

## Milestone 1: Event Planning, Venue Reservation & Resource Management

EventSphere is a web-based Event Planning and Resource Management System designed to centralize event organization, venue reservation, equipment allocation, scheduling conflict detection, and attendee operations.

---

## Architecture Overview

- **Frontend (`client/`)**: React 18, Vite 6, React Router 6, Lucide icons, Vanilla CSS Design System with Navy-Blue aesthetic.
- **Backend (`server/`)**: Node.js, Express, PostgreSQL client (`pg`), `bcryptjs`, `express-session`, `connect-pg-simple`.
- **Database (`PostgreSQL`)**: Normalized relational schema (`users`, `venues`, `resources`, `events`, `event_resources`, and `session`).

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on Node v24)
- **PostgreSQL**: v14+ (tested on PostgreSQL 18.4, port 5432)

---

## 2. Environment Setup

### Backend Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection Settings
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=eventsphere_db

# Session Security
SESSION_SECRET=eventsphere_super_secret_session_key_2026_xyz987654321
SESSION_MAX_AGE_MS=86400000

# Client URL (CORS allowed origin)
CLIENT_URL=http://localhost:5173

# Initial Admin Credentials (used by seed:admin)
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@eventsphere.com
ADMIN_PASSWORD=AdminSecurePass!2026
```

### Frontend Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_BASE_URL=/api
```

---

## 3. Database Migrations & Data Provisioning

Run all commands from the `server` directory:

### Step 1: Run Migrations
Applies schema migrations:
- `001_create_users_table.sql`: Users table with roles (`ADMIN`, `ORGANIZER`, `VENDOR`, `ATTENDEE`) and session table.
- `002_create_eventsphere_core_tables.sql`: Venues, Resources, Events, and Event_Resources allocation tables.
```bash
cd server
npm run migrate
```

### Step 2: Provision Initial Administrator Safely
Creates the initial administrator account from environment variables without exposing public registration endpoints or printing passwords:
```bash
npm run seed:admin
```

### Step 3: Seed Demo Accounts & Milestone 1 Sample Data
Populates sample venues, resources, demo users, and an initial TechFest event:
```bash
npm run seed:demo
npm run seed:milestone1
```

#### Seeded Accounts & Roles
| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@eventsphere.com` | `AdminSecurePass!2026` |
| **ORGANIZER** | `organizer@eventsphere.com` | `OrganizerPass!2026` |
| **VENDOR** | `vendor@eventsphere.com` | `VendorPass!2026` |
| **ATTENDEE** | `attendee@eventsphere.com` | `AttendeePass!2026` |

---

## 4. Running the Application

### Start Backend API Server
```bash
cd server
npm run dev
# Server runs at: http://localhost:5000
# Health check:  http://localhost:5000/api/health
```

### Start Frontend Client
```bash
cd client
npm run dev
# Frontend runs at: http://localhost:5173
```

---

## 5. Milestone 1 Implemented Features & Frontend Routes

### Frontend Application Routes
- `/dashboard`: Real-time KPI dashboard (Total Events, Upcoming, Venues, Resource stock) with quick actions and recent events.
- `/events`: Full event management interface (search, status filters, data table, create/edit modal with live capacity warnings, deletion).
- `/events/:id`: Dedicated event details page displaying schedule, venue specs, expected attendance, budget, and allocated equipment.
- `/venues`: Venue management interface (search, availability filters, capacity limits, day rates, edit, delete protections).
- `/resources`: Resource inventory and allocation console (Equipment, Staff, Transport, live stock deduction, allocation dialog).
- `/schedule`: Chronological timetable grouped by date with search and date filters.

### 1. Event Management (CRUD)
- Create, view list, inspect details, update, and delete events.
- Fields: Title, Event Type, Date, Start Time, End Time, Budget, Expected Attendees, Venue.
- Automatic cascade and release of allocated equipment upon event deletion.

### 2. Venue Management & Attendee Capacity Validation
- Venue fields: Code, Name, Location, Capacity, Availability, Cost Per Day.
- **Capacity Validation**: Rejects event creation or update if `Expected Attendees > Venue Capacity` with error:
  `"Selected venue does not have sufficient capacity."`
- Frontend provides instant inline warning callout before submission.

### 3. Resource Management, Allocation & Auto-Release
- Resource fields: Code, Name, Type (`Equipment`, `Staff`, `Transport`, `Other`), Total Quantity, Available Quantity, Status.
- Allocating resources to an event automatically deducts available inventory.
- Deleting or cancelling an event automatically releases and restores inventory.
- Over-allocation beyond available stock is rejected.

### 4. Scheduling & Venue Conflict Detection Engine
- Prevents double-booking: detects if the selected venue is already booked for an overlapping time window (`start_time < existing.end_time AND end_time > existing.start_time`) on the same date.
- Returns `409 Conflict` with clear explanation:
  `"Venue Conflict: [Venue Name] is already booked on [Date] between [Start] and [End] for [Event Title]."`

### 5. Dashboard Analytics from PostgreSQL
- Live metrics directly aggregated from the database:
  - Total Events
  - Upcoming Events (date >= current date)
  - Available Venues
  - Total Resource Types & Available Stock
  - Recent Events Schedule

---

## 6. Automated Test Suite (17/17 Passed)

Run the full integration test suite in `server`:
```bash
cd server
npm test
```

### Test Results Breakdown
- **`milestone1.test.js` (7 Tests)**:
  1. Venue CRUD operations.
  2. Resource CRUD and quantity management.
  3. Capacity Validation: Rejection when expected attendees exceed venue capacity.
  4. Event Creation & atomic resource allocation.
  5. Venue Conflict Detection: 409 rejection on overlapping time windows; success on non-conflicting schedules.
  6. Resource Release: Automatic stock restoration upon event deletion.
  7. Dashboard Analytics: PostgreSQL aggregation queries.
- **`auth.test.js` (10 Tests)**:
  1. Successful login with HTTP-only cookie.
  2. Incorrect password rejection.
  3. Unknown email rejection.
  4. Missing fields validation.
  5. Disabled account prevention (403).
  6. Unauthenticated access prevention (401).
  7. Authenticated session retrieval (`/api/auth/me`).
  8. Session termination and invalidation on logout.
  9. Unauthorized role access prevention (403).
  10. Duplicate admin email prevention during provisioning.
