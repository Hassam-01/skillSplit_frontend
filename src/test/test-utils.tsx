import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';


const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );
};


const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from RTL
export * from '@testing-library/react';

export { customRender as render };
