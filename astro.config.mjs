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

  //Localhost
  //Deploy normal project
  // base: '/project-1219/',
  // site: 'https://20essentials.github.io/project-1219/'
  site: 'http://localhost:4321/',

  adapter: vercel(),
  integrations: [react()]
});