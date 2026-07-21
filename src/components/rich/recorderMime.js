// Preferred MediaRecorder format per browser. AAC-in-mp4 is the only audio
// every member's device decodes (iOS Safari has no webm/opus at all), but it
// must be requested as an EXPLICIT codec: given bare 'audio/mp4', Chromium
// records Opus into the mp4 container — iOS then shows a player that "plays"
// pure silence. Bare 'audio/mp4' is trusted only where the browser cannot put
// Opus in mp4 (Safari — its bare mp4 is AAC). webm/opus stays the last resort
// (Firefox, Chromium without a platform AAC encoder).
export function recorderMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) return 'audio/mp4;codecs=mp4a.40.2';
  if (MediaRecorder.isTypeSupported('audio/mp4') && !MediaRecorder.isTypeSupported('audio/mp4;codecs=opus')) return 'audio/mp4';
  for (const mime of ['audio/webm;codecs=opus', 'audio/webm']) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}
