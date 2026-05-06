import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';



// run a cleanup after test runs
afterEach(() => {
  cleanup();
});
