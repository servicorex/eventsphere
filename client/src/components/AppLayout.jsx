import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Package,
  CalendarDays,
  Ticket,
  Briefcase,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Repeat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventSphereLogo from './EventSphereLogo';

export default function AppLayout({ children, title, subtitle }) {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Quick switch between roles seamlessly without leaving the website
  const handleQuickSwitch = async (roleEmail, rolePass) => {
    try {
      setSwitching(true);
      await logout();
      await login({ email: roleEmail, password: rolePass, rememberMe: true });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setSwitching(false);
    }
  };

  // Unified navigation items covering all modules
  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Venues', path: '/venues', icon: Building2 },
    { label: 'Resources', path: '/resources', icon: Package },
    { label: 'Schedule', path: '/schedule', icon: CalendarDays },
    { label: 'Attendee Hub', path: '/attendee/dashboard', icon: Ticket },
    { label: 'Vendor Portal', path: '/vendor/dashboard', icon: Briefcase }
  ];

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 45
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Desktop & Mobile Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand">
            <EventSphereLogo size={30} />
            <span>EventSphere</span>
          </NavLink>
          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div style={{ padding: '0 0.5rem 0.5rem 0.5rem', fontSize: '0.725rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Quick Role Switcher */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              <Repeat size={13} />
              <span>Switch Role Login</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={switching || user?.role === 'ORGANIZER'}
                onClick={() => handleQuickSwitch('organizer@eventsphere.com', 'OrganizerPass!2026')}
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: user?.role === 'ORGANIZER' ? '1.5px solid #059669' : '1px solid #E2E8F0',
                  background: user?.role === 'ORGANIZER' ? '#ECFDF5' : '#FFFFFF',
                  color: user?.role === 'ORGANIZER' ? '#065F46' : '#334155',
                  cursor: user?.role === 'ORGANIZER' ? 'default' : 'pointer',
                  fontWeight: user?.role === 'ORGANIZER' ? 700 : 500
                }}
              >
                Organizer (Sarah) {user?.role === 'ORGANIZER' && '✓ Active'}
              </button>

              <button
                type="button"
                disabled={switching || user?.role === 'ADMIN'}
                onClick={() => handleQuickSwitch('admin@eventsphere.com', 'AdminSecurePass!2026')}
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: user?.role === 'ADMIN' ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
                  background: user?.role === 'ADMIN' ? '#EFF6FF' : '#FFFFFF',
                  color: user?.role === 'ADMIN' ? '#1E40AF' : '#334155',
                  cursor: user?.role === 'ADMIN' ? 'default' : 'pointer',
                  fontWeight: user?.role === 'ADMIN' ? 700 : 500
                }}
              >
                Admin (System) {user?.role === 'ADMIN' && '✓ Active'}
              </button>

              <button
                type="button"
                disabled={switching || user?.role === 'VENDOR'}
                onClick={() => handleQuickSwitch('vendor@eventsphere.com', 'VendorPass!2026')}
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: user?.role === 'VENDOR' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                  background: user?.role === 'VENDOR' ? '#FFFBEB' : '#FFFFFF',
                  color: user?.role === 'VENDOR' ? '#92400E' : '#334155',
                  cursor: user?.role === 'VENDOR' ? 'default' : 'pointer',
                  fontWeight: user?.role === 'VENDOR' ? 700 : 500
                }}
              >
                Vendor (Apex AV) {user?.role === 'VENDOR' && '✓ Active'}
              </button>

              <button
                type="button"
                disabled={switching || user?.role === 'ATTENDEE'}
                onClick={() => handleQuickSwitch('attendee@eventsphere.com', 'AttendeePass!2026')}
                style={{
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: user?.role === 'ATTENDEE' ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                  background: user?.role === 'ATTENDEE' ? '#F5F3FF' : '#FFFFFF',
                  color: user?.role === 'ATTENDEE' ? '#5B21B6' : '#334155',
                  cursor: user?.role === 'ATTENDEE' ? 'default' : 'pointer',
                  fontWeight: user?.role === 'ATTENDEE' ? 700 : 500
                }}
              >
                Attendee (Alex) {user?.role === 'ATTENDEE' && '✓ Active'}
              </button>
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-snippet">
            <span className="user-snippet-name">{user?.name || 'User'}</span>
            <span className="user-snippet-role" style={{ color: user?.role === 'ADMIN' ? '#1D4ED8' : user?.role === 'ORGANIZER' ? '#059669' : user?.role === 'VENDOR' ? '#D97706' : '#7C3AED' }}>
              {user?.role}
            </span>
          </div>
          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="topbar-title">{title || 'EventSphere'}</h1>
          </div>

          <div className="topbar-right">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: '#F1F5F9',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              color: '#334155'
            }}>
              <ShieldCheck size={16} color="#1D4ED8" />
              <span>Logged in as:</span>
              <strong style={{ color: '#0F172A' }}>{user?.name}</strong>
              <span className={`badge badge-${user?.role?.toLowerCase() || 'active'}`} style={{ fontSize: '0.7rem' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {(title || subtitle) && (
            <div className="page-header">
              <div>
                {title && <h2 className="page-title">{title}</h2>}
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
