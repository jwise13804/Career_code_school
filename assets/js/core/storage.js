// Progress lives in one localStorage entry. Every access is wrapped in
// try/catch: private browsing, full storage or blocked cookies must never
// break a lesson. If storage fails we keep working from memory.
import { STORAGE_KEY } from "../config.js";

const empty = () => ({
  version: 1,
  lessons: {}, // lessonId -> {done: true, doneAt: "2026-10-17"}
  labs: {}, // labId -> {code, passed, hints, solutionShown}
  quizzes: {}, // quizId -> {questionId: {correct: bool, at}}
  review: {}, // "quizId/questionId" -> {box: 1-5, due: "YYYY-MM-DD"}
  challenges: {}, // sql/terminal/other activity id -> {done: true}
  days: [], // dates she studied, "YYYY-MM-DD"
  lastLesson: null,
  settings: {},
});

let state = load();
let storageWorks = true;
const listeners = new Set();

// If the course is open in two tabs, pick up progress saved by the other one
// instead of overwriting it.
try {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    listeners.forEach((fn) => fn(state));
  });
} catch {
  // No window (shouldn't happen in a browser); nothing to sync.
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    storageWorks = false;
    return empty();
  }
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
  listeners.forEach((fn) => fn(state));
}

export function canSave() {
  return storageWorks;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** Record that she did some learning today (for the gentle streak). */
export function markActive() {
  const t = today();
  if (!state.days.includes(t)) {
    state.days.push(t);
    state.days = state.days.slice(-400);
    save();
  }
}

// ----- lessons -----
export function isLessonDone(id) {
  return Boolean(state.lessons[id]?.done);
}

export function setLessonDone(id, done = true) {
  if (done) state.lessons[id] = { done: true, doneAt: today() };
  else delete state.lessons[id];
  markActive();
  save();
}

export function setLastLesson(id) {
  if (state.lastLesson !== id) {
    state.lastLesson = id;
    save();
  }
}

// ----- labs -----
export function getLab(id) {
  return state.labs[id] || {};
}

export function updateLab(id, patch) {
  state.labs[id] = { ...state.labs[id], ...patch };
  if (patch.passed) markActive();
  save();
}

// ----- generic activities (SQL challenges, terminal scenarios, sims) -----
export function isChallengeDone(id) {
  return Boolean(state.challenges[id]?.done);
}

export function setChallengeDone(id) {
  state.challenges[id] = { done: true, at: today() };
  markActive();
  save();
}

// ----- quizzes and spaced review -----
// A simple Leitner system: a missed question goes in box 1 (due tomorrow).
// Each correct review moves it up a box; the gap grows 1, 2, 4, 8 days.
// After box 4 it graduates and leaves the review pile.
const GAPS = [0, 1, 2, 4, 8];

export function recordAnswer(quizId, questionId, correct, { fromReview = false } = {}) {
  const key = `${quizId}/${questionId}`;
  state.quizzes[quizId] = state.quizzes[quizId] || {};
  const prev = state.quizzes[quizId][questionId];
  // Remember the best result for the lesson score, but review uses the latest.
  state.quizzes[quizId][questionId] = { correct: correct || Boolean(prev?.correct), at: today() };
  const item = state.review[key];
  if (!correct) {
    state.review[key] = { box: 1, due: addDays(today(), GAPS[1]) };
  } else if (item && fromReview) {
    const box = item.box + 1;
    if (box > 4) delete state.review[key];
    else state.review[key] = { box, due: addDays(today(), GAPS[box]) };
  }
  markActive();
  save();
}

export function quizScore(quizId) {
  const answers = state.quizzes[quizId] || {};
  const values = Object.values(answers);
  return { answered: values.length, correct: values.filter((a) => a.correct).length };
}

export function reviewItems({ dueOnly = true } = {}) {
  const t = today();
  return Object.entries(state.review)
    .filter(([, v]) => !dueOnly || v.due <= t)
    .map(([key, v]) => {
      const [quizId, questionId] = key.split("/");
      return { quizId, questionId, ...v };
    });
}

// ----- settings -----
export function getSetting(name, fallback) {
  return state.settings[name] ?? fallback;
}

export function setSetting(name, value) {
  state.settings[name] = value;
  save();
}

// ----- streak (kind version) -----
export function streakInfo() {
  const days = new Set(state.days);
  const t = today();
  let current = 0;
  // A streak survives if she studied today OR yesterday: missing today so far
  // is not a "broken" streak, it's just not done yet.
  let cursor = days.has(t) ? t : addDays(t, -1);
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const weekStart = addDays(t, -6);
  const thisWeek = state.days.filter((d) => d >= weekStart && d <= t).length;
  return { current, total: days.size, thisWeek, studiedToday: days.has(t) };
}

// ----- export / import -----
export function exportProgress() {
  const data = { app: "career-code-school", exportedAt: new Date().toISOString(), progress: state };
  return JSON.stringify(data, null, 2);
}

export function importProgress(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a progress file (it isn't valid JSON).");
  }
  const progress = parsed?.progress ?? parsed;
  if (!progress || typeof progress !== "object" || !("lessons" in progress)) {
    throw new Error("That file doesn't look like a Career Code School progress file.");
  }
  state = { ...empty(), ...progress };
  save();
  return state;
}

export function resetProgress() {
  state = empty();
  save();
}
