import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Single source of truth for the app version: package.json. Injected as the
// compile-time constant __APP_VERSION__ so the UI (Settings/About) and any docs
// never drift from the published version.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig(({ mode }) => {
  // Load env WITHOUT the VITE_ prefix filter so the dev proxy can read the
  // server-only ANTHROPIC_API_KEY. This is read in the Node dev server only and
  // is never exposed to `import.meta.env` / the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  // Server-only key. There is NO VITE_ fallback on purpose: a VITE_-prefixed name
  // is inlined into the browser bundle, so accepting one here would reintroduce
  // the client-side-secret foot-gun. Keep this in sync with api/anthropic.js.
  const anthropicKey = env.ANTHROPIC_API_KEY || ''
  const yvpKey = env.YVP_APP_KEY || ''

  return {
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
        // Keep the install-time precache to the shell. The 15 non-French locale
        // chunks are code-split and loaded on demand — precaching all of them
        // (~450 KB) forces every user to download 15 languages they'll never use,
        // re-fetched on each deploy. They're served from cache after first use via
        // the runtimeCaching rule below. (French ships in the main bundle.)
        globIgnores: ['**/assets/{ar,de,es,fa,hi,id,ja,ko,pt,ru,sw,tl,zh,am,en}-*.js'],
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
          {
            // On-demand locale chunks: serve from cache once fetched so offline
            // language switching still works, without bloating the precache.
            urlPattern: /\/assets\/(ar|de|es|fa|hi|id|ja|ko|pt|ru|sw|tl|zh|am|en)-[\w-]+\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'locale-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
    // Honour the PORT the dev-preview tooling assigns (it falls back to a free
    // port when 5173 is taken by another running dev server).
    port: Number(process.env.PORT) || 5173,
    // Dev-mode CSP parity with vercel.json so violations (e.g. a stray external
    // script/connection) surface locally instead of only in production. Vite's
    // dev server needs 'unsafe-inline'/'unsafe-eval' for HMR and a ws: socket;
    // the non-script directives mirror prod exactly.
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-insights.com",
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
      // YouVersion Platform API: the client calls /api/youversion?version=&ref=,
      // and we rewrite that to the upstream passages path + inject the App Key
      // Node-side so it never reaches the browser. Mirrors the prod serverless
      // function (api/youversion.js).
      '/api/youversion': {
        target: 'https://api.youversion.com',
        changeOrigin: true,
        rewrite: (path) => {
          const q = new URL(path, 'http://x').searchParams
          const version = q.get('version') || ''
          const ref = (q.get('ref') || '').toUpperCase()
          return `/v1/bibles/${version}/passages/${ref}?format=text`
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (yvpKey) proxyReq.setHeader('X-YVP-App-Key', yvpKey)
          })
        },
      },
    },
  },
  }
})
