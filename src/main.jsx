import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initPwaInstallCapture, recordPwaVisit } from './lib/pwaInstall.js'
import './index.css'

// Capture installability before lazy app routes mount, and count this browsing
// session as one content-free visit. Neither action touches prayer content.
initPwaInstallCapture()
recordPwaVisit()

// Register the PWA service worker and re-check for a new one hourly. The
// precached index.html is served WITH the response headers captured at
// precache time (CSP / Permissions-Policy included), so an installed app that
// stays alive for days would otherwise keep enforcing a stale security policy
// long after a deploy changed it — exactly how phones kept blocking blob:
// media and the microphone after the vercel.json fix shipped.
registerSW({
  onRegisteredSW: (_url, registration) => {
    if (registration) setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
  },
})

// Injects a small "Twemoji Country Flags" web font so flag emojis render on
// platforms (notably Windows) that don't support regional-indicator flags.
// Served from our own origin (copy of the package's dist file in public/fonts)
// instead of its jsdelivr default — our CSP's font-src is 'self' only, so the
// CDN URL was silently blocked and the font never loaded.
polyfillCountryFlagEmojis('Twemoji Country Flags', '/fonts/TwemojiCountryFlags.woff2')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
