// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  build: {
    assets: 'static'
  },

  output: 'server',

  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({
        context: 'client',
        access: 'public'
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: 'client',
        access: 'public'
      })
    }
  },

  site: import.meta.env.DEV
    ? 'http://localhost:4321/'
    : 'https://20-projects-using-sup4base.vercel.app'

  adapter: vercel(),
  integrations: [react()]
});
