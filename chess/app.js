// Chess Camera: follows a real game through the camera, checks each move and
// suggests the next one. See vision.js for how moves are read from the image
// and engine-worker.js for the move suggestions and ratings.
import { Chess } from "../assets/vendor/chess.js";
import {
  CORNER_LABELS, FILES, boardToImage, changeThreshold, changedSquares, matchMove,
  project, squareDiffs, squareFeatures, squareIndex,
} from "./vision.js";

const $ = (id) => document.getElementById(id);
const els = {
  stage: $("stage"), video: $("video"), overlay: $("overlay"), placeholder: $("placeholder"),
  camStatus: $("cam-status"), btnCamera: $("btn-camera"), btnCorners: $("btn-corners"),
  btnRotate: $("btn-rotate"), btnTrack: $("btn-track"), btnResync: $("btn-resync"),
  sensitivity: $("sensitivity"), feedback: $("feedback"), board: $("board"), arrows: $("arrows"),
  turn: $("turn"), suggest: $("suggest"), btnUndo: $("btn-undo"), btnFlip: $("btn-flip"),
  showHints: $("show-hints"), btnNew: $("btn-new"), legal: $("legal"), legalSummary: $("legal-summary"),
  history: $("history"), fen: $("fen"), btnFen: $("btn-fen"),
};

const NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const GLYPHS = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };
const SIDE = { w: "White", b: "Black" };
const TICK_MS = 100;
const STABLE_TICKS = 8; // ~0.8 s without movement before a move is read

const state = {
  game: new Chess(),
  log: [], // { san, color, from, to, promotion, fenBefore, rating }
  flipped: false,
  selected: null,
  // camera
  stream: null,
  proc: document.createElement("canvas"),
  mode: "off", // off | corners | ready | tracking | paused
  corners: [], // normalised [x, y] points for a1, h1, h8, a8
  H: null,
  features: null,
  prev: null,
  ref: null,
  stable: 0,
  lastSig: "",
  diffs: null,
  threshold: 0,
  problem: null, // { squares: [...] } while an illegal move is on the board
  timer: 0,
};
const procCtx = state.proc.getContext("2d", { willReadFrequently: true });

// ---------- engine ----------

const worker = new Worker(new URL("./engine-worker.js", import.meta.url), { type: "module" });
const pending = new Map();
const analyses = new Map(); // fen -> Promise<{ depth, moves }>
let nextId = 1;
worker.onmessage = ({ data }) => {
  pending.get(data.id)?.(data);
  pending.delete(data.id);
};
function analyse(fen) {
  if (!analyses.has(fen)) {
    const id = nextId++;
    analyses.set(fen, new Promise((resolve) => {
      pending.set(id, resolve);
      worker.postMessage({ id, fen, timeMs: 1500 });
    }));
  }
  return analyses.get(fen);
}

function rate(loss, played, best) {
  if (played.san === best.san || loss <= 10) return { label: "Best move", cls: "best" };
  if (loss <= 50) return { label: "Good move", cls: "good" };
  if (loss <= 120) return { label: "Inaccuracy", cls: "inaccuracy" };
  if (loss <= 300) return { label: "Mistake", cls: "mistake" };
  return { label: "Blunder", cls: "blunder" };
}

const formatScore = (cp) => {
  if (Math.abs(cp) > 90000) return cp > 0 ? "mate coming" : "getting mated";
  return (cp >= 0 ? "+" : "") + (cp / 100).toFixed(1);
};

// ---------- game ----------

function feedback(cls, html) {
  els.feedback.hidden = !html;
  els.feedback.className = "feedback " + cls;
  els.feedback.innerHTML = html;
}

function playMove(m, source) {
  const fenBefore = state.game.fen();
  const move = state.game.move({ from: m.from, to: m.to, promotion: m.promotion });
  const entry = { san: move.san, color: move.color, from: move.from, to: move.to, promotion: move.promotion, fenBefore, rating: null };
  state.log.push(entry);
  state.selected = null;
  state.problem = null;
  const where = source === "camera" ? "Seen on the board: " : "";
  feedback("ok", `✓ ${where}${SIDE[move.color]} played ${move.san} — legal move.<small>Checking how good it was…</small>`);
  render();
  rateMove(entry);
  return move;
}

async function rateMove(entry) {
  const result = await analyse(entry.fenBefore);
  const best = result.moves[0];
  const played = result.moves.find((x) => x.from === entry.from && x.to === entry.to && x.promotion === entry.promotion);
  if (!best || !played) return;
  entry.rating = rate(best.score - played.score, played, best);
  entry.best = best.san;
  if (state.log.at(-1) === entry) {
    const mate = state.game.isCheckmate() ? " Checkmate!" : "";
    const better = entry.rating.cls === "best" || entry.rating.cls === "good" ? "" : `<small>Better was ${best.san}.</small>`;
    const cls = { best: "ok", good: "ok", inaccuracy: "warn" }[entry.rating.cls] || "bad";
    feedback(cls, `${cls === "ok" ? "✓" : "!"} ${SIDE[entry.color]} played ${entry.san}: ${entry.rating.label}.${mate}${better}`);
  }
  renderHistory();
}

function gameOverText(g) {
  if (g.isCheckmate()) return `Checkmate — ${SIDE[g.turn() === "w" ? "b" : "w"]} wins`;
  if (g.isStalemate()) return "Stalemate — draw";
  if (g.isInsufficientMaterial()) return "Draw — not enough material to mate";
  if (g.isThreefoldRepetition()) return "Draw — threefold repetition";
  if (g.isDraw()) return "Draw — 50-move rule";
  return "";
}

// ---------- digital board ----------

function squareAt(i) {
  const r = state.flipped ? 7 - Math.floor(i / 8) : Math.floor(i / 8);
  const f = state.flipped ? 7 - (i % 8) : i % 8;
  return FILES[f] + (8 - r);
}

function viewXY(sq) {
  let f = FILES.indexOf(sq[0]);
  let r = 8 - Number(sq[1]);
  if (state.flipped) { f = 7 - f; r = 7 - r; }
  return [f + 0.5, r + 0.5];
}

function renderBoard() {
  const g = state.game;
  const last = state.log.at(-1);
  const targets = state.selected ? g.moves({ square: state.selected, verbose: true }) : [];
  const checkSq = g.inCheck() ? g.findPiece({ type: "k", color: g.turn() })[0] : null;
  const html = [];
  for (let i = 0; i < 64; i++) {
    const sq = squareAt(i);
    const f = FILES.indexOf(sq[0]);
    const rank = Number(sq[1]);
    const p = g.get(sq);
    const t = targets.find((m) => m.to === sq);
    const cls = ["sq", (f + rank) % 2 ? "dark" : "light"];
    if (last && (sq === last.from || sq === last.to)) cls.push("last");
    if (sq === state.selected) cls.push("sel");
    if (t) cls.push("target", t.captured ? "capture" : "");
    if (sq === checkSq) cls.push("check");
    const label = p ? `${SIDE[p.color]} ${NAMES[p.type]} on ${sq}` : sq;
    let inner = p ? `<span class="pc ${p.color}">${GLYPHS[p.type]}︎</span>` : "";
    if (i % 8 === 0) inner += `<span class="coord rank">${rank}</span>`;
    if (i >= 56) inner += `<span class="coord file">${sq[0]}</span>`;
    html.push(`<button class="${cls.join(" ")}" data-sq="${sq}" role="gridcell" aria-label="${label}">${inner}</button>`);
  }
  els.board.innerHTML = html.join("");
}

function renderArrows(suggestion) {
  if (!suggestion || !els.showHints.checked) { els.arrows.innerHTML = ""; return; }
  const [x1, y1] = viewXY(suggestion.from);
  const [x2, y2] = viewXY(suggestion.to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ex = x2 - ((x2 - x1) / len) * 0.3;
  const ey = y2 - ((y2 - y1) / len) * 0.3;
  els.arrows.innerHTML = `<defs><marker id="head" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 z" fill="rgba(29,140,60,0.85)"/></marker></defs>
    <line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="rgba(29,140,60,0.85)" stroke-width="0.16" stroke-linecap="round" marker-end="url(#head)"/>`;
}

function renderLegal() {
  const moves = state.game.moves({ verbose: true });
  els.legalSummary.textContent = `Legal moves for ${SIDE[state.game.turn()]} (${moves.length})`;
  const groups = new Map();
  for (const m of moves) {
    const key = `${NAMES[m.piece]} ${m.from}`;
    if (!groups.has(key)) groups.set(key, []);
    if (!groups.get(key).includes(m.san)) groups.get(key).push(m.san);
  }
  els.legal.innerHTML = [...groups].map(([k, sans]) => `<div><strong>${k}:</strong> ${sans.join(", ")}</div>`).join("")
    || "<div>No legal moves.</div>";
}

function renderHistory() {
  els.history.innerHTML = "";
  for (let i = 0; i < state.log.length; i += 2) {
    const li = document.createElement("li");
    li.innerHTML = [state.log[i], state.log[i + 1]].filter(Boolean).map((e) =>
      `<span class="mv">${e.san}</span>${e.rating ? `<span class="badge ${e.rating.cls}" title="${e.rating.cls === "best" ? "" : "Engine preferred " + e.best}">${e.rating.label}</span>` : ""}`,
    ).join(" &nbsp; ");
    els.history.append(li);
  }
}

let suggestion = null;
async function renderSuggestion() {
  const g = state.game;
  const fen = g.fen();
  suggestion = null;
  renderArrows(null);
  const over = gameOverText(g);
  if (over) { els.suggest.textContent = ""; return; }
  if (!els.showHints.checked) { els.suggest.textContent = "Suggestions are hidden."; return; }
  els.suggest.textContent = "Thinking…";
  const result = await analyse(fen);
  if (g.fen() !== fen || !els.showHints.checked) return;
  const [best, ...rest] = result.moves;
  suggestion = best;
  const others = rest.slice(0, 2).map((m) => m.san).join(", ");
  const white = g.turn() === "w" ? best.score : -best.score;
  els.suggest.innerHTML = `💡 Suggested for ${SIDE[g.turn()]}: <strong>${best.san}</strong>` +
    (others ? ` (also ${others})` : "") + `<br><small>Evaluation for White: ${formatScore(white)}</small>`;
  renderArrows(best);
}

function render() {
  const g = state.game;
  renderBoard();
  renderLegal();
  renderHistory();
  els.fen.value = g.fen();
  els.turn.textContent = gameOverText(g) || `${SIDE[g.turn()]} to move${g.inCheck() ? " — in check!" : ""}`;
  els.btnUndo.disabled = state.log.length === 0;
  renderSuggestion();
}

els.board.addEventListener("click", (e) => {
  const sq = e.target.closest("[data-sq]")?.dataset.sq;
  if (!sq) return;
  const g = state.game;
  if (state.selected) {
    const m = g.moves({ square: state.selected, verbose: true }).find((x) => x.to === sq);
    if (m) {
      playMove({ ...m, promotion: m.promotion ? "q" : undefined }, "manual");
      // Assume the real board now matches; keep following from here.
      if (state.mode === "tracking" && state.features) resync();
      return;
    }
  }
  const p = g.get(sq);
  state.selected = p && p.color === g.turn() && sq !== state.selected ? sq : null;
  renderBoard();
});

function pauseTracking(message) {
  if (state.mode === "tracking") {
    state.mode = "paused";
    els.btnResync.classList.add("attention");
    feedback("warn", `${message}<small>Then press Re-sync so the camera knows the board matches again.</small>`);
  }
}

els.btnUndo.addEventListener("click", () => {
  if (!state.game.undo()) return;
  state.log.pop();
  state.selected = null;
  state.problem = null;
  feedback("", "");
  render();
  pauseTracking("Take the move back on the real board.");
});

els.btnNew.addEventListener("click", () => {
  state.game.reset();
  state.log = [];
  state.selected = null;
  state.problem = null;
  feedback("", "");
  render();
  pauseTracking("Set up the start position on the real board.");
});

els.btnFen.addEventListener("click", () => {
  try {
    state.game.load(els.fen.value.trim());
  } catch (err) {
    feedback("bad", `That FEN isn't valid.<small>${err.message}</small>`);
    return;
  }
  state.log = [];
  state.selected = null;
  state.problem = null;
  feedback("", "");
  render();
  pauseTracking("Set up this position on the real board.");
});

els.btnFlip.addEventListener("click", () => {
  state.flipped = !state.flipped;
  renderBoard();
  renderArrows(suggestion);
});
els.showHints.addEventListener("change", renderSuggestion);

// ---------- illegal moves ----------

function explainIllegal(changed) {
  const g = state.game;
  const names = changed.map((c) => c.name);
  if (changed.length > 4) {
    return { cls: "warn", text: "A lot of the board changed — is a hand, shadow or the camera moving? Waiting for it to settle…" };
  }
  if (changed.length === 1) {
    return {
      cls: "warn",
      squares: names,
      text: `Only ${names[0]} changed, so I can't tell which move that was.<small>Finish the move, or tap it on the digital board.</small>`,
    };
  }
  const movers = names.filter((sq) => g.get(sq));
  const ours = movers.filter((sq) => g.get(sq).color === g.turn());
  const from = ours.length === 1 ? ours[0] : movers[0];
  if (!from) {
    return { cls: "bad", squares: names, text: `✗ Pieces appeared on ${names.join(" and ")}, which were empty.<small>Put the board back as it was.</small>` };
  }
  const to = names.find((sq) => sq !== from);
  const piece = g.get(from);
  const what = `${SIDE[piece.color]} ${NAMES[piece.type]}`;
  const squares = [from, to];
  if (piece.color !== g.turn()) {
    return { cls: "bad", squares, text: `✗ Not ${SIDE[piece.color]}'s turn: the ${what} on ${from} can't move now.<small>Put it back on ${from}. It's ${SIDE[g.turn()]} to move.</small>` };
  }
  const legal = g.moves({ square: from, verbose: true });
  const options = legal.length ? `Legal moves for it: ${[...new Set(legal.map((m) => m.san))].join(", ")}.` : "It has no legal moves right now.";
  let why = `A ${NAMES[piece.type]} can't go from ${from} to ${to}.`;
  const target = g.get(to);
  if (target && target.color === piece.color) {
    why = `You can't capture your own ${NAMES[target.type]}.`;
  } else if (piece.type === "k" && from[1] === to[1] && Math.abs(FILES.indexOf(from[0]) - FILES.indexOf(to[0])) === 2) {
    why = "You can't castle right now: the king or rook has moved, the king is in check, a square between is attacked, or the path isn't clear.";
  } else if (g.inCheck()) {
    why = `${SIDE[g.turn()]} is in check, and ${from}→${to} doesn't get the king out of check.`;
  } else {
    const king = g.findPiece({ type: "k", color: piece.color })[0];
    const probe = new Chess(g.fen());
    probe.remove(from);
    if (king && king !== from && probe.isAttacked(king, piece.color === "w" ? "b" : "w")) {
      why = `The ${NAMES[piece.type]} on ${from} is pinned: moving it would expose your king.`;
    }
  }
  return { cls: "bad", squares, text: `✗ Illegal move: ${what} ${from}→${to}. ${why}<small>${options} Put it back on ${from}.</small>` };
}

// ---------- camera ----------

function setStatus(text) {
  els.camStatus.textContent = text;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("This browser can't use the camera here. Open the page over https in Chrome, Safari or Firefox.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    await useStream(stream);
  } catch (err) {
    setStatus(err.name === "NotAllowedError"
      ? "Camera permission was refused. Allow it in your browser's site settings and try again."
      : `Couldn't start the camera (${err.name || err.message}).`);
  }
}

async function useStream(stream) {
  state.stream?.getTracks().forEach((t) => t.stop());
  state.stream = stream;
  els.video.srcObject = stream;
  await els.video.play();
  if (!els.video.videoWidth) await new Promise((r) => els.video.addEventListener("loadedmetadata", r, { once: true }));
  const scale = Math.min(1, 640 / els.video.videoWidth);
  state.proc.width = els.overlay.width = Math.round(els.video.videoWidth * scale);
  state.proc.height = els.overlay.height = Math.round(els.video.videoHeight * scale);
  els.placeholder.hidden = true;
  els.btnCamera.textContent = "Restart camera";
  els.btnCamera.classList.remove("primary");
  els.btnCorners.disabled = false;
  els.btnCorners.classList.add("primary");
  if (state.corners.length === 4) {
    computeH();
  } else {
    state.mode = "ready";
    setStatus("Camera on. Now press Mark corners and tap the four corners of the board.");
  }
  clearInterval(state.timer);
  state.timer = setInterval(tick, TICK_MS);
}

function beginCorners() {
  state.mode = "corners";
  state.corners = [];
  state.H = null;
  state.ref = null;
  els.stage.classList.add("picking");
  els.btnTrack.disabled = els.btnRotate.disabled = els.btnResync.disabled = true;
  setStatus(`Tap corner 1 of 4: the outer corner of a1 (next to White's queen-side rook, on White's left).`);
}

function computeH() {
  const pts = state.corners.map(([x, y]) => [x * state.proc.width, y * state.proc.height]);
  try {
    state.H = boardToImage(pts);
  } catch {
    state.H = null;
    setStatus("Those corners don't make a board shape. Press Mark corners and try again.");
    return;
  }
  els.stage.classList.remove("picking");
  els.btnCorners.classList.remove("primary");
  els.btnRotate.disabled = false;
  els.btnTrack.disabled = false;
  if (state.mode === "corners" || state.mode === "ready" || state.mode === "off") {
    state.mode = "ready";
    els.btnTrack.classList.add("primary");
    setStatus("Grid placed. Check the labels match the real board (Rotate labels if not), set up the pieces to match the digital board, then press Start tracking.");
  }
}

els.overlay.addEventListener("pointerdown", (e) => {
  if (state.mode !== "corners") return;
  const rect = els.overlay.getBoundingClientRect();
  state.corners.push([(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]);
  if (state.corners.length < 4) {
    setStatus(`Tap corner ${state.corners.length + 1} of 4: the outer corner of ${CORNER_LABELS[state.corners.length]}.`);
  } else {
    computeH();
  }
});

function resync() {
  if (!grab() || !state.features) return;
  state.ref = state.features;
  state.prev = null;
  state.stable = 0;
  state.lastSig = "";
  state.problem = null;
  state.mode = "tracking";
  els.btnResync.classList.remove("attention");
  els.btnResync.disabled = false;
  els.btnTrack.disabled = true;
  els.btnTrack.classList.remove("primary");
}

els.btnCamera.addEventListener("click", startCamera);
els.btnCorners.addEventListener("click", beginCorners);
els.btnRotate.addEventListener("click", () => {
  state.corners.push(state.corners.shift());
  computeH();
  if (state.mode === "tracking") resync();
});
els.btnTrack.addEventListener("click", () => {
  resync();
  feedback("ok", `Tracking started. ${SIDE[state.game.turn()]} to move — make a move and take your hand away.`);
  setStatus("Watching the board…");
});
els.btnResync.addEventListener("click", () => {
  resync();
  feedback("ok", "Re-synced: the camera now takes the real board to match the digital board.");
  setStatus("Watching the board…");
});

function grab() {
  if (els.video.readyState < 2) return false;
  procCtx.drawImage(els.video, 0, 0, state.proc.width, state.proc.height);
  if (state.H) state.features = squareFeatures(procCtx.getImageData(0, 0, state.proc.width, state.proc.height), state.H);
  return true;
}

function tick() {
  if (!grab()) return;
  if (state.H && state.mode === "tracking") track();
  drawOverlay();
}

function track() {
  const feat = state.features;
  const minimum = Number(els.sensitivity.value);
  const motion = state.prev ? Math.max(...squareDiffs(feat, state.prev)) : Infinity;
  state.prev = feat;
  state.diffs = squareDiffs(feat, state.ref);
  state.threshold = changeThreshold(state.diffs, minimum);
  if (motion > Math.max(6, minimum * 0.5)) {
    state.stable = 0;
    setStatus("Movement… waiting for the board to settle.");
    return;
  }
  if (++state.stable < STABLE_TICKS) return;
  setStatus("Watching the board…");
  const changed = changedSquares(state.diffs, state.threshold);
  if (!changed.length) {
    if (state.problem) {
      state.problem = null;
      feedback("ok", `Board is back to the last position. ${SIDE[state.game.turn()]} to move.`);
    }
    state.lastSig = "";
    // Follow slow lighting changes.
    state.ref = feat;
    return;
  }
  const sig = changed.map((c) => c.name).sort().join(",");
  if (sig === state.lastSig) return;
  state.lastSig = sig;
  if (gameOverText(state.game)) return;
  const match = matchMove(state.diffs, state.game.moves({ verbose: true }), state.threshold);
  if (match) {
    playMove(match.move, "camera");
    state.ref = feat;
    state.lastSig = "";
    return;
  }
  const problem = explainIllegal(changed);
  state.problem = problem;
  feedback(problem.cls, problem.text);
}

function drawOverlay() {
  const c = els.overlay;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  const lw = Math.max(1.5, c.width / 320);
  ctx.font = `bold ${Math.round(c.width / 32)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.mode === "corners" || !state.H) {
    state.corners.forEach(([x, y], i) => {
      ctx.fillStyle = "#ffd400";
      ctx.beginPath();
      ctx.arc(x * c.width, y * c.height, lw * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(CORNER_LABELS[i], x * c.width, y * c.height - lw * 10);
    });
    return;
  }
  const H = state.H;
  const quad = (f, r, fill) => {
    ctx.beginPath();
    [[f, r], [f + 1, r], [f + 1, r + 1], [f, r + 1]].forEach(([u, v], i) => {
      const [x, y] = project(H, u, v);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  // Squares that differ from the last known position.
  if (state.mode === "tracking" && state.diffs) {
    for (let s = 0; s < 64; s++) {
      if (state.diffs[s] > state.threshold) quad(s % 8, Math.floor(s / 8), "rgba(255, 60, 60, 0.35)");
    }
  }
  ctx.strokeStyle = "rgba(0, 220, 255, 0.85)";
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    let [x, y] = project(H, i, 0); ctx.moveTo(x, y);
    [x, y] = project(H, i, 8); ctx.lineTo(x, y);
    [x, y] = project(H, 0, i); ctx.moveTo(x, y);
    [x, y] = project(H, 8, i); ctx.lineTo(x, y);
  }
  ctx.stroke();
  const label = (sq, color) => {
    const s = squareIndex(sq);
    const [x, y] = project(H, (s % 8) + 0.5, Math.floor(s / 8) + 0.5);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - lw * 9, y - lw * 6, lw * 18, lw * 12);
    ctx.fillStyle = color;
    ctx.fillText(sq, x, y);
  };
  ["a1", "h1", "h8", "a8"].forEach((sq) => label(sq, "#fff"));
  if (state.problem?.squares) {
    state.problem.squares.forEach((sq) => label(sq, "#ff8a80"));
  } else if (suggestion && els.showHints.checked && state.mode === "tracking") {
    const centre = (sq) => {
      const s = squareIndex(sq);
      return project(H, (s % 8) + 0.5, Math.floor(s / 8) + 0.5);
    };
    const [x1, y1] = centre(suggestion.from);
    const [x2, y2] = centre(suggestion.to);
    ctx.strokeStyle = "rgba(40, 200, 90, 0.9)";
    ctx.fillStyle = "rgba(40, 200, 90, 0.9)";
    ctx.lineWidth = lw * 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = lw * 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.5), y2 - h * Math.sin(a - 0.5));
    ctx.lineTo(x2 - h * Math.cos(a + 0.5), y2 - h * Math.sin(a + 0.5));
    ctx.fill();
  }
}

// For automated tests: feed a synthetic camera stream.
window.chessCam = { useStream, state };

render();
