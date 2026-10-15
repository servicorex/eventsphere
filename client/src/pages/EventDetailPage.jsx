import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  DollarSign,
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle
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
      subtitle={event ? `${event.event_type} on ${event.date}` : 'Loading...'}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/events')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Events</span>
        </button>
      </div>

      <AlertBanner message={error} type="error" onClose={() => setError(null)} />

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : event ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Main Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Event Information</h3>
              <span className={`badge badge-${event.status?.toLowerCase() || 'scheduled'}`}>
                {event.status}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Date & Schedule
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Calendar size={18} color="#1D4ED8" />
                    <span style={{ fontWeight: 600 }}>{event.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', color: '#475569', fontSize: '0.875rem' }}>
                    <Clock size={16} />
                    <span>{event.start_time?.slice(0, 5)} – {event.end_time?.slice(0, 5)}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Venue Location
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Building2 size={18} color="#1D4ED8" />
                    <span style={{ fontWeight: 600 }}>{event.venue_name || 'Virtual / Unassigned'}</span>
                  </div>
                  {event.venue_location && (
                    <div style={{ marginTop: '0.35rem', color: '#475569', fontSize: '0.85rem' }}>
                      {event.venue_location} (Max: {event.venue_capacity} seats)
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Expected Attendance
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Users size={18} color="#059669" />
                    <span style={{ fontWeight: 600 }}>{event.expected_attendees} attendees</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Financial Budget
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <DollarSign size={18} color="#D97706" />
                    <span style={{ fontWeight: 600 }}>₹{parseFloat(event.budget || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Allocated Resources */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: '#0F172A' }}>
                  Allocated Equipment & Staff
                </h4>
                {!event.allocated_resources || event.allocated_resources.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>
                    No inventory units or staff currently allocated to this event.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {event.allocated_resources.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          padding: '0.75rem',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: '#64748B', marginTop: '0.25rem' }}>
                          <span>Type: {r.type}</span>
                          <span style={{ fontWeight: 700, color: '#1D4ED8' }}>Qty: {r.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
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
                  <Edit size={16} />
                  <span>Edit Details in Table</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', borderColor: '#FCA5A5', color: '#DC2626' }}
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash2 size={16} />
                  <span>Cancel / Delete Event</span>
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
        message={`Are you sure you want to delete "${event?.title}"? Any allocated equipment will be immediately returned to available stock.`}
        confirmText="Yes, Delete Event"
      />
    </AppLayout>
  );
}
