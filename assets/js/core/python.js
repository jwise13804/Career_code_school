// Main-thread side of the Python runner. One shared worker for the whole site,
// created lazily the first time a lesson needs Python.
import { PYODIDE_URL, RUN_TIMEOUT_MS } from "../config.js";

let worker = null;
let readyPromise = null;
let pending = null; // the single in-flight run
let nextId = 1;
const statusListeners = new Set();
let lastStatus = "idle";

function setStatus(text) {
  lastStatus = text;
  statusListeners.forEach((fn) => fn(text));
}

export function onStatus(fn) {
  statusListeners.add(fn);
  fn(lastStatus);
  return () => statusListeners.delete(fn);
}

export function isReady() {
  return lastStatus === "ready";
}

function startWorker() {
  worker = new Worker(new URL("../workers/python-worker.js", import.meta.url));
  readyPromise = new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "status") setStatus(msg.text);
      else if (msg.type === "ready") {
        setStatus("ready");
        resolve();
      } else if (msg.type === "fatal") {
        setStatus("failed");
        reject(new Error(msg.error));
      } else if (pending && msg.id === pending.id) {
        if (msg.type === "stdout") pending.onStdout?.(msg.text);
        if (msg.type === "result") {
          const p = pending;
          pending = null;
          clearTimeout(p.timer);
          p.resolve(msg.result);
        }
      }
    };
    worker.onerror = (e) => {
      setStatus("failed");
      reject(new Error(e.message || "Python worker failed to start"));
    };
  });
  setStatus("Getting Python ready…");
  worker.postMessage({ type: "init", indexURL: PYODIDE_URL });
  return readyPromise;
}

export function ensurePython() {
  if (!readyPromise) {
    startWorker().catch(() => {
      // Allow a retry on the next call.
      worker?.terminate();
      worker = null;
      readyPromise = null;
    });
  }
  return readyPromise;
}

/** Stop whatever is running by throwing the worker away. */
export function stopPython(reason = "stopped") {
  if (!worker) return;
  worker.terminate();
  worker = null;
  readyPromise = null;
  setStatus("idle");
  if (pending) {
    const p = pending;
    pending = null;
    clearTimeout(p.timer);
    p.resolve({
      ok: false,
      stopped: true,
      error: reason === "timeout"
        ? { type: "Timeout", message: `Your code ran for more than ${RUN_TIMEOUT_MS / 1000} seconds, so we stopped it.`, explain: "This usually means a loop never ends. Check that a while loop's condition eventually becomes False." }
        : { type: "Stopped", message: "You stopped the code.", explain: "No harm done. Python will restart the next time you press Run." },
      tests: [],
      stdout: "",
    });
  }
}

/**
 * Run learner code. Resolves (never rejects) with
 * {ok, error, tests: [{ok, message, tip}], stdout, out}
 */
export function runPython({ code, tests = "", driver = "", onStdout, timeoutMs = RUN_TIMEOUT_MS }) {
  if (pending) stopPython();
  const id = nextId++;
  return new Promise((resolve) => {
    // Register first, so Stop works even while Python is still downloading.
    const mine = { id, resolve, onStdout };
    pending = mine;
    ensurePython().then(
      () => {
        if (pending !== mine) return; // stopped while loading
        mine.timer = setTimeout(() => stopPython("timeout"), timeoutMs);
        worker.postMessage({ type: "run", id, code, tests, driver });
      },
      (err) => {
        if (pending !== mine) return;
        pending = null;
        resolve({
          ok: false,
          error: { type: "Python didn't load", message: err.message, explain: "Check your internet connection, then press Run again." },
          tests: [],
          stdout: "",
        });
      },
    );
  });
}
