import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Minus, Plus, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { loadAvatarSource, renderAvatarBlob } from '../../lib/avatarImage';
import { t } from '../../i18n';

// Choosing the square. Drag to reposition, zoom in, confirm — and the preview
// you are looking at IS the output: the same drawImage call renders the canvas
// on screen and the blob that gets uploaded, so what you framed is what you get.
//
// No crop dependency. The geometry below is a dozen lines of arithmetic, which
// is a better trade than shipping a library to every visitor of a prayer app.
//
// Coordinates are normalised: the crop window is 1×1 and the image is measured
// in those units, so nothing depends on the pixel size the viewport happens to
// have on this screen. At zoom 1 the shorter side of the photo exactly covers
// the window.

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const KEY_STEP = 0.04; // view units per arrow press
const PREVIEW_PIXELS = 512;

// Displayed size of the image, in crop-window units.
function displayedSize(source, zoom) {
  const shortest = Math.min(source.width, source.height);
  return { w: (source.width / shortest) * zoom, h: (source.height / shortest) * zoom };
}

// The image must always cover the window: the top-left can never move past 0,
// nor leave a gap at the far edge.
function clampOffset(offset, size) {
  return {
    x: Math.min(0, Math.max(1 - size.w, offset.x)),
    y: Math.min(0, Math.max(1 - size.h, offset.y)),
  };
}

// Crop window -> source pixels. One place, used by both the preview and the
// final encode.
function cropRect(source, zoom, offset) {
  const shortest = Math.min(source.width, source.height);
  const pxPerUnit = shortest / zoom;
  return { x: -offset.x * pxPerUnit, y: -offset.y * pxPerUnit, size: pxPerUnit };
}

export default function AvatarCropModal({ lang, file, kind = 'user', onCancel, onConfirm }) {
  const [source, setSource] = useState(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const sourceRef = useRef(null);

  const trapRef = useFocusTrap(true);
  const close = useCallback(() => { if (!saving) onCancel(null); }, [saving, onCancel]);
  useEscapeKey(close);

  // Decode once. A file that will not decode is reported to the caller, which
  // owns the toast — the dialog never becomes a dead end with an error in it.
  useEffect(() => {
    let alive = true;
    loadAvatarSource(file).then(({ source: decoded, error }) => {
      if (!alive) { decoded?.close?.(); return; }
      if (error) { onCancel(error); return; }
      sourceRef.current = decoded;
      const size = displayedSize(decoded, MIN_ZOOM);
      setSource(decoded);
      setOffset({ x: (1 - size.w) / 2, y: (1 - size.h) / 2 });
    });
    return () => {
      alive = false;
      sourceRef.current?.close?.();
      sourceRef.current = null;
    };
  }, [file, onCancel]);

  // Redraw the preview whenever the frame moves.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const box = cropRect(source, zoom, offset);
    ctx.clearRect(0, 0, PREVIEW_PIXELS, PREVIEW_PIXELS);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, box.x, box.y, box.size, box.size, 0, 0, PREVIEW_PIXELS, PREVIEW_PIXELS);
  }, [source, zoom, offset]);

  const move = useCallback((dx, dy) => {
    setOffset((current) => clampOffset({ x: current.x + dx, y: current.y + dy }, displayedSize(sourceRef.current, zoom)));
  }, [zoom]);

  // Zoom around the middle of the frame, so the face you centred stays centred
  // instead of drifting towards a corner.
  const applyZoom = useCallback((next) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next) || MIN_ZOOM));
    setOffset((current) => {
      const before = displayedSize(sourceRef.current, zoom);
      const after = displayedSize(sourceRef.current, clamped);
      const focus = { x: (0.5 - current.x) / before.w, y: (0.5 - current.y) / before.h };
      return clampOffset({ x: 0.5 - focus.x * after.w, y: 0.5 - focus.y * after.h }, after);
    });
    setZoom(clamped);
  }, [zoom]);

  const onPointerDown = (e) => {
    if (!source) return;
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    const width = frameRef.current?.clientWidth || 0;
    if (!drag || drag.id !== e.pointerId || !width) return;
    move((e.clientX - drag.x) / width, (e.clientY - drag.y) / width);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const endDrag = (e) => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  const onKeyDown = (e) => {
    const steps = { ArrowLeft: [KEY_STEP, 0], ArrowRight: [-KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] };
    const step = steps[e.key];
    if (!step) return;
    e.preventDefault();
    move(step[0], step[1]);
  };

  const handleConfirm = async () => {
    if (!source || saving) return;
    setSaving(true);
    const { blob, ext, error } = await renderAvatarBlob(source, cropRect(source, zoom, offset));
    if (error) { setSaving(false); onCancel(error); return; }
    // The parent owns the upload and closes the dialog; `saving` stays on so a
    // second tap cannot start a second upload of the same crop.
    await onConfirm(blob, ext);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={close}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'avatarCropTitle')}
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'avatarCropTitle')}</h3>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'avatarCropHint')}</p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            aria-label={t(lang, 'close')}
            className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            style={{ color: 'var(--text-3)' }}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div
          ref={frameRef}
          tabIndex={0}
          role="img"
          aria-label={t(lang, 'avatarCropFrame')}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="avatar-crop-frame mx-auto mb-4"
          style={{ borderRadius: kind === 'group' ? '1rem' : '50%' }}
        >
          {source
            ? <canvas ref={canvasRef} width={PREVIEW_PIXELS} height={PREVIEW_PIXELS} className="avatar-crop-canvas" />
            : <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-3)' }} aria-hidden="true" />}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={!source || zoom <= MIN_ZOOM || saving}
            aria-label={t(lang, 'avatarZoomOut')}
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-2)' }}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            disabled={!source || saving}
            aria-label={t(lang, 'avatarZoom')}
            onChange={(e) => applyZoom(e.target.value)}
            className="avatar-crop-zoom flex-1"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={!source || zoom >= MAX_ZOOM || saving}
            aria-label={t(lang, 'avatarZoomIn')}
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-2)' }}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="pressable min-h-11 flex-1 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-2)' }}
          >
            {t(lang, 'cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!source || saving}
            className="pressable min-h-11 flex-1 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" aria-hidden="true" /> : t(lang, 'avatarPhotoSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
