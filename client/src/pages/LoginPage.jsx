import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Ticket
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';
import EventSphereLogo from '../components/EventSphereLogo';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & UI states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Preset demo accounts for quick 1-click login
  const demoAccounts = [
    {
      role: 'Organizer',
      email: 'organizer@eventsphere.com',
      pass: 'OrganizerPass!2026',
      icon: Calendar,
      color: '#059669',
      desc: 'Create events, allocate venues & resources'
    },
    {
      role: 'Admin',
      email: 'admin@eventsphere.com',
      pass: 'AdminSecurePass!2026',
      icon: ShieldCheck,
      color: '#1D4ED8',
      desc: 'System governance, database metrics & venues'
    },
    {
      role: 'Vendor',
      email: 'vendor@eventsphere.com',
      pass: 'VendorPass!2026',
      icon: Briefcase,
      color: '#D97706',
      desc: 'Service contracts, invoices & equipment delivery'
    },
    {
      role: 'Attendee',
      email: 'attendee@eventsphere.com',
      pass: 'AttendeePass!2026',
      icon: Ticket,
      color: '#7C3AED',
      desc: 'Register for events, passes & gate QR check-in'
    }
  ];

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = location.state?.from?.pathname || getRoleDashboardPath(user.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const executeLogin = async (loginEmail, loginPass) => {
    setIsLoading(true);
    setApiError('');
    try {
      const loggedInUser = await login({
        email: loginEmail.trim(),
        password: loginPass,
        rememberMe
      });
      const destination = location.state?.from?.pathname || getRoleDashboardPath(loggedInUser.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Invalid credentials or server unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setErrors({});
    await executeLogin(demo.email, demo.pass);
  };

  return (
    <div className="login-container">
      <div className="login-bg-decor" />

      <div className="login-wrapper" style={{ maxWidth: '1240px' }}>
        {/* Left Branding Showcase */}
        <section className="login-brand-panel" aria-label="About EventSphere">
          <div className="brand-badge">
            <Calendar size={14} />
            <span>Event Management Platform</span>
          </div>

          <h1 className="brand-heading">
            Smart Event Planning & Resource Management
          </h1>

          <p className="brand-description">
            One unified, continuous portal connecting Organizers, Administrators, Vendors, 
            and Attendees with real-time venue scheduling and inventory allocation.
          </p>

          {/* 1-Click Role Logins */}
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93C5FD' }}>
              Quick 1-Click Logins for Every Role:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.65rem' }}>
              {demoAccounts.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => handleQuickLogin(d)}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: d.color, display: 'flex' }}><Icon size={16} /></span>
                      <strong style={{ fontSize: '0.9rem' }}>{d.role}</strong>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: '#CBD5E1', lineHeight: 1.3 }}>
                      {d.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Authentication Card */}
        <div className="login-card-container">
          <main className="login-card" id="login-form-card">
            <header className="login-header">
              <div className="login-header-logo">
                <EventSphereLogo size={34} />
              </div>
              <h2 className="login-title">Sign in to EventSphere</h2>
              <p className="login-subtitle">Enter your credentials or choose a role on the left</p>
            </header>

            {/* Global API Error Alert */}
            {apiError && (
              <div className="alert-banner alert-error" role="alert" aria-live="polite">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <Mail size={18} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className={`form-input ${errors.email ? 'has-error' : ''}`}
                    placeholder="name@eventsphere.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="input-error-msg" role="alert">
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'has-error' : ''}`}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="input-error-msg" role="alert">
                    <AlertCircle size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    id="remember-me"
                    className="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setIsForgotModalOpen(true)}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-button"
                className="submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </main>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
