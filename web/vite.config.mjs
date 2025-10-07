// vite.config.mjs
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    root: '.', // project root
    server: isDev
      ? {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem'))
          },
          port: 3000
        }
      : undefined, // skip HTTPS when building for prod (no certs in CI/CD)

    test: {
      environment: 'jsdom', // enables DOM APIs for testing
      globals: true,        // allows using 'describe', 'it', etc. without importing
      reporters: ['default'],
      coverage: {
        exclude: [
          'vite.config.mjs', // ⬅️ explicitly exclude this
          'tests/',          // optionally exclude your tests too
          'node_modules/'    // always good to exclude this
        ],
        reporter: ['text', 'html']
      }
    }
  };
});
