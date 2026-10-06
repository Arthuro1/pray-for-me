// Pure extraction of authored copy. Never pass user records to this module.
export function flattenStrings(value, prefix = '', result = {}) {
  if (typeof value === 'string') result[prefix] = value;
  else if (Array.isArray(value)) value.forEach((item, i) => flattenStrings(item, `${prefix}[${i}]`, result));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (!['icon', 'color', 'emoji', 'scriptureReferences'].includes(key)) {
        flattenStrings(item, prefix ? `${prefix}.${key}` : key, result);
      }
    }
  }
  return result;
}

export function localizedFields(value, prefix = '', result = {}) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.en === 'string' || typeof value.fr === 'string') result[prefix] = value;
  else if (Array.isArray(value)) value.forEach((item, i) => localizedFields(item, `${prefix}[${i}]`, result));
  else for (const [key, item] of Object.entries(value)) {
    if (key !== 'review') localizedFields(item, prefix ? `${prefix}.${key}` : key, result);
  }
  return result;
}

export function makeEntries(surface, locale, source, target) {
  return Object.keys(source).sort().map((key) => ({
    id: `${surface}:${key}`, surface, locale, key,
    source: source[key], text: target[key] ?? null,
    sensitivity: surface === 'ui' ? 'ordinary' : surface === 'landing' ? 'marketing' : 'sensitive',
  }));
}

export function localizedEntries(surface, locale, value, overlay = {}) {
  const fields = localizedFields(value);
  const source = Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, item.en ?? item.fr]));
  const flatOverlay = flattenStrings(overlay);
  const target = Object.fromEntries(Object.entries(fields).map(([key, item]) => [
    key, flatOverlay[key === 'biblical.text' ? 'biblical' : key] ?? item[locale] ?? null,
  ]));
  return makeEntries(surface, locale, source, target);
}
