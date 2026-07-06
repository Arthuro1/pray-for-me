import { Component } from 'react';
import { RefreshCw } from 'lucide-react';
import { t } from '../i18n';
import { devError } from '../lib/logger';

// Catches render/lifecycle errors in its subtree so a single thrown error — or a
// lazy-chunk fetch that fails on a flaky network — shows a recoverable fallback
// instead of white-screening the whole app. Must be a class: React error
// boundaries have no hook equivalent.
//
// Props:
//   lang       — active language for the fallback copy (falls back to French).
//   resetKey   — when this value changes (e.g. the route path), the boundary
//                clears its error automatically, so navigating away recovers.
//   onReset    — optional extra cleanup to run on the "try again" action.
//   fallback   — optional ({ error, reset }) => node to fully override the UI.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Dev-only. Never logs in prod — an error body can echo user content. Tag +
    // component stack only; no raw prayer data reaches the console.
    devError('[ErrorBoundary]', error?.message, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    const lang = this.props.lang || 'fr';
    return (
      <div
        role="alert"
        className="min-h-[60vh] flex items-center justify-center p-6"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'errorBoundaryTitle')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
            {t(lang, 'errorBoundaryBody')}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="w-full rounded-xl py-2.5 font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {t(lang, 'retry')}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl py-2.5 font-medium inline-flex items-center justify-center gap-2"
              style={{ border: '1px solid var(--border)', color: 'var(--text-1)' }}
            >
              <RefreshCw size={16} />
              {t(lang, 'errorBoundaryReload')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
