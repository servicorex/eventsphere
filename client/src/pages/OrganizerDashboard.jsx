import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building2,
  Package,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  MapPin,
  Users,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventSphereLogo from '../components/EventSphereLogo';
import { eventsApi, venuesApi, resourcesApi, dashboardApi } from '../services/api';

export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active view tab: 'overview' | 'events' | 'venues' | 'resources'
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    event_type: 'Technical Festival',
    date: '',
    start_time: '09:00',
    end_time: '13:00',
    budget: '',
    expected_attendees: '',
    venue_id: '',
    selectedResources: {} // { [resourceId]: quantity }
  });
  const [eventModalError, setEventModalError] = useState('');

  // Venue Form State
  const [venueForm, setVenueForm] = useState({
    venue_code: '',
    name: '',
    location: '',
    capacity: '',
    availability: 'Available',
    cost_per_day: ''
  });
  const [venueModalError, setVenueModalError] = useState('');

  // Resource Form State
  const [resourceForm, setResourceForm] = useState({
    resource_code: '',
    name: '',
    type: 'Equipment',
    quantity: ''
  });
  const [resourceModalError, setResourceModalError] = useState('');

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, eventsRes, venuesRes, resourcesRes] = await Promise.all([
        dashboardApi.getStats().catch(() => ({ stats: null })),
        eventsApi.getAll().catch(() => ({ events: [] })),
        venuesApi.getAll().catch(() => ({ venues: [] })),
        resourcesApi.getAll().catch(() => ({ resources: [] }))
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (eventsRes?.events) setEvents(eventsRes.events);
      if (venuesRes?.venues) setVenues(venuesRes.venues);
      if (resourcesRes?.resources) setResources(resourcesRes.resources);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // --- EVENT HANDLERS ---
  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventForm({
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
    setEventModalError('');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title,
      event_type: ev.event_type,
      date: ev.date,
      start_time: ev.start_time.slice(0, 5),
      end_time: ev.end_time.slice(0, 5),
      budget: ev.budget || '',
      expected_attendees: ev.expected_attendees || '',
      venue_id: ev.venue_id || '',
      selectedResources: {}
    });
    setEventModalError('');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventModalError('');

    // Prepare resource allocations
    const resourceAllocations = Object.entries(eventForm.selectedResources)
      .filter(([_, qty]) => parseInt(qty, 10) > 0)
      .map(([resourceId, quantity]) => ({ resourceId: parseInt(resourceId, 10), quantity: parseInt(quantity, 10) }));

    const payload = {
      title: eventForm.title,
      event_type: eventForm.event_type,
      date: eventForm.date,
      start_time: eventForm.start_time,
      end_time: eventForm.end_time,
      budget: parseFloat(eventForm.budget) || 0,
      expected_attendees: parseInt(eventForm.expected_attendees, 10) || 0,
      venue_id: eventForm.venue_id ? parseInt(eventForm.venue_id, 10) : null,
      resources: resourceAllocations
    };

    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, payload);
        setApiNotice({ type: 'success', text: `Event "${payload.title}" updated successfully.` });
      } else {
        await eventsApi.create(payload);
        setApiNotice({ type: 'success', text: `Event "${payload.title}" scheduled successfully!` });
      }
      setIsEventModalOpen(false);
      await loadAllData();
    } catch (err) {
      setEventModalError(err.message || 'Failed to save event.');
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? Any allocated resources will be released back to inventory.`)) {
      try {
        await eventsApi.delete(eventId);
        setApiNotice({ type: 'success', text: `Event "${title}" deleted and resources released.` });
        await loadAllData();
      } catch (err) {
        setApiNotice({ type: 'error', text: err.message || 'Failed to delete event.' });
      }
    }
  };

  // Selected venue capacity check helper
  const selectedVenue = venues.find(v => v.id === parseInt(eventForm.venue_id, 10));
  const capacityWarning = selectedVenue && parseInt(eventForm.expected_attendees, 10) > selectedVenue.capacity;

  // --- VENUE HANDLERS ---
  const openCreateVenueModal = () => {
    setEditingVenue(null);
    setVenueForm({
      venue_code: `V${String(venues.length + 1).padStart(3, '0')}`,
      name: '',
      location: '',
      capacity: '500',
      availability: 'Available',
      cost_per_day: '25000'
    });
    setVenueModalError('');
    setIsVenueModalOpen(true);
  };

  const openEditVenueModal = (v) => {
    setEditingVenue(v);
    setVenueForm({
      venue_code: v.venue_code || '',
      name: v.name,
      location: v.location,
      capacity: v.capacity,
      availability: v.availability,
      cost_per_day: v.cost_per_day
    });
    setVenueModalError('');
    setIsVenueModalOpen(true);
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    setVenueModalError('');
    try {
      if (editingVenue) {
        await venuesApi.update(editingVenue.id, venueForm);
        setApiNotice({ type: 'success', text: `Venue "${venueForm.name}" updated successfully.` });
      } else {
        await venuesApi.create(venueForm);
        setApiNotice({ type: 'success', text: `Venue "${venueForm.name}" created successfully.` });
      }
      setIsVenueModalOpen(false);
      await loadAllData();
    } catch (err) {
      setVenueModalError(err.message || 'Failed to save venue.');
    }
  };

  const handleDeleteVenue = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete venue "${name}"?`)) {
      try {
        await venuesApi.delete(id);
        setApiNotice({ type: 'success', text: `Venue "${name}" deleted.` });
        await loadAllData();
      } catch (err) {
        setApiNotice({ type: 'error', text: err.message || 'Failed to delete venue.' });
      }
    }
  };

  // --- RESOURCE HANDLERS ---
  const openCreateResourceModal = () => {
    setEditingResource(null);
    setResourceForm({
      resource_code: `R${String(resources.length + 1).padStart(3, '0')}`,
      name: '',
      type: 'Equipment',
      quantity: '10'
    });
    setResourceModalError('');
    setIsResourceModalOpen(true);
  };

  const openEditResourceModal = (r) => {
    setEditingResource(r);
    setResourceForm({
      resource_code: r.resource_code || '',
      name: r.name,
      type: r.type,
      quantity: r.quantity
    });
    setResourceModalError('');
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setResourceModalError('');
    try {
      if (editingResource) {
        await resourcesApi.update(editingResource.id, resourceForm);
        setApiNotice({ type: 'success', text: `Resource "${resourceForm.name}" updated successfully.` });
      } else {
        await resourcesApi.create(resourceForm);
        setApiNotice({ type: 'success', text: `Resource "${resourceForm.name}" created successfully.` });
      }
      setIsResourceModalOpen(false);
      await loadAllData();
    } catch (err) {
      setResourceModalError(err.message || 'Failed to save resource.');
    }
  };

  const handleDeleteResource = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete resource "${name}"?`)) {
      try {
        await resourcesApi.delete(id);
        setApiNotice({ type: 'success', text: `Resource "${name}" deleted.` });
        await loadAllData();
      } catch (err) {
        setApiNotice({ type: 'error', text: err.message || 'Failed to delete resource.' });
      }
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <EventSphereLogo size={28} />
          <span>EventSphere</span>
        </div>

        <div className="dashboard-user-bar">
          <div className="user-badge">
            <span>{user?.name}</span>
            <span className="role-tag" style={{ background: '#059669' }}>{user?.role}</span>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="dashboard-main">
        {/* Banner Notification */}
        {apiNotice && (
          <div
            className={`alert-banner ${apiNotice.type === 'success' ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: '1.5rem' }}
          >
            {apiNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span style={{ flex: 1 }}>{apiNotice.text}</span>
            <button onClick={() => setApiNotice(null)} style={{ color: 'inherit' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* View Selection Tabs */}
        <div className="dashboard-nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} />
            <span>Overview & Analytics</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={16} />
            <span>Events ({events.length})</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            <Building2 size={16} />
            <span>Venues ({venues.length})</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <Package size={16} />
            <span>Resources ({resources.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  <Calendar size={26} />
                </div>
                <div>
                  <div className="stat-value">{stats?.totalEvents ?? events.length}</div>
                  <div className="stat-label">Total Events</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Clock size={26} />
                </div>
                <div>
                  <div className="stat-value">{stats?.upcomingEvents ?? 0}</div>
                  <div className="stat-label">Upcoming Events</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: '#FFFBEB', color: '#D97706' }}>
                  <Building2 size={26} />
                </div>
                <div>
                  <div className="stat-value">{stats?.availableVenues ?? 0}</div>
                  <div className="stat-label">Available Venues</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <Package size={26} />
                </div>
                <div>
                  <div className="stat-value">{stats?.totalResources ?? resources.length}</div>
                  <div className="stat-label">Resource Types</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Events */}
            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
              <div className="section-header-bar">
                <div>
                  <h2 className="section-title">Recent Events Schedule</h2>
                  <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Overview of planned events and allocated venues</p>
                </div>
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={openCreateEventModal}
                >
                  <Plus size={16} />
                  <span>Schedule Event</span>
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Venue</th>
                      <th>Attendees</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                          No events scheduled yet. Click "Schedule Event" to create your first event!
                        </td>
                      </tr>
                    ) : (
                      events.slice(0, 5).map(ev => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600 }}>{ev.title}</td>
                          <td>{ev.event_type}</td>
                          <td>{ev.date}</td>
                          <td>{ev.start_time.slice(0, 5)} - {ev.end_time.slice(0, 5)}</td>
                          <td>{ev.venue_name || 'No venue'}</td>
                          <td>{ev.expected_attendees}</td>
                          <td>
                            <span className="status-pill status-scheduled">{ev.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVENTS MANAGEMENT */}
        {activeTab === 'events' && (
          <div className="dashboard-card">
            <div className="section-header-bar">
              <div>
                <h2 className="section-title">Event Management Module</h2>
                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Create, view, update, delete events, and detect scheduling conflicts</p>
              </div>
              <button
                type="button"
                className="primary-action-btn"
                onClick={openCreateEventModal}
              >
                <Plus size={16} />
                <span>Create New Event</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Expected</th>
                    <th>Allocated Resources</th>
                    <th>Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                        No events found.
                      </td>
                    </tr>
                  ) : (
                    events.map(ev => (
                      <tr key={ev.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{ev.title}</div>
                          <span className="status-pill status-scheduled" style={{ fontSize: '0.7rem', marginTop: 2 }}>{ev.status}</span>
                        </td>
                        <td>{ev.event_type}</td>
                        <td>
                          <div>{ev.date}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{ev.start_time.slice(0, 5)} – {ev.end_time.slice(0, 5)}</div>
                        </td>
                        <td>
                          <div>{ev.venue_name || '—'}</div>
                          {ev.venue_capacity && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Cap: {ev.venue_capacity}</div>
                          )}
                        </td>
                        <td>{ev.expected_attendees}</td>
                        <td>
                          {ev.allocated_resources && ev.allocated_resources.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {ev.allocated_resources.map(r => (
                                <span key={r.id} style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.75rem' }}>
                                  {r.name}: <strong>{r.quantity}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>None</span>
                          )}
                        </td>
                        <td>₹{parseFloat(ev.budget || 0).toLocaleString()}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn"
                              title="View details"
                              onClick={() => setViewingEvent(ev)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              title="Edit event"
                              onClick={() => openEditEventModal(ev)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="icon-btn delete"
                              title="Delete event"
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: VENUES MANAGEMENT */}
        {activeTab === 'venues' && (
          <div className="dashboard-card">
            <div className="section-header-bar">
              <div>
                <h2 className="section-title">Venue Management Module</h2>
                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Manage venue capacity, location, rates, and availability</p>
              </div>
              <button
                type="button"
                className="primary-action-btn"
                onClick={openCreateVenueModal}
              >
                <Plus size={16} />
                <span>Add Venue</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Venue ID</th>
                    <th>Venue Name</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Cost Per Day</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, color: '#1E3A8A' }}>{v.venue_code || `V${v.id}`}</td>
                      <td style={{ fontWeight: 600 }}>{v.name}</td>
                      <td>{v.location}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{v.capacity.toLocaleString()}</span> attendees
                      </td>
                      <td>
                        <span className={`status-pill ${v.availability === 'Available' ? 'status-available' : 'status-booked'}`}>
                          {v.availability}
                        </span>
                      </td>
                      <td>₹{parseFloat(v.cost_per_day || 0).toLocaleString()}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn"
                            title="Edit venue"
                            onClick={() => openEditVenueModal(v)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="icon-btn delete"
                            title="Delete venue"
                            onClick={() => handleDeleteVenue(v.id, v.name)}
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
          </div>
        )}

        {/* TAB 4: RESOURCE MANAGEMENT */}
        {activeTab === 'resources' && (
          <div className="dashboard-card">
            <div className="section-header-bar">
              <div>
                <h2 className="section-title">Resource Management Module</h2>
                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Track equipment, staff, transport, and real-time inventory allocation</p>
              </div>
              <button
                type="button"
                className="primary-action-btn"
                onClick={openCreateResourceModal}
              >
                <Plus size={16} />
                <span>Add Resource</span>
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resource ID</th>
                    <th>Resource Name</th>
                    <th>Type</th>
                    <th>Total Quantity</th>
                    <th>Available Quantity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: '#1E3A8A' }}>{r.resource_code || `R${r.id}`}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>
                        <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                      <td>
                        <strong style={{ color: r.available_quantity > 0 ? '#059669' : '#DC2626' }}>
                          {r.available_quantity}
                        </strong> / {r.quantity}
                      </td>
                      <td>
                        <span className={`status-pill ${r.status === 'Available' ? 'status-available' : 'status-depleted'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn"
                            title="Edit resource"
                            onClick={() => openEditResourceModal(r)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="icon-btn delete"
                            title="Delete resource"
                            onClick={() => handleDeleteResource(r.id, r.name)}
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
          </div>
        )}
      </main>

      {/* --- MODAL 1: CREATE / EDIT EVENT --- */}
      {isEventModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEventModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{editingEvent ? 'Edit Event' : 'Schedule New Event'}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEventModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {eventModalError && (
              <div className="alert-banner alert-error">
                <AlertTriangle size={18} />
                <span>{eventModalError}</span>
              </div>
            )}

            {capacityWarning && (
              <div className="warning-callout">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Capacity Warning:</strong> Selected venue "{selectedVenue.name}" only holds{' '}
                  {selectedVenue.capacity} attendees, but you requested {eventForm.expected_attendees}.
                  (Submission will be rejected by policy).
                </span>
              </div>
            )}

            <form onSubmit={handleSaveEvent}>
              <div className="modal-form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    placeholder="e.g. TechFest 2026"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                  >
                    <option value="Technical Festival">Technical Festival</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <select
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.venue_id}
                    onChange={(e) => setEventForm({ ...eventForm, venue_id: e.target.value })}
                  >
                    <option value="">No Venue (Virtual / TBD)</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Cap: {v.capacity} | {v.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Attendees</label>
                  <input
                    type="number"
                    min="1"
                    className={`form-input ${capacityWarning ? 'has-error' : ''}`}
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.expected_attendees}
                    onChange={(e) => setEventForm({ ...eventForm, expected_attendees: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={eventForm.budget}
                    onChange={(e) => setEventForm({ ...eventForm, budget: e.target.value })}
                  />
                </div>
              </div>

              {/* Allocate Resources Section */}
              {!editingEvent && resources.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.65rem' }}>
                    Allocate Resources (Deducted from Inventory):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {resources.map(r => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#F8FAFC',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 8,
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Avail: <strong>{r.available_quantity}</strong>
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={r.available_quantity}
                          placeholder="0"
                          style={{
                            width: '60px',
                            height: '32px',
                            textAlign: 'center',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1'
                          }}
                          value={eventForm.selectedResources[r.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEventForm(prev => ({
                              ...prev,
                              selectedResources: {
                                ...prev.selectedResources,
                                [r.id]: val
                              }
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="modal-btn-primary"
                  style={{ background: '#E2E8F0', color: '#475569', marginRight: '0.5rem' }}
                  onClick={() => setIsEventModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-primary">
                  {editingEvent ? 'Save Changes' : 'Confirm & Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EVENT DETAILS --- */}
      {viewingEvent && (
        <div className="modal-overlay" onClick={() => setViewingEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingEvent.title}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingEvent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#334155' }}>
              <div><strong>Type:</strong> {viewingEvent.event_type}</div>
              <div><strong>Date & Time:</strong> {viewingEvent.date} ({viewingEvent.start_time.slice(0, 5)} - {viewingEvent.end_time.slice(0, 5)})</div>
              <div><strong>Venue:</strong> {viewingEvent.venue_name || 'Virtual / Unassigned'}</div>
              <div><strong>Expected Attendees:</strong> {viewingEvent.expected_attendees}</div>
              <div><strong>Planned Budget:</strong> ₹{parseFloat(viewingEvent.budget || 0).toLocaleString()}</div>
              <div><strong>Organizer:</strong> {viewingEvent.organizer_name || 'System Organizer'}</div>

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                <strong>Allocated Resources:</strong>
                {viewingEvent.allocated_resources && viewingEvent.allocated_resources.length > 0 ? (
                  <ul style={{ marginTop: '0.4rem', paddingLeft: '1.25rem' }}>
                    {viewingEvent.allocated_resources.map(r => (
                      <li key={r.id}>
                        {r.name} ({r.type}): <strong>{r.quantity} units</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#64748B', fontStyle: 'italic', marginTop: '0.25rem' }}>No equipment or resources allocated.</p>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="modal-btn-primary"
                onClick={() => setViewingEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: VENUE MODAL --- */}
      {isVenueModalOpen && (
        <div className="modal-overlay" onClick={() => setIsVenueModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsVenueModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {venueModalError && (
              <div className="alert-banner alert-error">
                <AlertTriangle size={18} />
                <span>{venueModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVenue}>
              <div className="form-group">
                <label className="form-label">Venue Code</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={venueForm.venue_code}
                  onChange={(e) => setVenueForm({ ...venueForm, venue_code: e.target.value })}
                  placeholder="e.g. V005"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Venue Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={venueForm.name}
                  onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                  placeholder="e.g. Main Auditorium"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={venueForm.location}
                  onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                  placeholder="e.g. Chennai Campus, Block A"
                  required
                />
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Capacity (seats)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={venueForm.capacity}
                    onChange={(e) => setVenueForm({ ...venueForm, capacity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Per Day (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={venueForm.cost_per_day}
                    onChange={(e) => setVenueForm({ ...venueForm, cost_per_day: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Availability</label>
                <select
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={venueForm.availability}
                  onChange={(e) => setVenueForm({ ...venueForm, availability: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="modal-btn-primary"
                  style={{ background: '#E2E8F0', color: '#475569', marginRight: '0.5rem' }}
                  onClick={() => setIsVenueModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-primary">
                  {editingVenue ? 'Save Changes' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: RESOURCE MODAL --- */}
      {isResourceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResourceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsResourceModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {resourceModalError && (
              <div className="alert-banner alert-error">
                <AlertTriangle size={18} />
                <span>{resourceModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResource}>
              <div className="form-group">
                <label className="form-label">Resource Code</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={resourceForm.resource_code}
                  onChange={(e) => setResourceForm({ ...resourceForm, resource_code: e.target.value })}
                  placeholder="e.g. R006"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '0.85rem' }}
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  placeholder="e.g. 4K Projector or Security Guard"
                  required
                />
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Resource Type</label>
                  <select
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="Staff">Staff</option>
                    <option value="Transport">Transport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '0.85rem' }}
                    value={resourceForm.quantity}
                    onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="modal-btn-primary"
                  style={{ background: '#E2E8F0', color: '#475569', marginRight: '0.5rem' }}
                  onClick={() => setIsResourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-primary">
                  {editingResource ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
