import '@testing-library/jest-dom';

// Mock window.matchMedia for Jest
global.matchMedia = global.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Polyfill for crypto.getRandomValues in Jest/JSDOM
declare global {
  // eslint-disable-next-line no-var
  var crypto: Crypto;
}
if (!global.crypto) {
  // @ts-ignore
  global.crypto = {};
}
if (!global.crypto.getRandomValues) {
  // @ts-ignore
  global.crypto.getRandomValues = (arr: any) => require('crypto').randomFillSync(arr);
} 