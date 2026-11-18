import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Match the oldest WebView used by the dedicated Android smoke device.
    // Syntax lowering does not polyfill newer runtime APIs such as Object.hasOwn.
    target: 'chrome91',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules[\\/]phaser/ },
            { name: 'physics', test: /node_modules[\\/]planck/ },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1800,
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
