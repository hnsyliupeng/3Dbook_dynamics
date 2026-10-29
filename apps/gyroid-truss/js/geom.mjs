// geom.mjs — small vector / distance / clipping helpers (fractional-coordinate space, cell = [0,1)^3)
export const mod1 = (x) => x - Math.floor(x);
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a) => Math.sqrt(dot(a, a));
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// minimum-image difference a-b in periodic unit cell
export function mimg(a, b) {
  let d = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let x = a[i] - b[i];
    x -= Math.round(x);
    d[i] = x;
  }
  return d;
}
export const mimgDist = (a, b) => norm(mimg(a, b));

// distance between segments p1-q1 and p2-q2 (non periodic, plain R3)
export function segSegDist(p1, q1, p2, q2) {
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2);
  const a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  const EPS = 1e-12;
  let s, t;
  if (a <= EPS && e <= EPS) return norm(r);
  if (a <= EPS) { s = 0; t = clamp(f / e, 0, 1); }
  else {
    const c = dot(d1, r);
    if (e <= EPS) { t = 0; s = clamp(-c / a, 0, 1); }
    else {
      const b = dot(d1, d2), den = a * e - b * b;
      s = den > EPS ? clamp((b * f - c * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
      else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const cp = add(p1, scale(d1, s)), cq = add(p2, scale(d2, t));
  return norm(sub(cp, cq));
}
export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

// Liang-Barsky clipping of segment [a,b] to axis box [lo,hi]; returns [t0,t1] or null
export function clipSegToBox(a, b, lo, hi) {
  let t0 = 0, t1 = 1;
  const d = sub(b, a);
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-14) {
      if (a[i] < lo[i] - 1e-12 || a[i] > hi[i] + 1e-12) return null;
      continue;
    }
    let tmin = (lo[i] - a[i]) / d[i];
    let tmax = (hi[i] - a[i]) / d[i];
    if (tmin > tmax) { const s = tmin; tmin = tmax; tmax = s; }
    if (tmin > t0) t0 = tmin;
    if (tmax < t1) t1 = tmax;
    if (t0 > t1) return null;
  }
  return [t0, t1];
}

// all lattice translations t in {-1,0,1}^3 for which segment(a,b)+t enters the unit cell box
export function segCellTranslations(a, b, margin = 0) {
  const lo = [-margin, -margin, -margin], hi = [1 + margin, 1 + margin, 1 + margin];
  const out = [];
  for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -1; iz <= 1; iz++) {
    const t = [ix, iy, iz];
    const r = clipSegToBox(add(a, t), add(b, t), lo, hi);
    if (r) out.push({ t, r });
  }
  return out;
}

export function sphereCellTranslations(p, r) {
  const out = [];
  for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -1; iz <= 1; iz++) {
    let ok = true;
    for (let k = 0; k < 3; k++) {
      const c = p[k] + [ix, iy, iz][k];
      if (c < -r - 1e-9 || c > 1 + r + 1e-9) { ok = false; break; }
    }
    if (ok) out.push([ix, iy, iz]);
  }
  return out;
}
