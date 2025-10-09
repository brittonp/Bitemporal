// vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    root: '.', // project root
    server: isDev
      ? {
          https: false, // run on http in dev for simplicity
          port: 3000,
          // proxy API requests to backend to avoid CORS issues
          proxy: {
            '/Bitemporal': {
              target: 'https://localhost:5001',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined, // skip HTTPS when building for prod (no certs in CI/CD)

    test: {
      environment: 'jsdom', // enables DOM APIs for testing
      globals: true, // allows using 'describe', 'it', etc. without importing
      reporters: ['default'],
      coverage: {
        exclude: [
          'vite.config.mjs', // ⬅️ explicitly exclude this
          'tests/', // optionally exclude your tests too
          'node_modules/', // always good to exclude this
        ],
        reporter: ['text', 'html'],
      },
    },
  };
});
