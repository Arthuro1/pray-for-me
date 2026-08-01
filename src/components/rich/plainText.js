// Flatten markdown-lite to plain text for clamped previews.
export function plainText(text) {
  if (!text) return '';
  return String(text)
    .split('\n')
    .map((line) => line.replace(/^\s*[-*]\s+/, ''))
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
