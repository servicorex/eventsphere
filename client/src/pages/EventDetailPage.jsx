import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  DollarSign,
  Package,
  ArrowLeft,
  Trash2,
  CalendarDays,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { ConfirmModal, AlertBanner, LoadingSkeleton } from '../components/UIComponents';
import { eventsApi } from '../services/api';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsApi.getById(id);
      if (res && res.event) {
        setEvent(res.event);
      } else {
        setError('Event not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    try {
      await eventsApi.delete(id);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete event.');
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout
      title={event ? event.title : 'Event Details'}
      subtitle={event ? `${event.event_type} • Scheduled for ${event.date}` : 'Loading...'}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/events')}
          style={{ height: '36px', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Event Directory</span>
        </button>
      </div>

      <AlertBanner message={error} type="error" onClose={() => setError(null)} />

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : event ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
          {/* Main Info Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Event Overview & Logistics</h3>
                <p className="card-subtitle">Detailed schedule and venue capacity specifications</p>
              </div>
              <span className={`badge badge-${event.status?.toLowerCase() || 'scheduled'}`}>
                {event.status}
              </span>
            </div>

            <div className="card-body">
              {/* Highlight Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--canvas-subtle)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Date & Schedule
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Calendar size={18} color="var(--color-brand)" />
                    <span>{event.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Clock size={16} />
                    <span>{event.start_time?.slice(0, 5)} – {event.end_time?.slice(0, 5)}</span>
                  </div>
                </div>

                <div style={{ background: 'var(--canvas-subtle)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Campus Venue
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Building2 size={18} color="var(--color-brand)" />
                    <span>{event.venue_name || 'Unassigned Venue'}</span>
                  </div>
                  {event.venue_location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                      <MapPin size={14} />
                      <span>{event.venue_location} (Cap: {event.venue_capacity})</span>
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--canvas-subtle)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Expected Attendance
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Users size={18} color="var(--color-success)" />
                    <span>{event.expected_attendees} Expected</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                    Within venue seating limits
                  </div>
                </div>

                <div style={{ background: 'var(--canvas-subtle)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Allocated Budget
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <DollarSign size={18} color="var(--color-warning)" />
                    <span>₹{parseFloat(event.budget || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                    Total estimated spend
                  </div>
                </div>
              </div>

              {/* Allocated Resources Inventory */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: 'var(--text-primary)' }}>
                  Allocated Equipment & Staff
                </h4>
                {!event.allocated_resources || event.allocated_resources.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>
                    No inventory units or staff currently allocated to this event.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                    {event.allocated_resources.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'var(--canvas-surface)',
                          border: '1px solid var(--border-light)',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.type}</div>
                        </div>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--color-brand)',
                          background: 'var(--color-brand-subtle)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {r.quantity} units
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Actions Panel */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Event</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/events')}
                >
                  <span>Edit in Table View</span>
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 size={16} />
                  <span>Delete / Cancel Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event?.title}"? All allocated equipment will be immediately returned to available stock.`}
        confirmText="Yes, Delete Event"
      />
    </AppLayout>
  );
}
