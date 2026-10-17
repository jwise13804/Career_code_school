// Site-wide settings. Everything else lives in content/.

// Pyodide (Python compiled to WebAssembly) is ~8 MB, so it is loaded from the
// jsDelivr CDN instead of being committed here. Pin the version so lessons
// never break because of an upstream change.
export const PYODIDE_URL = "https://cdn.jsdelivr.net/npm/pyodide@0.29.5/";

// How long learner code may run before we stop it (milliseconds).
export const RUN_TIMEOUT_MS = 10000;

// Version of the saved-progress format (see core/storage.js).
export const STORAGE_KEY = "ccs-progress-v1";
