import { defineConfig } from 'vitest/config';

export default defineConfig({
  // served from https://<user>.github.io/aurora/
  base: '/aurora/',
  server: { host: '127.0.0.1', port: 5176 },
  preview: { host: '127.0.0.1', port: 4176 },
  build: {
    rollupOptions: {
      output: {
        // three.js changes rarely: a separate chunk stays cached between deploys
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('node_modules/gsap/') || id.includes('node_modules/lenis/')) return 'motion';
          return undefined;
        },
      },
    },
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
});
