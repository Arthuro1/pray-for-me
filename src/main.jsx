import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

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
