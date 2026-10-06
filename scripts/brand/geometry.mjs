// Qetoret master geometry — one source for every variant.
// The Q is drawn the way a calligrapher would: a left arc and a right arc that
// flows into the tail, open at the top where the incense rises through. All
// coordinates are measured from the approved reference in units of the bowl
// radius R, centred on the bowl.
const r = (n) => Math.round(n * 10) / 10;

// ── Curve helpers ──────────────────────────────────────────────────────────
function catmull(points, closed = false) {
  const p = points;
  const n = p.length;
  const get = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const segs = [];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return segs;
}

function evenly(dense, count) {
  const lengths = [0];
  for (let i = 1; i < dense.length; i++) lengths.push(lengths[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = lengths[lengths.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k <= count; k++) {
    const target = (k / count) * total;
    while (j < lengths.length - 2 && lengths[j + 1] < target) j++;
    const f = (target - lengths[j]) / ((lengths[j + 1] - lengths[j]) || 1);
    out.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f]);
  }
  return out;
}

function splinePoints(points, count) {
  const segs = catmull(points);
  const dense = [];
  for (let k = 0; k <= count * 8; k++) {
    const u = (k / (count * 8)) * segs.length;
    const i = Math.min(segs.length - 1, Math.floor(u));
    const t = u - i, mt = 1 - t;
    const [a, b, c, d] = segs[i];
    dense.push([
      mt ** 3 * a[0] + 3 * mt * mt * t * b[0] + 3 * mt * t * t * c[0] + t ** 3 * d[0],
      mt ** 3 * a[1] + 3 * mt * mt * t * b[1] + 3 * mt * t * t * c[1] + t ** 3 * d[1],
    ]);
  }
  return evenly(dense, count);
}

// Width from stops [[s, w], …], interpolated with a smooth (C1) curve so the
// stroke swells and thins without plateaus.
const stops = (list) => {
  const pts = list;
  return (s) => {
    let i = 0;
    while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const t = (s - p1[0]) / ((p2[0] - p1[0]) || 1);
    const m1 = ((p2[1] - p0[1]) / ((p2[0] - p0[0]) || 1)) * (p2[0] - p1[0]);
    const m2 = ((p3[1] - p1[1]) / ((p3[0] - p1[0]) || 1)) * (p2[0] - p1[0]);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
};

function open(points) {
  const segs = catmull(points);
  let d = '';
  for (const [, c1, c2, p] of segs) d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p[0])} ${r(p[1])}`;
  return d;
}

// A calligraphic stroke: centreline points + width(s). Each side is one smooth
// curve; the ends are clean cuts (or points, where the width reaches zero).
function stroke(pts, width, keep = 6) {
  const left = [], right = [];
  pts.forEach((p, i) => {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next[0] - prev[0], dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const w = Math.max(0, width(i / (pts.length - 1))) / 2;
    left.push([p[0] - dy * w, p[1] + dx * w]);
    right.push([p[0] + dy * w, p[1] - dx * w]);
  });
  const pick = (arr) => arr.filter((_, i) => i % keep === 0 || i === arr.length - 1);
  const L = pick(left), Rt = pick(right).reverse();
  return `M${r(L[0][0])} ${r(L[0][1])}${open(L)}L${r(Rt[0][0])} ${r(Rt[0][1])}${open(Rt)}Z`;
}

// ── The mark ───────────────────────────────────────────────────────────────
// `small` is the optical cut for 16–48px: heavier hairlines, a wider opening,
// one wisp, sturdier tail.
function mark({ small = false, closed = false, swash = false } = {}) {
  const R = 170, cx = 250, cy = 300;
  const P = ([u, v]) => [cx + u * R, cy + v * R];
  const W = (w) => w * R;

  // Bowl centreline: an ellipse through the middle of the stroke.
  const rx = 0.865, ry = 0.9;
  const arc = (from, to, dir, n = 120) => {
    const dense = [];
    for (let k = 0; k <= n * 8; k++) {
      const phi = from + ((to - from) * k) / (n * 8);
      dense.push(P([dir * rx * Math.sin(phi), -ry * Math.cos(phi)]));
    }
    return evenly(dense, n);
  };

  // Left arc: from the opening at top-left, down the left side, to a hairline
  // at the bottom centre. Thickest a little below the middle (old-style stress).
  // `closed` (the plain wordmark Q, no incense) lets both arcs meet at the top.
  const leftStart = closed ? -0.04 : small ? 0.42 : 0.34;
  const leftArc = stroke(
    arc(leftStart, Math.PI - 0.16, -1),
    stops(closed
      ? [[0, W(0.09)], [0.1, W(0.1)], [0.32, W(0.21)], [0.56, W(0.275)], [0.82, W(0.17)], [1, 0]]
      : small
        ? [[0, W(0.11)], [0.12, W(0.16)], [0.55, W(0.3)], [0.86, W(0.16)], [1, W(0.03)]]
        : [[0, W(0.01)], [0.08, W(0.08)], [0.32, W(0.21)], [0.56, W(0.275)], [0.82, W(0.17)], [1, 0]]),
  );

  // Right arc: from the opening at the top, round the right side, thinning at
  // the bottom where it hands over to the tail.
  const rightStart = closed ? -0.04 : small ? 0.06 : -0.01;
  const rightArc = stroke(
    arc(rightStart, Math.PI - 0.24, 1),
    stops(small
      ? [[0, W(0.15)], [0.22, W(0.24)], [0.45, W(0.31)], [0.8, W(0.16)], [1, W(0.06)]]
      : [[0, W(closed ? 0.09 : 0.12)], [0.13, W(0.16)], [0.4, W(0.285)], [0.56, W(0.26)], [0.82, W(0.1)], [1, W(0.02)]]),
  );

  // Tail: a small hook at the bottom centre, a long sweep to the lower right,
  // turning up at the end.
  const tail = stroke(
    // In the wordmark the tail runs on as a low swash beneath the next letters.
    splinePoints((swash
      ? [[-0.16, 0.8], [-0.1, 0.9], [0.02, 0.95], [0.24, 1.0], [0.55, 1.1], [0.9, 1.19], [1.25, 1.23], [1.6, 1.2], [1.86, 1.12]]
      : [[-0.16, 0.8], [-0.1, 0.9], [0.02, 0.95], [0.24, 1.0], [0.55, 1.1], [0.88, 1.18], [1.14, 1.16], [1.3, 1.07], [1.38, 0.96]]).map(P), 140),
    stops(small
      ? [[0, W(0.04)], [0.08, W(0.16)], [0.3, W(0.22)], [0.8, W(0.1)], [1, W(0.03)]]
      : [[0, 0], [0.06, W(0.09)], [0.16, W(0.14)], [0.34, W(0.165)], [0.64, W(0.105)], [0.88, W(0.035)], [1, 0]]),
  );

  // Incense: an even ribbon in a long S — left above the bowl, right through
  // the middle, back left low in the counter — tapering at both ends.
  const incensePts = splinePoints([
    [0.02, -1.42], [-0.08, -1.27], [-0.16, -1.08], [-0.16, -0.88], [-0.09, -0.68], [0.06, -0.42],
    [0.17, -0.16], [0.17, 0.06], [0.07, 0.28], [-0.05, 0.47], [-0.11, 0.6], [-0.12, 0.7],
  ].map(P), 160);
  const incense = stroke(
    incensePts,
    stops(small
      ? [[0, 0], [0.1, W(0.14)], [0.3, W(0.17)], [0.55, W(0.18)], [0.8, W(0.15)], [1, W(0.06)]]
      : [[0, 0], [0.09, W(0.075)], [0.22, W(0.11)], [0.4, W(0.135)], [0.56, W(0.125)], [0.74, W(0.11)], [0.9, W(0.05)], [1, W(0.012)]]),
  );

  // The companion wisp branches off the main stroke low on the left and rises
  // to its own fine tip beside the middle swell.
  const wisp = small ? null : stroke(
    splinePoints([[-0.1, 0.5], [-0.09, 0.3], [-0.05, 0.1], [-0.03, -0.08], [-0.05, -0.24]].map(P), 80),
    stops([[0, W(0.05)], [0.3, W(0.075)], [0.7, W(0.045)], [1, 0]]),
  );

  return { parts: [leftArc, rightArc, tail], incense: closed ? [] : [incense, wisp].filter(Boolean) };
}

export { mark };

