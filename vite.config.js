import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { handleAiRequest, MAX_REQUEST_BYTES } from './api/ai.js'

// Single source of truth for the app version: package.json. Injected as the
// compile-time constant __APP_VERSION__ so the UI (Settings/About) and any docs
// never drift from the published version.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

async function readJsonBody(req) {
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += buffer.length
    if (bytes > MAX_REQUEST_BYTES) {
      const error = new Error('Request too large')
      error.statusCode = 413
      throw error
    }
    chunks.push(buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

// Development exercises the same same-origin forwarder as production: the browser
// posts { task, input } to /api/ai and this middleware relays it to the private
// AI gateway (AI_GATEWAY_URL). The dev server never talks to an external provider
// and never lets the caller choose a model/prompt/token budget — the gateway owns
// all of that.
function aiApiPlugin(env) {
  return {
    name: 'pray4me-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        try {
          req.body = await readJsonBody(req)
        } catch (error) {
          res.statusCode = error?.statusCode === 413 ? 413 : 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ error: error?.statusCode === 413 ? 'Request too large' : 'Invalid request body' }))
          return
        }

        const apiRes = {
          status(code) {
            res.statusCode = code
            return apiRes
          },
          json(payload) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify(payload))
            return apiRes
          },
        }

        try {
          await handleAiRequest(req, apiRes, { env, fetchImpl: globalThis.fetch })
        } catch {
          if (!res.writableEnded) apiRes.status(500).json({ error: 'Internal server error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env WITHOUT the VITE_ prefix filter so the dev proxy can read the
  // server-only AI_GATEWAY_URL. This is read in the Node dev server only and is
  // never exposed to `import.meta.env` / the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const yvpKey = env.YVP_APP_KEY || ''

  // Optional direct-gateway mode: when the browser talks to a dedicated gateway
  // host (VITE_AI_GATEWAY_URL) instead of the same-origin /api/ai proxy, that
  // origin must be allowed in connect-src. Same-origin mode needs no addition.
  // (For production set the same origin in vercel.json's connect-src.)
  let aiGatewayOrigin = ''
  try {
    if (env.VITE_AI_GATEWAY_URL) aiGatewayOrigin = new URL(env.VITE_AI_GATEWAY_URL).origin
  } catch { /* ignore a malformed URL */ }
  const connectSrc = [
    "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-insights.com",
    aiGatewayOrigin,
  ].filter(Boolean).join(' ')

  return {
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    aiApiPlugin(env),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'logo-constellation.svg', 'logo-constellation-dark.svg', 'icons/*.png'],
      // /public/manifest.json is also consumed by the Android TWA wrapper. Keep
      // one manifest instead of injecting a second, drifting webmanifest link.
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Keep the install-time precache to the shell. The 15 non-French locale
        // chunks are code-split and loaded on demand — precaching all of them
        // (~450 KB) forces every user to download 15 languages they'll never use,
        // re-fetched on each deploy. They're served from cache after first use via
        // the runtimeCaching rule below. (French ships in the main bundle.)
        // The much smaller `landing-<lang>` marketing chunks are intentionally
        // named differently and remain precached so every landing language works
        // offline immediately after installation.
        globIgnores: ['**/assets/{ar,de,es,fa,hi,id,ja,ko,pt,ru,sw,tl,zh,am,en}-*.js'],
        // Pull our Web Push handlers into the generated service worker.
        importScripts: ['push-sw.js'],
        runtimeCaching: [
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
        "img-src 'self' data: blob: https:",
        "media-src 'self' blob:",
        "font-src 'self' data:",
        connectSrc,
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
