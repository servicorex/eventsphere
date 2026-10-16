import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Clock,
  Users,
  DollarSign
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Modal, ConfirmModal, AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { eventsApi, venuesApi, resourcesApi } from '../services/api';

export default function EventsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Feedback states
  const [banner, setBanner] = useState(null); // { type, text }
  const [modalError, setModalError] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'Technical Festival',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '13:00',
    budget: '50000',
    expected_attendees: '100',
    venue_id: '',
    selectedResources: {} // { [resourceId]: qty }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evRes, vRes, rRes] = await Promise.all([
        eventsApi.getAll().catch(() => ({ events: [] })),
        venuesApi.getAll().catch(() => ({ venues: [] })),
        resourcesApi.getAll().catch(() => ({ resources: [] }))
      ]);
      if (evRes?.events) setEvents(evRes.events);
      if (vRes?.venues) {
        setVenues(vRes.venues);
        if (vRes.venues.length > 0 && !formData.venue_id) {
          setFormData((prev) => ({ ...prev, venue_id: vRes.venues[0].id }));
        }
      }
      if (rRes?.resources) setResources(rRes.resources);
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to load events.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if opened via navigation state shortcut
  useEffect(() => {
    if (location.state?.openCreate && venues.length > 0) {
      openCreateModal();
    }
  }, [location.state, venues]);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      event_type: 'Technical Festival',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '13:00',
      budget: '50000',
      expected_attendees: '100',
      venue_id: venues.length > 0 ? venues[0].id : '',
      selectedResources: {}
    });
    setModalError('');
    setIsFormOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      event_type: ev.event_type,
      date: ev.date,
      start_time: ev.start_time?.slice(0, 5) || '09:00',
      end_time: ev.end_time?.slice(0, 5) || '13:00',
      budget: ev.budget || '0',
      expected_attendees: ev.expected_attendees || '0',
      venue_id: ev.venue_id || '',
      selectedResources: {}
    });
    setModalError('');
    setIsFormOpen(true);
  };

  // Live Capacity Warning validation
  const chosenVenue = venues.find((v) => v.id === parseInt(formData.venue_id, 10));
  const capacityWarning = chosenVenue && parseInt(formData.expected_attendees, 10) > chosenVenue.capacity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (formData.start_time >= formData.end_time) {
      setModalError('End time must be after start time.');
      return;
    }

    const resourceAllocations = Object.entries(formData.selectedResources)
      .filter(([_, qty]) => parseInt(qty, 10) > 0)
      .map(([resourceId, quantity]) => ({
        resourceId: parseInt(resourceId, 10),
        quantity: parseInt(quantity, 10)
      }));

    const payload = {
      title: formData.title.trim(),
      event_type: formData.event_type,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      budget: parseFloat(formData.budget) || 0,
      expected_attendees: parseInt(formData.expected_attendees, 10) || 0,
      venue_id: formData.venue_id ? parseInt(formData.venue_id, 10) : null,
      resources: resourceAllocations
    };

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, payload);
        setBanner({ type: 'success', text: `Event "${payload.title}" updated successfully.` });
      } else {
        await eventsApi.create(payload);
        setBanner({ type: 'success', text: `Event "${payload.title}" scheduled successfully.` });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      // Handles 409 conflict detection or capacity validation rejection
      setModalError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEventTarget) return;
    try {
      await eventsApi.delete(deleteEventTarget.id);
      setBanner({ type: 'success', text: `Event "${deleteEventTarget.title}" deleted.` });
      setDeleteEventTarget(null);
      await loadData();
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to delete event.' });
    }
  };

  // Filter events by search & status
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.event_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      title="Event Management"
      subtitle="Create, update, and manage campus event schedules, venue reservations, and resources"
    >
      <AlertBanner
        message={banner?.text}
        type={banner?.type}
        onClose={() => setBanner(null)}
      />

      <div className="card">
        {/* Search & Filter Toolbar */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by event title, venue, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Content Table or Empty State */}
        {loading ? (
          <LoadingSkeleton lines={5} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            description={searchQuery || statusFilter !== 'ALL' ? 'No events matched your filter criteria.' : 'Get started by creating your first event schedule.'}
            action={
              <button type="button" className="btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Create Event</span>
              </button>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Event Details</th>
                  <th>Type</th>
                  <th>Schedule</th>
                  <th>Venue</th>
                  <th>Expected</th>
                  <th>Allocated Units</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--color-brand)', cursor: 'pointer' }}
                        onClick={() => navigate(`/events/${ev.id}`)}
                      >
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        ID #{ev.id}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'var(--canvas-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)'
                      }}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 500 }}>{ev.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {ev.start_time?.slice(0, 5)} – {ev.end_time?.slice(0, 5)}
                      </div>
                    </td>
                    <td>
                      {ev.venue_name ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{ev.venue_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Cap: {ev.venue_capacity} seats</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-quaternary)', fontStyle: 'italic', fontSize: '0.825rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>{ev.expected_attendees}</td>
                    <td>
                      {ev.allocated_resources && ev.allocated_resources.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {ev.allocated_resources.map((r) => (
                            <span
                              key={r.id}
                              style={{
                                background: 'var(--canvas-subtle)',
                                border: '1px solid var(--border-light)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '0.725rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {r.name}: <strong style={{ color: 'var(--text-primary)' }}>{r.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-quaternary)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(ev.budget || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${ev.status?.toLowerCase() || 'scheduled'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="View Details"
                          onClick={() => navigate(`/events/${ev.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Event"
                          onClick={() => openEditModal(ev)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete Event"
                          onClick={() => setDeleteEventTarget(ev)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEvent ? 'Edit Event Schedule' : 'Schedule New Event'}
        maxWidth="640px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        {capacityWarning && (
          <div className="ui-alert ui-alert-warning" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Capacity Limit Warning:</strong> Selected venue "{chosenVenue.name}" holds a max capacity of{' '}
              {chosenVenue.capacity}, but you entered {formData.expected_attendees} attendees.
              (PostgreSQL database will reject this entry upon submission).
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                Event Title *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. AI Innovation Summit 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Event Type *
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              >
                <option value="Technical Festival">Technical Festival</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Cultural">Cultural</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Date *
              </label>
              <input
                type="date"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Start Time *
              </label>
              <input
                type="time"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                End Time *
              </label>
              <input
                type="time"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                Venue Hall Selection *
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                required
              >
                <option value="">Select a venue...</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Max Capacity: {v.capacity} seats, ₹{parseFloat(v.cost_per_day || 0).toLocaleString()}/day)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Expected Attendees *
              </label>
              <input
                type="number"
                min="1"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.expected_attendees}
                onChange={(e) => setFormData({ ...formData, expected_attendees: e.target.value })}
                required
              />
              {chosenVenue && (
                <span className="form-hint">
                  Venue max: {chosenVenue.capacity} seats
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Budget (₹) *
              </label>
              <input
                type="number"
                min="0"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
              />
            </div>

            {/* Optional Resource Allocation on Creation */}
            {!editingEvent && resources.length > 0 && (
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  Reserve Equipment & Staff Units (Optional)
                </label>
                <div style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.5rem',
                  background: 'var(--canvas-subtle)'
                }}>
                  {resources.map((res) => (
                    <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {res.name} (Avail: {res.available_quantity})
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={res.available_quantity}
                        className="search-input"
                        style={{ width: '65px', height: '30px', padding: '0 0.4rem', fontSize: '0.8rem' }}
                        value={formData.selectedResources[res.id] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selectedResources: {
                              ...formData.selectedResources,
                              [res.id]: e.target.value
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Confirm & Schedule Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteEventTarget}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteEventTarget?.title}"? Any reserved inventory or venue slots will be immediately released.`}
        confirmText="Delete Event"
      />
    </AppLayout>
  );
}
