-- ====================================================================
-- EventSphere - Migration 003: Attendees, Tickets, Registrations, Vendor Contracts
-- ====================================================================

-- 1. Attendee Registrations & Digital Tickets
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    check_in_status VARCHAR(50) NOT NULL DEFAULT 'Registered' CHECK (check_in_status IN ('Registered', 'Checked-In')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_reg_email ON event_registrations (attendee_email);

-- 2. Vendor Contracts & Invoices
CREATE TABLE IF NOT EXISTS vendor_contracts (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    contract_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Approved', 'Paid')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_event ON vendor_contracts (event_id);
