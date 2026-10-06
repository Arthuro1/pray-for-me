import { Component } from 'react';
import { RefreshCw } from 'lucide-react';
import { t } from '../i18n';
import { devError } from '../lib/logger';
import { PrimaryButton, SecondaryButton } from './shared/Primitives';

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
      <div role="alert" className="error-fallback">
        <div className="error-fallback__inner">
          <h1 className="error-fallback__title">{t(lang, 'errorBoundaryTitle')}</h1>
          <p className="account-gate__body">{t(lang, 'errorBoundaryBody')}</p>
          <div className="mt-6 grid gap-2">
            <PrimaryButton onClick={this.reset}>{t(lang, 'retry')}</PrimaryButton>
            <SecondaryButton icon={RefreshCw} iconSize={16} onClick={() => window.location.reload()}>
              {t(lang, 'errorBoundaryReload')}
            </SecondaryButton>
          </div>
        </div>
      </div>
    );
  }
}
