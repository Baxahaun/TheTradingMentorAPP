/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/test/setup.ts',
      './src/__tests__/comprehensive/setup.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/strategy-system',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
      ],
      thresholds: {
        global: {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        },
        // Strategy Management System specific thresholds
        'src/services/StrategyPerformanceService.ts': {
          statements: 98,
          branches: 95,
          functions: 100,
          lines: 98
        },
        'src/services/StrategyAttributionService.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        },
        'src/components/EnhancedPlaybooks.tsx': {
          statements: 92,
          branches: 88,
          functions: 90,
          lines: 92
        },
        'src/components/strategy-builder/': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90
        }
      }
    },
    // Test categorization for strategy system
    include: [
      'src/__tests__/comprehensive/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.git/',
      'src/__tests__/comprehensive/setup.ts',
      'src/__tests__/comprehensive/test-runner.ts'
    ],
    // Performance settings optimized for comprehensive testing
    testTimeout: 30000, // 30 seconds for complex tests
    hookTimeout: 15000, // 15 seconds for setup/teardown
    teardownTimeout: 10000, // 10 seconds for cleanup
    // Parallel execution configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 6, // Increased for comprehensive testing
        minThreads: 2
      }
    },
    // Reporter configuration for comprehensive testing
    reporter: [
      'verbose',
      'json',
      'html',
      ['junit', { outputFile: './test-results/strategy-system-junit.xml' }],
      ['json', { outputFile: './test-results/strategy-system-results.json' }]
    ],
    outputFile: {
      json: './test-results/strategy-system-results.json',
      html: './test-results/strategy-system-report.html'
    },
    // Watch mode settings
    watch: false,
    // Retry configuration for flaky tests
    retry: 3,
    // Environment variables for comprehensive testing
    env: {
      NODE_ENV: 'test',
      VITE_TEST_MODE: 'comprehensive',
      VITE_STRATEGY_SYSTEM_TEST: 'true'
    },
    // Test sequence configuration
    sequence: {
      concurrent: true,
      shuffle: false, // Keep deterministic order for comprehensive testing
      hooks: 'parallel'
    },
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    // Benchmark configuration for performance tests
    benchmark: {
      include: ['src/__tests__/comprehensive/performance/**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules/', 'dist/'],
      reporters: ['verbose', 'json'],
      outputFile: './test-results/benchmarks.json'
    }
  },
  // Build configuration for test environment
  build: {
    target: 'node14',
    sourcemap: true
  },
  // Define configuration for different test types
  define: {
    __TEST_UNIT__: 'true',
    __TEST_INTEGRATION__: 'true',
    __TEST_E2E__: 'true',
    __TEST_PERFORMANCE__: 'true',
    __TEST_VISUAL__: 'true',
    __TEST_ACCESSIBILITY__: 'true'
  }
});