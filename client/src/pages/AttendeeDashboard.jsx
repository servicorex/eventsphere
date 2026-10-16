import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { useAuth } from '../context/AuthContext';
import { eventsApi, opsApi } from '../services/api';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendeeName, setAttendeeName] = useState(user?.name || '');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || '');
  const [msg, setMsg] = useState(null);

  const [checkInCode, setCheckInCode] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evRes, tckRes] = await Promise.all([
        eventsApi.getAll().catch(() => ({ events: [] })),
        opsApi.getRegistrations().catch(() => ({ registrations: [] }))
      ]);
      if (evRes?.events) {
        setEvents(evRes.events);
        if (evRes.events.length > 0 && !selectedEventId) {
          setSelectedEventId(evRes.events[0].id);
        }
      }
      if (tckRes?.registrations) setTickets(tckRes.registrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await opsApi.register({
        event_id: parseInt(selectedEventId, 10),
        attendee_name: attendeeName.trim(),
        attendee_email: attendeeEmail.trim()
      });
      setMsg({ type: 'success', text: `Registration confirmed! Digital Pass Code: ${res.ticket.ticket_code}` });
      await loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Registration failed' });
    }
  };

  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    setCheckInResult(null);
    try {
      const res = await opsApi.checkIn({ ticketCode: checkInCode });
      setCheckInResult({ success: true, text: res.message });
      await loadData();
    } catch (err) {
      setCheckInResult({ success: false, text: err.message || 'Verification failed.' });
    }
  };

  return (
    <AppLayout
      title="Attendee Hub & Digital Passes"
      subtitle="Register for upcoming college festivals, view digital tickets, and simulate gate entry"
    >
      <AlertBanner
        message={msg?.text}
        type={msg?.type}
        onClose={() => setMsg(null)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
        {/* Register Box */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ticket size={18} color="var(--color-purple)" />
                <span>Register for an Event</span>
              </h3>
              <p className="card-subtitle">Generate an official barcode pass backed by PostgreSQL</p>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">
                  Select Event *
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  required
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.date})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label className="form-label">
                  Attendee Full Name *
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Generate Digital Pass
              </button>
            </form>
          </div>
        </div>

        {/* Gate Check-in Box */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="var(--color-success)" />
                <span>Gate Entry Scanner & Verification</span>
              </h3>
              <p className="card-subtitle">Simulate barcode check-in and attendee badge validation</p>
            </div>
          </div>
          <div className="card-body">
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Enter or paste a digital pass code to verify the ticket against PostgreSQL records:
            </p>

            <form onSubmit={handleVerifyTicket}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Pass Code *
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  placeholder="e.g. TCK-1-XYZ123"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--color-success)' }}
              >
                <UserCheck size={16} />
                <span>Verify & Check-In</span>
              </button>
            </form>

            {checkInResult && (
              <div
                className={`ui-alert ${checkInResult.success ? 'ui-alert-success' : 'ui-alert-error'}`}
                style={{ marginTop: '1.25rem', marginBottom: 0 }}
              >
                <span>{checkInResult.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Issued Passes & Check-in Records</h3>
            <p className="card-subtitle">Live registration registry ({tickets.length} attendees)</p>
          </div>
        </div>
        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No passes issued yet"
            description="Use the registration form above to issue a digital pass."
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Digital Pass Code</th>
                  <th>Attendee Name</th>
                  <th>Event</th>
                  <th>Event Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--color-brand)',
                        background: 'var(--color-brand-subtle)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--color-brand-border)',
                        fontSize: '0.8rem'
                      }}>
                        {t.ticket_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.attendee_name}</td>
                    <td>{t.event_title}</td>
                    <td>{t.event_date}</td>
                    <td>
                      <span className={`badge badge-${t.check_in_status === 'Checked-In' ? 'available' : 'maintenance'}`}>
                        {t.check_in_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
