import { useState, useEffect } from 'react';
import { User, Phone, Globe, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
      setLanguage(profile.language || 'English');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: phone,
          language: language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-on-surface)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--color-on-surface-variant)',
  };

  const groupStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    position: 'relative',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0.875rem',
    top: '2.45rem',
    color: 'var(--color-primary)',
  };

  return (
    <div className="container" style={{ maxWidth: '600px', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h2 className="text-display-lg">Your Profile</h2>
        <p className="text-body-lg" style={{ marginTop: '0.5rem' }}>
          Manage your personal information and preferences.
        </p>
      </header>

      <div className="surface-lowest" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSave}>
          <div style={groupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input 
              type="text" 
              value={user?.email || ''} 
              disabled 
              style={{ ...inputStyle, paddingLeft: '1rem', backgroundColor: 'var(--color-surface-container-highest)', cursor: 'not-allowed', opacity: 0.7 }} 
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '0.4rem' }}>Email cannot be changed.</p>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Display Name</label>
            <User size={18} style={iconStyle} />
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="Enter your name"
              style={inputStyle}
              required
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Phone Number</label>
            <Phone size={18} style={iconStyle} />
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+92 300 1234567"
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Language Preference</label>
            <Globe size={18} style={iconStyle} />
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="English">English</option>
              <option value="Urdu">Urdu</option>
              <option value="Roman Urdu">Roman Urdu</option>
            </select>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--color-error-container)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
              <AlertCircle size={18} />
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(56,107,33,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-success)' }}>
              <CheckCircle size={18} />
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>Profile updated successfully!</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-gradient" 
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Saving Changes…' : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
