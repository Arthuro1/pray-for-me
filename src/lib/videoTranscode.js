// Browser-safe video normalization. Most phones can play H.264/AAC in MP4,
// but browsers cannot decode common camera/archive formats such as AVI. The
// FFmpeg runtime is intentionally imported only when conversion is necessary:
// normal MP4/WebM uploads never download the ~32 MB WebAssembly core.

const AVI_MIME = new Set([
  'video/avi',
  'video/msvideo',
  'video/x-msvideo',
  'application/x-troff-msvideo',
]);
const BROWSER_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/ogg']);

export function needsVideoTranscode(fileOrAttachment) {
  const mime = String(fileOrAttachment?.type === 'video'
    ? fileOrAttachment?.mime
    : fileOrAttachment?.type || fileOrAttachment?.mime || '').toLowerCase();
  const name = String(fileOrAttachment?.name || '').toLowerCase();

  if (AVI_MIME.has(mime) || /\.avi(?:$|[?#])/.test(name)) return true;
  if (BROWSER_VIDEO_MIME.has(mime)) return false;

  // If the browser explicitly says it cannot play the declared container, do
  // the conversion before upload. An empty/unknown MIME is left alone here and
  // gets a conversion retry if the actual player later reports an error.
  if (mime.startsWith('video/') && typeof document !== 'undefined') {
    try {
      return document.createElement('video').canPlayType(mime) === '';
    } catch {
      return false;
    }
  }
  return false;
}

export function mp4Name(name) {
  const clean = String(name || 'video').replace(/\.[^.]+$/, '') || 'video';
  return `${clean}.mp4`;
}

let ffmpegPromise;
let conversionQueue = Promise.resolve();

async function loadFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { default: coreURL }, { default: wasmURL }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/core?url'),
        import('@ffmpeg/core/wasm?url'),
      ]);
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    })();
    ffmpegPromise.catch(() => { ffmpegPromise = null; });
  }
  return ffmpegPromise;
}

async function runConversion(source) {
  const ffmpeg = await loadFFmpeg();
  const token = crypto.randomUUID();
  const input = `input-${token}`;
  const output = `output-${token}.mp4`;

  try {
    await ffmpeg.writeFile(input, new Uint8Array(await source.arrayBuffer()));
    const exitCode = await ffmpeg.exec([
      '-i', input,
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      output,
    ]);
    if (exitCode !== 0) throw new Error('video conversion failed');
    const data = await ffmpeg.readFile(output);
    if (!(data instanceof Uint8Array) || data.byteLength === 0) throw new Error('empty video conversion');
    return new Blob([data], { type: 'video/mp4' });
  } finally {
    await Promise.allSettled([ffmpeg.deleteFile(input), ffmpeg.deleteFile(output)]);
  }
}

// A single FFmpeg instance owns one in-memory filesystem, so conversions are
// serialized. This also prevents two large mobile uploads from competing for
// several hundred MB of memory at once.
export function transcodeVideo(source) {
  const task = conversionQueue.then(() => runConversion(source));
  conversionQueue = task.catch(() => {});
  return task;
}

export async function prepareVideoFile(file) {
  if (!needsVideoTranscode(file)) return file;
  const blob = await transcodeVideo(file);
  return new File([blob], mp4Name(file.name), {
    type: 'video/mp4',
    lastModified: file.lastModified || Date.now(),
  });
}

const playbackUrlCache = new Map();

// Existing AVI attachments are already encrypted in storage. Once decrypted,
// fetch their local Blob URL, normalize it in-browser, and keep the playable
// URL for this page lifetime just like attachmentObjectUrl does.
export function transcodedPlaybackUrl(cacheKey, sourceUrl) {
  const key = cacheKey || sourceUrl;
  if (!playbackUrlCache.has(key)) {
    const promise = (async () => {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error('video source unavailable');
      const converted = await transcodeVideo(await response.blob());
      return URL.createObjectURL(converted);
    })();
    promise.catch(() => playbackUrlCache.delete(key));
    playbackUrlCache.set(key, promise);
  }
  return playbackUrlCache.get(key);
}
