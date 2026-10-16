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
  Repeat,
  ChevronRight
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

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Venues', path: '/venues', icon: Building2 },
    { label: 'Resources', path: '/resources', icon: Package },
    { label: 'Schedule', path: '/schedule', icon: CalendarDays },
    { label: 'Attendee Hub', path: '/attendee/dashboard', icon: Ticket },
    { label: 'Vendor Portal', path: '/vendor/dashboard', icon: Briefcase }
  ];

  const getInitials = (name) => {
    if (!name) return 'ES';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
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
            <span className="sidebar-brand-badge">SaaS</span>
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
          <div className="sidebar-nav-section-title">
            Operations Menu
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
          <div className="sidebar-switcher-panel">
            <div className="sidebar-switcher-header">
              <Repeat size={12} />
              <span>Switch Active Persona</span>
            </div>
            
            <button
              type="button"
              disabled={switching || user?.role === 'ORGANIZER'}
              onClick={() => handleQuickSwitch('organizer@eventsphere.com', 'OrganizerPass!2026')}
              className={`sidebar-role-btn ${user?.role === 'ORGANIZER' ? 'active' : ''}`}
            >
              <span>Organizer (Sarah)</span>
              {user?.role === 'ORGANIZER' && <span style={{ fontSize: '0.7rem' }}>✓ Active</span>}
            </button>

            <button
              type="button"
              disabled={switching || user?.role === 'ADMIN'}
              onClick={() => handleQuickSwitch('admin@eventsphere.com', 'AdminSecurePass!2026')}
              className={`sidebar-role-btn ${user?.role === 'ADMIN' ? 'active' : ''}`}
            >
              <span>Admin (System)</span>
              {user?.role === 'ADMIN' && <span style={{ fontSize: '0.7rem' }}>✓ Active</span>}
            </button>

            <button
              type="button"
              disabled={switching || user?.role === 'VENDOR'}
              onClick={() => handleQuickSwitch('vendor@eventsphere.com', 'VendorPass!2026')}
              className={`sidebar-role-btn ${user?.role === 'VENDOR' ? 'active' : ''}`}
            >
              <span>Vendor (Apex AV)</span>
              {user?.role === 'VENDOR' && <span style={{ fontSize: '0.7rem' }}>✓ Active</span>}
            </button>

            <button
              type="button"
              disabled={switching || user?.role === 'ATTENDEE'}
              onClick={() => handleQuickSwitch('attendee@eventsphere.com', 'AttendeePass!2026')}
              className={`sidebar-role-btn ${user?.role === 'ATTENDEE' ? 'active' : ''}`}
            >
              <span>Attendee (Alex)</span>
              {user?.role === 'ATTENDEE' && <span style={{ fontSize: '0.7rem' }}>✓ Active</span>}
            </button>
          </div>
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="user-avatar-circle">
              {getInitials(user?.name)}
            </div>
            <div className="user-snippet">
              <span className="user-snippet-name">{user?.name || 'User'}</span>
              <span className="user-snippet-role" style={{
                color: user?.role === 'ADMIN' ? 'var(--color-brand)' : 
                       user?.role === 'ORGANIZER' ? 'var(--color-success)' : 
                       user?.role === 'VENDOR' ? 'var(--color-warning)' : 'var(--color-purple)'
              }}>
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
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
              <Menu size={20} />
            </button>
            <h1 className="topbar-title">{title || 'EventSphere'}</h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-user-badge">
              <ShieldCheck size={16} color="var(--color-brand)" />
              <span style={{ color: 'var(--text-tertiary)' }}>Account:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
              <span className={`badge badge-${user?.role?.toLowerCase() || 'admin'}`}>
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
