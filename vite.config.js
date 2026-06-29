import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env WITHOUT the VITE_ prefix filter so the dev proxy can read the
  // server-only ANTHROPIC_API_KEY. This is read in the Node dev server only and
  // is never exposed to `import.meta.env` / the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const anthropicKey = env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY || ''

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'icons/*.png'],
      manifest: {
        name: 'Pray4Me',
        short_name: 'Pray4Me',
        description: 'Your personal prayer companion — journal, weekly plan, and Bible verses.',
        theme_color: '#6d28d9',
        background_color: '#6d28d9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['lifestyle', 'religion'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Pull our Web Push handlers into the generated service worker.
        importScripts: ['push-sw.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing vendor libs into their own cached chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('qrcode')) return 'qrcode';
          if (id.includes('react') || id.includes('scheduler')) return 'react';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('date-fns')) return 'datefns';
        },
      },
    },
  },
  server: {
    // Dev-mode CSP parity with vercel.json so violations (e.g. a stray external
    // script/connection) surface locally instead of only in production. Vite's
    // dev server needs 'unsafe-inline'/'unsafe-eval' for HMR and a ws: socket;
    // the non-script directives mirror prod exactly.
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "object-src 'none'",
      ].join('; '),
    },
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        // Inject the API key Node-side so it never reaches the browser, even in
        // dev. The client sends no key; the proxy adds the auth headers here.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (anthropicKey) proxyReq.setHeader('x-api-key', anthropicKey)
            proxyReq.setHeader('anthropic-version', '2023-06-01')
          })
        },
      },
    },
  },
  }
})
