// gyroid.mjs — gyroid TPMS, its exact space-group symmetries (found numerically), Wyckoff orbits
// Fractional coordinates: cell = [0,1)^3 ;  g0(r) = sin(2πx)cos(2πy)+sin(2πy)cos(2πz)+sin(2πz)cos(2πx)
// (Dotera & Yamamoto 2026, eq. 2.1, "factors of 2π omitted" i.e. x in units of 2π; here kept explicit.)
import { mod1 } from './geom.mjs';

const TAU = 2 * Math.PI;

export function F(p) {
  const [x, y, z] = p;
  return (
    Math.sin(TAU * x) * Math.cos(TAU * y) +
    Math.sin(TAU * y) * Math.cos(TAU * z) +
    Math.sin(TAU * z) * Math.cos(TAU * x)
  );
}
export function gradF(p) {
  const [x, y, z] = p;
  return [
    TAU * (Math.cos(TAU * x) * Math.cos(TAU * y) - Math.sin(TAU * z) * Math.sin(TAU * x)),
    TAU * (Math.cos(TAU * y) * Math.cos(TAU * z) - Math.sin(TAU * x) * Math.sin(TAU * y)),
    TAU * (Math.cos(TAU * z) * Math.cos(TAU * x) - Math.sin(TAU * y) * Math.sin(TAU * z)),
  ];
}
export const unitNormal = (p) => {
  const g = gradF(p);
  const n = Math.hypot(g[0], g[1], g[2]);
  return [g[0] / n, g[1] / n, g[2] / n];
};

// project point onto level set F = level (Newton along gradient)
export function projectToLevel(p, level, iters = 12) {
  let q = [p[0], p[1], p[2]];
  for (let i = 0; i < iters; i++) {
    const g = gradF(q);
    const gg = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
    const r = F(q) - level;
    q = [q[0] - (r * g[0]) / gg, q[1] - (r * g[1]) / gg, q[2] - (r * g[2]) / gg];
  }
  return q;
}

// order parameter of the paper, eq. 3.2 (arguments in 2π units)
export function f422(p) {
  const x = TAU * p[0], y = TAU * p[1], z = TAU * p[2];
  return (
    Math.sin(2 * x) * Math.sin(2 * y) * Math.sin(4 * z) +
    Math.sin(2 * x) * Math.sin(4 * y) * Math.sin(2 * z) +
    Math.sin(4 * x) * Math.sin(2 * y) * Math.sin(2 * z)
  );
}

// ---- symmetry operations -------------------------------------------------
function signedPermMatrices() {
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  const out = [];
  for (const pm of perms)
    for (let s = 0; s < 8; s++) {
      const sg = [(s & 1) ? -1 : 1, (s & 2) ? -1 : 1, (s & 4) ? -1 : 1];
      const M = [
        [0, 0, 0], [0, 0, 0], [0, 0, 0],
      ];
      for (let r = 0; r < 3; r++) M[r][pm[r]] = sg[r];
      const nminus = sg.filter((v) => v < 0).length;
      out.push({ M, nminus });
    }
  return out;
}
const applyOp = (M, t, p) => [
  mod1(M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2] + t[0]),
  mod1(M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2] + t[1]),
  mod1(M[2][0] * p[0] + M[2][1] * p[1] + M[2][2] * p[2] + t[2]),
];

let OPS_CACHE = null;
/**
 * Numerically determine every affine operation (M,t), M a signed permutation,
 * t a quarter-lattice translation, with F(Mx+t) = s·F(x)  (s = ±1).
 * Both signs preserve the zero level set, giving 96 operations;
 * the subset with M in Td (even number of sign flips) = I-43d (No. 220, 48 ops),
 * the space group of the ordered sphere packings for H ≡ 0 (mod 3).
 */
export function gyroidSymmetryOps() {
  if (OPS_CACHE) return OPS_CACHE;
  const probes = [];
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 40; i++) probes.push([rnd(), rnd(), rnd()]);
  const ops = [];
  for (const { M, nminus } of signedPermMatrices()) {
    for (let ix = 0; ix < 4; ix++) for (let iy = 0; iy < 4; iy++) for (let iz = 0; iz < 4; iz++) {
      const t = [ix / 4, iy / 4, iz / 4];
      let resP = 0, resM = 0;
      for (const p of probes) {
        const f0 = F(p), f1 = F(applyOp(M, t, p));
        resP = Math.max(resP, Math.abs(f1 - f0));
        resM = Math.max(resM, Math.abs(f1 + f0));
      }
      const tol = 1e-9;
      if (resP < tol) ops.push({ M, t, s: +1, td: nminus % 2 === 0 });
      else if (resM < tol) ops.push({ M, t, s: -1, td: nminus % 2 === 0 });
    }
  }
  // Ia-3d (No. 230) = full symmetry of the level set F=0 (96 ops, half of them F -> -F).
  // I-43d (No. 220) = index-2 subgroup with point-group part Td (-43m), i.e. an even
  // number of sign flips in M; it is non-centrosymmetric (excludes M = -I).
  const ia3d = ops;
  const i43d = ops.filter((o) => o.td);
  const fPlus = ops.filter((o) => o.s === 1);
  OPS_CACHE = { all: ops, ia3d, i43d, fPlus, anti: ops.filter((o) => o.s === -1) };
  return OPS_CACHE;
}

export function orbit(gen, ops, tol = 1e-6) {
  const out = [];
  for (const op of ops) {
    const q = applyOp(op.M, op.t, gen);
    let dup = false;
    for (const p of out) {
      let dd = 0;
      for (let i = 0; i < 3; i++) { let x = p[i] - q[i]; x -= Math.round(x); dd += x * x; }
      if (Math.sqrt(dd) < tol) { dup = true; break; }
    }
    if (!dup) out.push(q);
  }
  return out;
}

// ---- Wyckoff generators, Dotera & Yamamoto 2026, SI table S2 --------------
// (fractional coordinates of the 48e / 96h representatives; single-membrane MC results)
export const WYCKOFF = {
  3:  { group: 'I43d', gens: [[0.576, 0.386, 0.554]] },
  4:  { group: 'Ia3',  gens: [[0.067, 0.655, 0.147]] },
  7:  { group: 'Ia3d', gens: [[0.039, 0.144, 0.411]] },
  9:  { group: 'I43d', gens: [[0.813, 0.240, 0.300], [0.010, 0.650, 0.604], [0.064, 0.339, 0.355]] },
  12: { group: 'I43d', gens: [[0.7924, 0.8535, 0.5766], [0.9068, 0.7814, 0.6245], [0.2980, 0.2753, 0.1801], [0.5857, 0.8865, 0.4549]] },
  13: { group: 'Ia3d', gens: [[0.4436, 0.3152, 0.1064], [0.6651, 0.2274, 0.1570]] },
  16: { group: 'Ia3d', gens: [[0.2410, 0.3652, 0.9332], [0.9255, 0.5916, 0.0282]] },
  19: { group: 'Ia3d', gens: [[0.3679, 0.0551, 0.3888], [0.7847, 0.1459, 0.9207], [0.9891, 0.4172, 0.4349]] },
  21: { group: 'I43d', gens: [[0.4613, 0.0038, 0.0438], [0.6138, 0.1899, 0.1090], [0.1817, 0.1130, 0.5155], [0.5827, 0.5365, 0.3685], [0.9480, 0.0862, 0.3796], [0.2854, 0.6193, 0.5628], [0.7520, 0.6739, 0.1611]] },
};
// tilings from SI table S1 (vertex symbols per Wyckoff orbit)
export const TILINGS = {
  3: '(3².4.3.4)', 4: '(3⁶; 3².4.3².4)', 7: '(3⁶; 3⁵.4)', 9: '(3⁶; 3⁵.4; 3⁵.4)',
  12: '(3⁶; 3⁶; 3⁵.4; 3⁵.4)', 13: '(3⁶; 3⁵.4; 3².4.3.4)', 16: '(3⁶; 3⁴.4; 3².4.3².4; 3².4.3².4)',
  19: '(3⁶; 3⁶; 3⁶; 3⁵.4)', 21: '(3⁶×5; 3⁵.4; 3⁵.4)',
};
