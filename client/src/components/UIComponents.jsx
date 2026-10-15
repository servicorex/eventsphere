import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '600px' }) {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="dialog-title">{title}</h3>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
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
            className="btn-primary"
            style={isDanger ? { backgroundColor: '#DC2626' } : {}}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>
        {message}
      </p>
    </Modal>
  );
}

export function AlertBanner({ type = 'error', message, onClose }) {
  if (!message) return null;
  const className = type === 'success' ? 'ui-alert-success' : type === 'warning' ? 'ui-alert-warning' : 'ui-alert-error';

  return (
    <div className={`ui-alert ${className}`} role="alert">
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
          <Icon size={28} />
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
          style={{ width: i === 0 ? '40%' : i === lines - 1 ? '60%' : '100%', height: i === 0 ? '24px' : '16px' }}
        />
      ))}
    </div>
  );
}
