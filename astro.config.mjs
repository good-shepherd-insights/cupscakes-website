import { defineConfig, envField } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

export default defineConfig({
  env: {
    schema: {
      PUBLIC_SANITY_PROJECT_ID: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_SANITY_DATASET: envField.string({ context: 'client', access: 'public', default: 'production' }),
      PUBLIC_SNIPCART_API_KEY: envField.string({ context: 'client', access: 'public' })
    }
  },
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2026-05-01',
      useCdn: false,
      studioBasePath: '/admin',
      stega: {
        enabled: true,
        studioUrl: '/admin',
      },
    }),
    react(),
  ],
});
