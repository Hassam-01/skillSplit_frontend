import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--color-surface)',
      backgroundImage: 'radial-gradient(circle at 80% 20%, var(--color-surface-container-low) 0%, transparent 40%), radial-gradient(circle at 20% 80%, var(--color-surface-container-high) 0%, transparent 40%)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem',
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 20px 50px rgba(0, 76, 76, 0.05)',
        border: '1px solid var(--color-outline-variant)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'var(--color-primary)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem',
            color: 'white'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-headline-lg" style={{ marginBottom: '0.5rem' }}>SkillSplit</h1>
          <p className="text-body-lg">Expense Management, Simplified.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Email or Phone</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input 
                type="text" 
                placeholder="ali@example.com"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.backgroundColor = 'var(--color-surface-container-lowest)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = 'var(--color-surface-container-low)';
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="text-label-sm">Password</label>
              <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.75rem' }}>
                Forgot?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.backgroundColor = 'var(--color-surface-container-lowest)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = 'var(--color-surface-container-low)';
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn-gradient" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem' }}>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', marginTop: '1rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>Sign up now</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
