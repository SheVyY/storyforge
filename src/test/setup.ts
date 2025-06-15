import '@testing-library/jest-dom';
import { cleanup } from '@solidjs/testing-library';
import { afterEach, beforeEach, vi } from 'vitest';
// @ts-ignore - fake-indexeddb has typing issues
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
// @ts-ignore - fake-indexeddb has typing issues  
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

beforeEach(() => {
  // Setup IndexedDB mock with proper global assignment
  const indexedDB = new FDBFactory();
  global.indexedDB = indexedDB;
  global.IDBKeyRange = FDBKeyRange;
  // Also assign to window for browser-like environment
  if (typeof window !== 'undefined') {
    window.indexedDB = indexedDB;
    window.IDBKeyRange = FDBKeyRange;
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Service Worker registration
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({
      unregister: vi.fn(() => Promise.resolve(true))
    })),
    getRegistration: vi.fn(() => Promise.resolve(undefined))
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock alert and confirm
global.alert = vi.fn();
global.confirm = vi.fn(() => true);

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
  writable: true
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true
});