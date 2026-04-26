import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: '200px', 
        padding: '1.5rem var(--spacing-container)',
        maxWidth: 'calc(100vw - 200px)'
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
