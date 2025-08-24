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
    setupFiles: ['./src/test/setup.ts', './src/test/comprehensive-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
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
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90
        },
        // Specific thresholds for critical components
        'src/components/trade-review/': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        },
        'src/lib/': {
          statements: 92,
          branches: 88,
          functions: 92,
          lines: 92
        }
      }
    },
    // Test categorization
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    // Performance settings
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    // Reporter configuration
    reporter: [
      'verbose',
      'json',
      'html',
      ['junit', { outputFile: './test-results/junit.xml' }]
    ],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    // Watch mode settings
    watch: false,
    // Retry configuration
    retry: 2,
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_TEST_MODE: 'comprehensive'
    }
  }
});