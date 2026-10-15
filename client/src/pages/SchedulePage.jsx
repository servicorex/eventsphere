import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  Search,
  Filter,
  Clock,
  Building2,
  Users,
  Eye,
  Calendar
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
      subtitle="Chronological timetable of scheduled events and reserved campus venues"
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
              placeholder="Filter schedule by event or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Filter by Date:</span>
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
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={() => setDateFilter('')}
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton lines={5} />
        ) : sortedDates.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events scheduled"
            description={dateFilter || searchQuery ? 'No events match the selected schedule filters.' : 'There are currently no events in the system.'}
          />
        ) : (
          <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
            {sortedDates.map((dateKey) => (
              <div key={dateKey} style={{ marginBottom: '1.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: '#F1F5F9',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.925rem',
                  color: '#1E293B',
                  marginBottom: '0.75rem'
                }}>
                  <Calendar size={18} color="#1D4ED8" />
                  <span>{dateKey}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                    ({groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'event' : 'events'})
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Time Window</th>
                        <th>Event Title</th>
                        <th>Category</th>
                        <th>Venue</th>
                        <th>Expected Attendees</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByDate[dateKey].map((ev) => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={15} />
                              <span>{ev.start_time?.slice(0, 5)} – {ev.end_time?.slice(0, 5)}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{ev.title}</td>
                          <td>{ev.event_type}</td>
                          <td>{ev.venue_name || 'Unassigned Venue'}</td>
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
