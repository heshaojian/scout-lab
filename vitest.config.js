import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'https://scout-lab.test/' },
    },
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/workbenches.js',
        'src/settings.js',
        'src/ui/**/*.js',
        'src/services/query.js',
        'src/services/normalizers.js',
        'src/services/feeds.js',
        'src/services/linkOpening.js',
        'src/services/storage.js',
        'src/services/backup.js',
        'src/services/archiveFormat.js',
        'src/services/archive.js',
        'src/services/learnSources.js',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
