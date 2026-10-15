import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, LogOut, LayoutDashboard, Calendar, Building2, Package, ArrowRight, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventSphereLogo from '../components/EventSphereLogo';
import { dashboardApi } from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then(res => {
        if (res?.stats) setStats(res.stats);
      })
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <EventSphereLogo size={28} />
          <span>EventSphere Admin</span>
        </div>

        <div className="dashboard-user-bar">
          <div className="user-badge">
            <ShieldCheck size={16} color="#60A5FA" />
            <span>{user?.name}</span>
            <span className="role-tag">{user?.role}</span>
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

      <main className="dashboard-main">
        {/* Real-time stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
              <Calendar size={26} />
            </div>
            <div>
              <div className="stat-value">{stats?.totalEvents ?? '—'}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Building2 size={26} />
            </div>
            <div>
              <div className="stat-value">{stats?.availableVenues ?? '—'}</div>
              <div className="stat-label">Available Venues</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Package size={26} />
            </div>
            <div>
              <div className="stat-value">{stats?.totalResources ?? '—'}</div>
              <div className="stat-label">Resource Types</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                Event & Resource Management Workspace
              </h1>
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
                As an Administrator, you have full access to schedule events, manage venue capacities, and allocate inventory.
              </p>
            </div>
            <Link
              to="/organizer/dashboard"
              className="primary-action-btn"
              style={{ textDecoration: 'none' }}
            >
              <span>Open Management Console</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="status-callout">
            <Database size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Milestone 1 Core Engine Active</strong>
              <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
                PostgreSQL schema migrations active. Real-time conflict detection, attendee capacity checks, and resource inventory tracking enabled.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
