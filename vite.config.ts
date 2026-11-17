import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
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
