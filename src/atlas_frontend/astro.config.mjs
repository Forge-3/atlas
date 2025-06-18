import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  integrations: [react(), tailwind()],
  vite: {
    sourcemap: true,
    appType: 'spa',
    plugins: [
      environment("all", { prefix: "CANISTER_" }),
      environment("all", { prefix: "DFX_" }),
    ],
    build:{
      minify: {
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      }
    },
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:4943",
          changeOrigin: true,
        },
      },
    },
  },
});