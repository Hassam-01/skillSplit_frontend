import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';

const Signup = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: displayName.trim() || null });
    }
    setEmailSent(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem 0.875rem 3rem',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid transparent', borderRadius: 'var(--radius-md)',
    outline: 'none', fontSize: '0.9rem', transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)',
  };

  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 50px rgba(0, 76, 76, 0.05)', border: '1px solid var(--color-outline-variant)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(27, 94, 32, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1b5e20' }}>
            <CheckCircle size={36} />
          </div>
          <h2 className="text-headline-lg" style={{ marginBottom: '0.75rem' }}>Check your inbox!</h2>
          <p className="text-body-lg" style={{ marginBottom: '2rem', lineHeight: '1.7' }}>
            We've sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account and then log in.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="btn-gradient" style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <span>Go to Login</span>
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', backgroundImage: 'radial-gradient(circle at 20% 20%, var(--color-surface-container-low) 0%, transparent 40%), radial-gradient(circle at 80% 80%, var(--color-surface-container-high) 0%, transparent 40%)' }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 50px rgba(0, 76, 76, 0.05)', border: '1px solid var(--color-outline-variant)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-headline-lg" style={{ marginBottom: '0.5rem' }}>Create Account</h1>
          <p className="text-body-lg">Join the cooperative of financial clarity.</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', color: 'var(--color-error)' }}>
            <AlertCircle size={18} />
            <p style={{ fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ali Khan" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.backgroundColor = 'var(--color-surface-container-lowest)'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'var(--color-surface-container-low)'; }} />
            </div>
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@example.com" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.backgroundColor = 'var(--color-surface-container-lowest)'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'var(--color-surface-container-low)'; }} />
            </div>
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.backgroundColor = 'var(--color-surface-container-lowest)'; }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = 'var(--color-surface-container-low)'; }} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn-gradient" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem' }} disabled={loading}>
              <span>{loading ? 'Creating account…' : 'Create Account'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', marginTop: '1rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </form>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-outline-variant)', textAlign: 'center' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', opacity: 0.6 }}>
            By signing up, you agree to our Terms of Cooperation and Privacy Ledger.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
