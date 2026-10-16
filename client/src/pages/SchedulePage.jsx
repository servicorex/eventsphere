import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  Search,
  Clock,
  Eye,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { eventsApi } from '../services/api';

export default function SchedulePage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setError(null);
        const res = await eventsApi.getAll();
        if (res?.events) setEvents(res.events);
      } catch (err) {
        setError(err.message || 'Failed to load schedule.');
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.event_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || ev.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Group events by date
  const groupedByDate = filteredEvents.reduce((acc, ev) => {
    const key = ev.date || 'Unspecified Date';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <AppLayout
      title="Event Schedule"
      subtitle="Chronological timetable of scheduled campus events, conferences, and venue bookings"
    >
      <AlertBanner message={error} type="error" onClose={() => setError(null)} />

      <div className="card">
        {/* Toolbar */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search schedule by title or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Date:</span>
              <input
                type="date"
                className="search-input"
                style={{ width: 'auto', paddingLeft: '0.75rem' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ height: '40px', padding: '0 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => setDateFilter('')}
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Timetable Groups */}
        {loading ? (
          <LoadingSkeleton lines={5} />
        ) : sortedDates.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events scheduled"
            description={dateFilter || searchQuery ? 'No events match the selected schedule filters.' : 'There are currently no events registered in the system.'}
          />
        ) : (
          <div className="card-body" style={{ padding: '1.5rem' }}>
            {sortedDates.map((dateKey) => (
              <div key={dateKey} style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.95rem',
                  background: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--color-brand)" />
                    <span>{dateKey}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                    {groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'Booking' : 'Bookings'}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Time Window</th>
                        <th>Event Title</th>
                        <th>Category</th>
                        <th>Assigned Venue</th>
                        <th>Expected Attendees</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByDate[dateKey].map((ev) => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-brand)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Clock size={14} />
                              <span>{ev.start_time?.slice(0, 5)} – {ev.end_time?.slice(0, 5)}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{ev.title}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.45rem',
                              backgroundColor: 'var(--canvas-subtle)',
                              borderRadius: 'var(--radius-xs)',
                              color: 'var(--text-secondary)'
                            }}>
                              {ev.event_type}
                            </span>
                          </td>
                          <td>
                            {ev.venue_name ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Building2 size={14} color="var(--text-tertiary)" />
                                <span>{ev.venue_name}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-quaternary)', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                            )}
                          </td>
                          <td>{ev.expected_attendees}</td>
                          <td>
                            <span className={`badge badge-${ev.status?.toLowerCase() || 'scheduled'}`}>
                              {ev.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/events/${ev.id}`}
                              className="btn-icon"
                              title="View Event Details"
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
