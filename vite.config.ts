import { defineConfig } from 'vite';
import { execSync } from 'child_process';

import solid from 'vite-plugin-solid';

const commitHash = execSync('git rev-parse --short HEAD').toString();

export default defineConfig({
  define: {
    'import.meta.env.COMMIT_HASH': JSON.stringify(commitHash),
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [solid()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: '/src',
      },
    ],
  },
});
