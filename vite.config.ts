import { defineConfig } from 'vite';
import { execSync } from 'child_process';

import solid from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

const commitHash = execSync('git rev-parse --short HEAD').toString();

export default defineConfig({
  define: {
    'import.meta.env.COMMIT_HASH': JSON.stringify(commitHash),
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [solid(), wasm(), topLevelAwait()],
  resolve: {
    alias: [
      {
        find: '@/',
        replacement: '/src/',
      },
      {
        find: '@boardgen/',
        replacement: '/boardgen/pkg/',
      },
    ],
  },
});
