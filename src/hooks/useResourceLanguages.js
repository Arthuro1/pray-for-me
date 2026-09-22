import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  getResourceFallbackLanguages, setResourceFallbackLanguages, subscribeResourceLanguages, toggleResourceLanguage,
} from '../lib/planPrefs';

// The reader's additional resource languages, live: Settings and every "Go
// deeper" shelf read the same device setting, and a change made in one shows in
// the others without a reload.
//
// The snapshot is the joined list rather than the array, so React sees the same
// value until the choice actually changes.
const snapshot = () => getResourceFallbackLanguages().join(',');

export function useResourceLanguages() {
  const key = useSyncExternalStore(subscribeResourceLanguages, snapshot);
  const languages = useMemo(() => (key ? key.split(',') : []), [key]);
  const toggle = useCallback(
    (code) => setResourceFallbackLanguages(toggleResourceLanguage(getResourceFallbackLanguages(), code)),
    [],
  );
  return { languages, toggle };
}
