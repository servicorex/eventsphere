import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '560px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="dialog-heading">
      <div
        className="dialog-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id="dialog-heading" className="dialog-title">{title}</h3>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">
          {children}
        </div>
        {footer && (
          <div className="dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDanger = true }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      maxWidth="440px"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: isDanger ? 'var(--color-danger-subtle)' : 'var(--color-warning-subtle)',
          color: isDanger ? 'var(--color-danger)' : 'var(--color-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isDanger ? <AlertTriangle size={18} /> : <Info size={18} />}
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}

export function AlertBanner({ type = 'error', message, onClose }) {
  if (!message) return null;
  const className = type === 'success' ? 'ui-alert-success' : type === 'warning' ? 'ui-alert-warning' : 'ui-alert-error';
  const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertTriangle : AlertCircle;

  return (
    <div className={`ui-alert ${className}`} role="alert">
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      )}
      <h4 className="empty-state-title">{title || 'No records found'}</h4>
      <p className="empty-state-desc">{description || 'Get started by creating your first entry.'}</p>
      {action}
    </div>
  );
}

export function LoadingSkeleton({ lines = 4 }) {
  return (
    <div style={{ padding: '1.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: i === 0 ? '35%' : i === lines - 1 ? '55%' : '100%', height: i === 0 ? '22px' : '15px' }}
        />
      ))}
    </div>
  );
}
