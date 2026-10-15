import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#FEF2F2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <ShieldX size={36} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
          Access Denied
        </h1>

        <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          You do not have the required permissions to view this section of EventSphere with your current role ({user?.role || 'Guest'}).
        </p>

        <button
          type="button"
          onClick={handleReturn}
          className="submit-btn"
          style={{ width: 'auto', padding: '0.75rem 1.5rem', margin: '0 auto' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Your Dashboard</span>
        </button>
      </div>
    </div>
  );
}
