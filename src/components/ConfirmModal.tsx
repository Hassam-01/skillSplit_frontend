import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary',
  loading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,29,14,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div className="surface-lowest" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
          <X size={22} />
        </button>

        <div style={{ marginBottom: '1rem' }}>
          <span className="text-label-sm" style={{ color: isDanger ? 'var(--color-error)' : 'var(--color-primary)', fontSize: '0.75rem' }}>Are you sure?</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 className="text-title-lg" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-on-surface)' }}>{title}</h3>
            <p className="text-body-lg" style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--color-on-surface-variant)' }}>{message}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={isDanger ? '' : 'btn-gradient'} 
            style={isDanger ? {
              backgroundColor: 'var(--color-error)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer'
            } : { padding: '0.6rem 1.25rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
