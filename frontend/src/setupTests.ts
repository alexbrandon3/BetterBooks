import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver; 