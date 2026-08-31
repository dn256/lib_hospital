import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  css: [
    '@mdi/font/css/materialdesignicons.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
    }
  },

  // Auth is persisted by Supabase in browser storage. Keep protected learning
  // workspaces client-rendered so the guard can restore the session first.
  routeRules: {
    '/atlas': { ssr: false },
    '/hmmd': { ssr: false },
  },

  typescript: {
    strict: true
  },

  modules: [
    '@tresjs/nuxt',
  ],

  // Ensure TresJS only runs on client
  tres: {
    devtools: false,
  },

  // Optimize Vite for Three.js
  vite: {
    optimizeDeps: {
      include: ['three'],
    },
  },

  app: {
    head: {
      title: 'Thư viện Mô bệnh học',
      meta: [
        { name: 'description', content: 'Thư viện tra cứu mô tả vi thể các bệnh lý - Pathology Library' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  }
})
