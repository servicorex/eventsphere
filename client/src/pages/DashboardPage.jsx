import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Package,
  Plus,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { LoadingSkeleton, EmptyState, AlertBanner } from '../components/UIComponents';
import { dashboardApi, eventsApi } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getStats();
        if (res && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <AppLayout
      title="System Overview"
      subtitle="Real-time KPI metrics, scheduled events, and quick administrative actions"
    >
      <AlertBanner message={error} type="error" onClose={() => setError(null)} />

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                <Calendar size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-value">{stats?.totalEvents ?? 0}</span>
                <span className="kpi-label">Total Events</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                <Clock size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-value">{stats?.upcomingEvents ?? 0}</span>
                <span className="kpi-label">Upcoming Events</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                <Building2 size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-value">{stats?.availableVenues ?? 0}</span>
                <span className="kpi-label">Available Venues</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                <Package size={24} />
              </div>
              <div className="kpi-meta">
                <span className="kpi-value">{stats?.totalResources ?? 0}</span>
                <span className="kpi-label">Resource Types</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/events', { state: { openCreate: true } })}
              >
                <Plus size={16} />
                <span>Create New Event</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/venues', { state: { openCreate: true } })}
              >
                <Building2 size={16} />
                <span>Add Venue</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/resources', { state: { openCreate: true } })}
              >
                <Package size={16} />
                <span>Manage Resources</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/schedule')}
              >
                <CalendarDays size={16} />
                <span>View Full Schedule</span>
              </button>
            </div>
          </div>

          {/* Upcoming & Recent Events Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Upcoming & Planned Events</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                  Latest schedules recorded in PostgreSQL
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                onClick={() => navigate('/events')}
              >
                <span>View All Events</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Time Window</th>
                    <th>Venue</th>
                    <th>Expected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!stats?.recentEvents || stats.recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={Calendar}
                          title="No upcoming events"
                          description="Get started by scheduling an event in the system."
                          action={
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => navigate('/events', { state: { openCreate: true } })}
                            >
                              <Plus size={16} />
                              <span>Create Event</span>
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    stats.recentEvents.map((ev) => (
                      <tr
                        key={ev.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/events/${ev.id}`)}
                      >
                        <td style={{ fontWeight: 600, color: '#1D4ED8' }}>{ev.title}</td>
                        <td>{ev.event_type}</td>
                        <td>{ev.date}</td>
                        <td>{ev.start_time?.slice(0, 5)} – {ev.end_time?.slice(0, 5)}</td>
                        <td>{ev.venue_name || 'Unassigned'}</td>
                        <td>{ev.expected_attendees}</td>
                        <td>
                          <span className={`badge badge-${ev.status?.toLowerCase() || 'scheduled'}`}>
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
