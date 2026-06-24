import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import App from './App.jsx'
import './index.css'

// Injects a small "Twemoji Country Flags" web font so flag emojis render on
// platforms (notably Windows) that don't support regional-indicator flags.
polyfillCountryFlagEmojis()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
