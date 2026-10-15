import React, { useEffect } from 'react';
import { X, Info, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ color: '#2563EB', display: 'flex' }}>
              <ShieldAlert size={22} />
            </div>
            <h2 id="modal-title" className="modal-title">Password Recovery Unavailable</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            Self-service password recovery is currently <strong>not configured</strong> for this EventSphere deployment.
          </p>
          <div style={{
            background: '#F1F5F9',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            borderLeft: '4px solid #3B82F6',
            fontSize: '0.875rem'
          }}>
            <p style={{ fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
              Need credentials reset?
            </p>
            <p style={{ color: '#475569' }}>
              Please contact your designated organization administrator or email the support desk at{' '}
              <a href="mailto:admin@eventsphere.com" style={{ fontWeight: 600 }}>admin@eventsphere.com</a> with your registered account details.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn-primary"
            onClick={onClose}
            autoFocus
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
