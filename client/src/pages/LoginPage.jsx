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
      color: '#2563EB',
      desc: 'System governance, database metrics & venues'
    },
    {
      role: 'Vendor',
      email: 'vendor@eventsphere.com',
      pass: 'VendorPass!2026',
      icon: Briefcase,
      color: '#D97706',
      desc: 'Service contracts, invoices & delivery'
    },
    {
      role: 'Attendee',
      email: 'attendee@eventsphere.com',
      pass: 'AttendeePass!2026',
      icon: Ticket,
      color: '#7C3AED',
      desc: 'Register for events, passes & QR check-in'
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

      <div className="login-wrapper">
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
            A cohesive event operations platform connecting Organizers, Administrators, Vendors, 
            and Attendees with real-time venue scheduling and inventory allocation.
          </p>

          {/* 1-Click Role Logins */}
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93C5FD' }}>
              One-Click Persona Access
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {demoAccounts.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(d)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.75rem 0.95rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--radius-md)',
                      color: '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 180ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: '0.25rem' }}>
                      <Icon size={16} color={d.color} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.role}</span>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: '#94A3B8', lineHeight: 1.35 }}>
                      {d.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Form Card */}
        <div className="login-card-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-header-logo">
                <EventSphereLogo size={32} />
              </div>
              <h2 className="login-title">Sign in to EventSphere</h2>
              <p className="login-subtitle">Enter your institutional credentials to continue</p>
            </div>

            {/* Error Banner */}
            {apiError && (
              <div className="ui-alert ui-alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  Work Email Address
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="email-input"
                    type="email"
                    className={`input-field ${errors.email ? 'input-error' : ''}`}
                    placeholder="name@eventsphere.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="form-field-error">{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password-input">
                  Password
                </label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-field-error">{errors.password}</span>
                )}
              </div>

              {/* Options */}
              <div className="login-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Remember session</span>
                </label>

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setIsForgotModalOpen(true)}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>
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
