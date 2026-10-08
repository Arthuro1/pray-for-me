import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Moon, Sun } from 'lucide-react';
import { LANGUAGES } from '../../i18n';
import { APP_NAME } from '../../lib/brand';
import { BrandMark, Wordmark } from '../../components/shared/Brand';
import { SecondaryButton } from '../../components/shared/Primitives';

// The public header: the mark, the theme, the language, Sign in.

// Keep native language names in the shared registry. Languages whose longer
// marketing copy is still abbreviated show a clear, translated status label.
const PARTIAL_LANDING_LANGS = new Set(['sw', 'am', 'id', 'tl', 'ko', 'ru', 'ar', 'fa']);
const LANGS = LANGUAGES.map((language) => ({
  ...language,
  shortLabel: language.code.toUpperCase(),
  complete: !PARTIAL_LANDING_LANGS.has(language.code),
}));

function LanguageMenu({ lang, onChange, pending, label, inProgressLabel }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const active = LANGS.find((l) => l.code === lang);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const focusOption = (direction) => {
    const options = [...(menuRef.current?.querySelectorAll('[role="menuitemradio"]') || [])];
    if (!options.length) return;
    const currentIndex = options.indexOf(document.activeElement);
    const nextIndex = direction === 'first'
      ? 0
      : direction === 'last'
        ? options.length - 1
        : (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
  };

  const MENU_KEYS = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' };
  const handleMenuKeyDown = (event) => {
    if (!(event.key in MENU_KEYS)) return;
    event.preventDefault();
    focusOption(MENU_KEYS[event.key]);
  };

  const choose = (code) => {
    onChange(code);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => focusOption('first'));
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="landing-language-menu"
        aria-label={`${label}: ${active?.label}`}
        // The ONLY thing that reports a language still loading. The page
        // itself keeps its words; a whole-page spinner to change a language is
        // what made the site feel slow.
        aria-busy={pending || undefined}
        className="language-picker pressable"
      >
        <span>{active?.flag}</span>
        <span>{active?.shortLabel}</span>
        {pending
          ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          : <ChevronDown size={14} aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="landing-language-menu"
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="q-menu landing__language-menu"
        >
          {LANGS.map(({ code, flag, label: name, complete }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === code}
              onClick={() => choose(code)}
              className="q-menu__item"
            >
              <span>{flag}</span>
              <span className="flex-1">{name}</span>
              {!complete && <span className="landing__language-status">{inProgressLabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingHeader({ lang, onLanguageChange, pending, copy, theme, onToggleTheme, onSignIn }) {
  const themeLabel = theme === 'light' ? 'Dark mode' : 'Light mode';
  return (
    <nav className="landing__nav" aria-label={APP_NAME}>
      <div className="landing__brand">
        <BrandMark size={32} title={APP_NAME} />
        <Wordmark height={20} title={null} className="hidden min-[430px]:inline-block" />
      </div>

      <div className="landing__nav-actions">
        <button
          type="button"
          onClick={onToggleTheme}
          title={themeLabel}
          aria-label={themeLabel}
          className="icon-button icon-button--outlined pressable"
        >
          {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
        </button>

        <LanguageMenu
          lang={lang}
          onChange={onLanguageChange}
          pending={pending}
          label={copy.languageMenuLabel}
          inProgressLabel={copy.translationInProgress}
        />

        <SecondaryButton onClick={onSignIn} className="landing__sign-in">{copy.content.signIn}</SecondaryButton>
      </div>
    </nav>
  );
}
