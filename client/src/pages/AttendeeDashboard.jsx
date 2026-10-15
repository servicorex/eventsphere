import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle
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
      setMsg({ type: 'success', text: `Registration confirmed! Pass Generated: ${res.ticket.ticket_code}` });
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
      title="Attendee Operations & Digital Passes"
      subtitle="Register for upcoming college festivals, view digital tickets, and simulate gate entry"
    >
      <AlertBanner
        message={msg?.text}
        type={msg?.type}
        onClose={() => setMsg(null)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Register Box */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={20} color="#7C3AED" />
              <span>Register for an Event</span>
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
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
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} color="#059669" />
              <span>Gate Entry Scanner & Verification</span>
            </h3>
          </div>
          <div className="card-body">
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748B', fontSize: '0.875rem' }}>
              Enter or scan a digital pass code to verify the ticket against PostgreSQL records:
            </p>

            <form onSubmit={handleVerifyTicket}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Pass Code *
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem', fontFamily: 'monospace', fontWeight: 700 }}
                  placeholder="e.g. TCK-1-XYZ123"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', backgroundColor: '#059669' }}
              >
                Verify & Check-In
              </button>
            </form>

            {checkInResult && (
              <div
                className={`ui-alert ${checkInResult.success ? 'ui-alert-success' : 'ui-alert-error'}`}
                style={{ marginTop: '1rem', marginBottom: 0 }}
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
          <h3 className="card-title">Issued Passes & Check-in Status ({tickets.length})</h3>
        </div>
        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No passes issued yet"
            description="Use the form above to register an attendee for an event."
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Pass Code</th>
                  <th>Attendee Name</th>
                  <th>Event</th>
                  <th>Event Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1D4ED8' }}>
                      {t.ticket_code}
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
