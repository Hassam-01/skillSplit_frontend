import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const ThemeToggleBtn = () => (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        background: 'none',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-on-surface-variant)',
        backgroundColor: 'var(--color-surface-container-high)',
        flexShrink: 0,
      }}
    >
      {isDark
        ? <Sun size={16} color="var(--color-on-tertiary-container)" />
        : <Moon size={16} />
      }
    </button>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', backgroundColor: 'var(--color-surface)' }}>
      {/* Mobile Header */}
      <header
        className="lg-hide"
        style={{
          height: '64px',
          backgroundColor: 'var(--color-surface-container-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--color-outline-variant)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <Menu size={24} />
          </button>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>SkillSplit</h1>
        </div>
        <ThemeToggleBtn />
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} ThemeToggle={ThemeToggleBtn} />
        <main
          style={{
            flex: 1,
            padding: '1.5rem var(--spacing-container)',
            maxWidth: '100vw',
            overflowX: 'hidden',
            color: 'var(--color-on-surface)',
          }}
          className="main-content"
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .main-content {
            margin-left: 240px;
            max-width: calc(100vw - 240px);
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
