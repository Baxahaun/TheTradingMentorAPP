import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import 'jest-axe/extend-expect';

// Global test configuration for comprehensive testing suite

// Mock performance API for performance tests
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock IntersectionObserver for virtualization tests
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock ResizeObserver for responsive tests
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia for responsive and accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock canvas context for chart tests
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock File API for chart upload tests
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.byteLength || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

// Mock URL.createObjectURL for image handling
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock clipboard API for copy/paste functionality
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('mock clipboard text')),
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(() => Promise.resolve([]))
  }
});

// Mock geolocation for any location-based features
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => 
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  }
});

// Mock notification API
Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  configurable: true
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});

Object.defineProperty(Notification, 'requestPermission', {
  value: vi.fn(() => Promise.resolve('granted'))
});

// Mock crypto API for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234-5678-9012'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

// Mock IndexedDB for offline storage tests
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockIDBDatabase = {
  close: vi.fn(),
  createObjectStore: vi.fn(() => mockIDBObjectStore),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(() => mockIDBTransaction),
  version: 1,
  name: 'test-db',
  objectStoreNames: []
};

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  index: vi.fn(() => mockIDBIndex),
  createIndex: vi.fn(() => mockIDBIndex),
  deleteIndex: vi.fn()
};

const mockIDBIndex = {
  get: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  getAllKeys: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest)
};

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  commit: vi.fn(),
  error: null,
  mode: 'readwrite',
  db: mockIDBDatabase,
  oncomplete: null,
  onerror: null,
  onabort: null
};

Object.defineProperty(global, 'indexedDB', {
  value: {
    open: vi.fn(() => {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        request.result = mockIDBDatabase;
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    deleteDatabase: vi.fn(() => mockIDBRequest),
    databases: vi.fn(() => Promise.resolve([])),
    cmp: vi.fn()
  }
});

// Mock WebSocket for real-time features
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Global test hooks
beforeAll(() => {
  // Set up global test environment
  console.log('🧪 Setting up comprehensive test environment...');
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Set consistent viewport for tests
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

afterAll(() => {
  console.log('🧹 Cleaning up comprehensive test environment...');
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
  
  // Reset window location
  delete (window as any).location;
  (window as any).location = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  };
  
  // Reset fetch mock
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
  ) as any;
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  
  // Clear any timers
  vi.clearAllTimers();
  
  // Reset fake timers if they were used
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});

// Custom test utilities
export const testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock viewport size
  mockViewport: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Mock media query
  mockMediaQuery: (query: string, matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(q => ({
        matches: q === query ? matches : false,
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  },
  
  // Create mock trade data
  createMockTrade: (overrides = {}) => ({
    id: 'mock-trade-' + Math.random().toString(36).substr(2, 9),
    symbol: 'AAPL',
    entryPrice: 150,
    exitPrice: 155,
    quantity: 100,
    entryDate: '2024-01-15',
    exitDate: '2024-01-16',
    type: 'long' as const,
    status: 'closed' as const,
    pnl: 500,
    tags: ['test'],
    notes: 'Mock trade for testing',
    commission: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T15:30:00Z',
    ...overrides
  }),
  
  // Performance measurement
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    await testUtils.waitForNextTick();
    const end = performance.now();
    return end - start;
  }
};

// Export for use in tests
export { vi, beforeAll, afterAll, beforeEach, afterEach };