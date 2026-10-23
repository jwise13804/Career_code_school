// A small chess engine in a Web Worker so the camera loop never stalls.
// Alpha-beta search with captures-only quiescence, material + piece-square
// evaluation. It plays roughly club-beginner strength: good at spotting
// hanging pieces and short tactics, not a substitute for Stockfish.
//
// It drives chess.js's internal move generator (_moves/_makeMove/_undoMove)
// because the public move() re-validates every move and is ~5x slower. The
// vendored chess.js version is pinned, so these names don't move under us.
//
// Message in:  { id, fen, timeMs }
// Message out: { id, depth, moves: [{ san, from, to, promotion, score }] }
// Scores are centipawns from the side to move's point of view, best first.
import { Chess } from "../assets/vendor/chess.js";

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

// Piece-square tables from White's side, row 0 = rank 8 (Tomasz Michniewski's
// "simplified evaluation function").
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

class Timeout extends Error {}

function evaluate(chess) {
  let score = 0;
  const board = chess._board;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) { sq += 7; continue; }
    const p = board[sq];
    if (!p) continue;
    const row = sq >> 4;
    const col = sq & 7;
    const idx = p.color === "w" ? row * 8 + col : (7 - row) * 8 + col;
    const v = VALUE[p.type] + PST[p.type][idx];
    score += p.color === "w" ? v : -v;
  }
  return chess._turn === "w" ? score : -score;
}

// Most valuable victim, least valuable attacker first; promotions early.
const order = (m) => (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] + 10000 : 0) + (m.promotion ? VALUE[m.promotion] : 0);
const sortMoves = (moves) => moves.sort((a, b) => order(b) - order(a));

let deadline = 0;
let nodes = 0;
function tick() {
  if ((++nodes & 1023) === 0 && performance.now() > deadline) throw new Timeout();
}

function quiesce(chess, alpha, beta, qdepth) {
  tick();
  const stand = evaluate(chess);
  if (stand >= beta || qdepth === 0) return stand;
  if (stand > alpha) alpha = stand;
  const captures = sortMoves(chess._moves({ legal: true }).filter((m) => m.captured || m.promotion));
  for (const m of captures) {
    chess._makeMove(m);
    const score = -quiesce(chess, -beta, -alpha, qdepth - 1);
    chess._undoMove();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(chess, depth, alpha, beta, ply) {
  tick();
  const moves = chess._moves({ legal: true });
  if (moves.length === 0) return chess._isKingAttacked(chess._turn) ? -MATE + ply : 0;
  if (chess._halfMoves >= 100) return 0;
  if (depth === 0) return quiesce(chess, alpha, beta, 6);
  let best = -Infinity;
  for (const m of sortMoves(moves)) {
    chess._makeMove(m);
    const score = -search(chess, depth - 1, -beta, -alpha, ply + 1);
    chess._undoMove();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

// Root moves are each searched with a full window so every move gets an exact
// score: that is what lets the app say how much worse a played move was.
function analyse(fen, timeMs) {
  const chess = new Chess(fen);
  const publicMoves = chess.moves({ verbose: true });
  if (publicMoves.length === 0) return { depth: 0, moves: [] };
  const internal = chess._moves({ legal: true });
  deadline = performance.now() + timeMs;
  nodes = 0;
  let result = null;
  for (let depth = 1; depth <= 4; depth++) {
    try {
      const scored = internal.map((m, i) => {
        chess._makeMove(m);
        const score = -search(chess, depth - 1, -MATE - 1, MATE + 1, 1);
        chess._undoMove();
        return { ...pick(publicMoves[i]), score };
      });
      scored.sort((a, b) => b.score - a.score);
      result = { depth, moves: scored };
    } catch (e) {
      if (!(e instanceof Timeout)) throw e;
      // Undo whatever the interrupted search left on the stack.
      while (chess._history.length) chess._undoMove();
      break;
    }
  }
  return result;
}

const pick = (m) => ({ san: m.san, from: m.from, to: m.to, promotion: m.promotion });

self.onmessage = ({ data }) => {
  const { id, fen, timeMs = 1500 } = data;
  // Depth 1 always completes; give it room even on a slow phone.
  const out = analyse(fen, timeMs) || analyse(fen, 60000);
  self.postMessage({ id, fen, ...out });
};
