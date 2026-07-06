// @vitest-environment jsdom
//
// The boundary must (a) pass children through when nothing throws, (b) show a
// recoverable fallback when a child throws instead of white-screening, (c) let
// the user retry, and (d) auto-clear when the resetKey changes (route change).
// French is the always-loaded locale, so assertions go through t().
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

// A child that throws on demand. Flipping `boom` and re-rendering lets us test
// recovery after the underlying cause is gone.
function Boom({ boom }) {
  if (boom) throw new Error('kaboom');
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary lang={lang}>
        <div>hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders a recoverable fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary lang={lang}>
        <Boom boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(t(lang, 'errorBoundaryTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'retry'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'errorBoundaryReload'))).toBeTruthy();
    spy.mockRestore();
  });

  it('recovers when the user retries after the cause is gone', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary lang={lang}>
        <Boom boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(t(lang, 'errorBoundaryTitle'))).toBeTruthy();

    // The underlying condition clears, then the user taps "try again".
    rerender(
      <ErrorBoundary lang={lang}>
        <Boom boom={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText(t(lang, 'retry')));
    expect(screen.getByText('safe content')).toBeTruthy();
    spy.mockRestore();
  });

  it('auto-clears the error when resetKey changes (e.g. route navigation)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary lang={lang} resetKey="/a">
        <Boom boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(t(lang, 'errorBoundaryTitle'))).toBeTruthy();

    rerender(
      <ErrorBoundary lang={lang} resetKey="/b">
        <Boom boom={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeTruthy();
    spy.mockRestore();
  });

  it('supports a custom fallback render prop', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={({ error }) => <div>custom: {error.message}</div>}>
        <Boom boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('custom: kaboom')).toBeTruthy();
    spy.mockRestore();
  });
});
