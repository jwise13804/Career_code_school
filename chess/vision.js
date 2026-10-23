// Board vision: map the camera image onto an 8x8 grid and work out which
// squares changed between two snapshots. No machine learning: we never try to
// recognise pieces. We know the position (we follow the game from the start),
// so "which squares changed" is enough to tell which legal move was played.
//
// Board space: x = file (0 = a .. 8 = right edge of h), y = row from the top
// (0 = top edge of rank 8 .. 8 = bottom edge of rank 1).

export const FILES = "abcdefgh";

export const squareName = (f, r) => FILES[f] + (8 - r);
export const squareIndex = (name) => (8 - Number(name[1])) * 8 + FILES.indexOf(name[0]);
export const ALL_SQUARES = Array.from({ length: 64 }, (_, i) => squareName(i % 8, Math.floor(i / 8)));

// The user taps the outer corners in this order: a1, h1, h8, a8.
export const CORNER_LABELS = ["a1", "h1", "h8", "a8"];
const BOARD_CORNERS = [[0, 8], [8, 8], [8, 0], [0, 0]];

// Solve A x = b (Gaussian elimination with partial pivoting).
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("Corners are degenerate");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

// 3x3 homography (row-major, h33 = 1) taking each src point to its dst point.
export function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return [...solve(A, b), 1];
}

export function project(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

// corners: image points for a1, h1, h8, a8. Returns board space -> image.
export const boardToImage = (corners) => homography(BOARD_CORNERS, corners);

// Each square is described by a 3x3 grid of average colours taken from its
// middle (the edges are skipped: neighbouring pieces lean into them).
const CELLS = 3;
const SAMPLES = 4;
const MARGIN = 0.18;
const PER_SQUARE = CELLS * CELLS * 3;

export function squareFeatures(img, H) {
  const { data, width, height } = img;
  const out = new Float32Array(64 * PER_SQUARE);
  const steps = CELLS * SAMPLES;
  let k = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      for (let cy = 0; cy < CELLS; cy++) {
        for (let cx = 0; cx < CELLS; cx++) {
          let R = 0, G = 0, B = 0, n = 0;
          for (let sy = 0; sy < SAMPLES; sy++) {
            const v = r + MARGIN + ((cy * SAMPLES + sy + 0.5) / steps) * (1 - 2 * MARGIN);
            for (let sx = 0; sx < SAMPLES; sx++) {
              const u = f + MARGIN + ((cx * SAMPLES + sx + 0.5) / steps) * (1 - 2 * MARGIN);
              const [x, y] = project(H, u, v);
              const xi = Math.round(x);
              const yi = Math.round(y);
              if (xi < 0 || yi < 0 || xi >= width || yi >= height) continue;
              const i = (yi * width + xi) * 4;
              R += data[i];
              G += data[i + 1];
              B += data[i + 2];
              n++;
            }
          }
          out[k++] = n ? R / n : 0;
          out[k++] = n ? G / n : 0;
          out[k++] = n ? B / n : 0;
        }
      }
    }
  }
  return out;
}

// Mean absolute colour difference per square (0..255), indexed like ALL_SQUARES.
export function squareDiffs(a, b) {
  const d = new Float32Array(64);
  for (let s = 0; s < 64; s++) {
    let sum = 0;
    for (let j = s * PER_SQUARE; j < (s + 1) * PER_SQUARE; j++) sum += Math.abs(a[j] - b[j]);
    d[s] = sum / PER_SQUARE;
  }
  return d;
}

export function median(values) {
  const v = Array.from(values).sort((x, y) => x - y);
  return v.length ? (v[(v.length - 1) >> 1] + v[v.length >> 1]) / 2 : 0;
}

// The threshold adapts to noise: a square must change clearly more than the
// typical square (which absorbs small lighting and focus changes).
export const changeThreshold = (diffs, minimum) => Math.max(minimum, median(diffs) * 3 + 4);

export function changedSquares(diffs, threshold) {
  return ALL_SQUARES.map((name, i) => ({ name, value: diffs[i] }))
    .filter((s) => s.value > threshold)
    .sort((x, y) => y.value - x.value);
}

// Every square a move touches (castling moves a rook too, en passant removes a
// pawn from a third square). m is a chess.js verbose move.
export function moveSquares(m) {
  const squares = [m.from, m.to];
  const back = m.color === "w" ? "1" : "8";
  if (m.flags.includes("k")) squares.push("h" + back, "f" + back);
  if (m.flags.includes("q")) squares.push("a" + back, "d" + back);
  if (m.flags.includes("e")) squares.push(m.to[0] + m.from[1]);
  return squares;
}

// Pick the legal move that best explains the changed squares: all of its
// squares changed, and as little as possible changed anywhere else.
export function matchMove(diffs, moves, threshold) {
  let best = null;
  for (const m of moves) {
    const own = new Set(moveSquares(m).map(squareIndex));
    let minIn = Infinity;
    let maxOut = 0;
    for (let s = 0; s < 64; s++) {
      if (own.has(s)) minIn = Math.min(minIn, diffs[s]);
      else maxOut = Math.max(maxOut, diffs[s]);
    }
    if (minIn <= threshold) continue;
    const score = minIn - maxOut;
    const better = !best || score > best.score + 1e-6 || (Math.abs(score - best.score) <= 1e-6 && m.promotion === "q");
    if (better) best = { move: m, score, minIn, maxOut };
  }
  // A tall piece can shade the square behind it, so some change outside the
  // move is fine, but not a second clear change.
  if (best && best.maxOut < Math.max(threshold, best.minIn * 0.6)) return best;
  return null;
}
