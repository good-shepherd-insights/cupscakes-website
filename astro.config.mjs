import { defineConfig, envField } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';

import frontmanAi from '@frontman-ai/astro';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  site: 'https://cupscakes.com',
  devToolbar: {
    enabled: false,
  },
  env: {
    schema: {
      PUBLIC_SANITY_PROJECT_ID: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_SANITY_DATASET: envField.string({ context: 'client', access: 'public', default: 'production' }),
      PUBLIC_SNIPCART_API_KEY: envField.string({ context: 'client', access: 'public' })
    }
  },
  integrations: [sanity({
    projectId: env.PUBLIC_SANITY_PROJECT_ID,
    dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2026-05-01',
    useCdn: false,
    studioBasePath: '/admin',
    stega: {
      enabled: true,
      studioUrl: '/admin',
    },
  }), react(), frontmanAi()],
  vite: {
    define: {
      'process.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify(env.PUBLIC_SANITY_PROJECT_ID),
      'process.env.PUBLIC_SANITY_DATASET': JSON.stringify(env.PUBLIC_SANITY_DATASET ?? 'production'),
    },

    // Pre-bundle the React runtime up front so Vite never re-optimizes it
    // mid-session. The frontmanAi() integration runs Lighthouse (chrome-launcher)
    // against the dev server, whose route crawls keep triggering on-the-fly dep
    // discovery + re-optimization; that bumps the optimized-dep hash and 504s the
    // `react/jsx-dev-runtime` chunk the LiveCart (client:only) island imports,
    // surfacing as "jsxDEV is not a function". Pinning these keeps the hash stable.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },

    plugins: [tailwindcss()],
  },
});
