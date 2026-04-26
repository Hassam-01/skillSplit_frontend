import React from 'react';
import { X, Upload, Users } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(27, 29, 14, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="surface-lowest" style={{
        width: '100%',
        maxWidth: '480px',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-on-surface-variant)'
        }}>
          <X size={24} />
        </button>

        <h2 className="text-headline-lg" style={{ marginBottom: '1.5rem' }}>Add Expense</h2>

        <form>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
            <input 
              type="text" 
              placeholder="What was it for?"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--color-surface-container-low)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (Rs.)</label>
              <input 
                type="number" 
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} />
              Split With
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {['You', 'Ali Khan', 'Zara Ahmed', 'Omar Farooq', 'Sana Malik'].map((name) => (
                <div key={name} style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '100px',
                  backgroundColor: name === 'You' ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
                  color: name === 'You' ? 'white' : 'var(--color-on-surface)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  {name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            padding: '2rem', 
            border: '2px dashed var(--color-outline-variant)', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <Upload size={32} style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.5rem' }} />
            <p className="text-title-lg" style={{ fontSize: '1rem' }}>Attach Receipt (Optional)</p>
            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>JPG, PNG or PDF up to 5MB</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-gradient" style={{ flex: 2 }}>Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
