-- ====================================================================
-- EventSphere - Migration 002: Venues, Resources, Events, Event_Resources
-- ====================================================================

-- 1. Venues Table
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    venue_code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    availability VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (availability IN ('Available', 'Booked', 'Maintenance')),
    cost_per_day NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_per_day >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_availability ON venues (availability);

-- 2. Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    resource_code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Equipment', 'Staff', 'Transport', 'Other')),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Depleted', 'Maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_available_qty CHECK (available_quantity <= quantity)
);

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources (status);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0),
    expected_attendees INTEGER NOT NULL DEFAULT 0 CHECK (expected_attendees >= 0),
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    organizer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events (date);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events (venue_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);

-- 4. Event Resources Allocation Table
CREATE TABLE IF NOT EXISTS event_resources (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_resource UNIQUE (event_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_event_resources_event ON event_resources (event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_resource ON event_resources (resource_id);
