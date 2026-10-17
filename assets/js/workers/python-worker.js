/* Runs learner Python inside Pyodide, off the main thread.
 *
 * Why a worker: if the learner writes `while True:` the page stays responsive,
 * and the main thread can simply terminate() this worker (Stop button or timeout)
 * and start a fresh one.
 *
 * Messages in:  {type: "init", indexURL}
 *               {type: "run", id, code, tests, driver}
 * Messages out: {type: "status", text}
 *               {type: "ready"}
 *               {type: "stdout", id, text}
 *               {type: "result", id, result}
 *               {type: "fatal", error}
 */
let pyodide = null;
let runner = null;

const HARNESS = String.raw`
import sys, json, traceback, math

class _Tee:
    def __init__(self, emit):
        self.parts = []
        self.emit = emit
    def write(self, s):
        if s:
            self.parts.append(s)
            self.emit(s)
        return len(s)
    def flush(self):
        pass
    def text(self):
        return "".join(self.parts)

_EXPLAIN = {
    "SyntaxError": "Python couldn't read this line. Look for a missing bracket, quote mark or colon.",
    "IndentationError": "The spacing at the start of a line is off. Lines inside an if, loop or function need to be indented by 4 spaces.",
    "TabError": "Tabs and spaces are mixed. Use 4 spaces for each level of indent.",
    "NameError": "Python doesn't know that name yet. Check the spelling (capitals matter) and that you created it before using it.",
    "TypeError": "Two kinds of data were mixed that don't fit together, like adding text to a number. str() and float() can convert between them.",
    "ValueError": "The type was right but the value wasn't usable, like float('ten').",
    "ZeroDivisionError": "Something was divided by zero. Check the number you're dividing by.",
    "KeyError": "You asked a dictionary for a key it doesn't have. Check the spelling of the key, quotes included.",
    "IndexError": "You asked a list for a position that doesn't exist. Remember the first item is position 0.",
    "AttributeError": "That kind of value doesn't have the method you used. Check the spelling, or what type the value really is.",
    "RecursionError": "A function kept calling itself and never stopped.",
    "AssertionError": "An assert line failed: something you said would be true wasn't.",
}

def _line_of(exc):
    if isinstance(exc, SyntaxError) and exc.filename == "your_code.py":
        return exc.lineno
    line = None
    for frame in traceback.extract_tb(exc.__traceback__):
        if frame.filename == "your_code.py":
            line = frame.lineno
    return line

def _friendly(exc, code):
    name = type(exc).__name__
    msg = str(exc) if not isinstance(exc, SyntaxError) else (exc.msg or "")
    line = _line_of(exc)
    source = None
    if line:
        lines = code.splitlines()
        if 0 < line <= len(lines):
            source = lines[line - 1].strip()
    explain = _EXPLAIN.get(name, "Something went wrong while running your code.")
    if name == "TypeError" and "concatenate" in msg:
        explain = "You tried to join text and a number with +. Wrap the number in str(), or use an f-string like f\"Total: {total}\"."
    if name == "TypeError" and "not callable" in msg:
        explain = "You put brackets after something that isn't a function. Is a comma missing, or did a variable reuse a function's name?"
    if name == "NameError" and ("'true'" in msg or "'false'" in msg):
        explain = "In Python, True and False start with a capital letter."
    return {"type": name, "message": msg, "line": line, "source": source, "explain": explain}

def _show(v):
    if isinstance(v, str):
        return '"' + v + '"'
    if isinstance(v, float):
        r = repr(v)
        return r
    if v is None:
        return "None (nothing was returned. Did you forget return?)"
    return repr(v)

def _kind(v):
    if isinstance(v, bool): return "True/False"
    if isinstance(v, (int, float)): return "a number"
    if isinstance(v, str): return "text (a string)"
    if isinstance(v, list): return "a list"
    if isinstance(v, dict): return "a dictionary"
    if v is None: return "nothing (None)"
    return type(v).__name__

def _same(a, b):
    if isinstance(a, bool) != isinstance(b, bool):
        return False
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_same(a[k], b[k]) for k in a)
    return a == b

def _make_checks(ns, tee, results, code):
    def record(ok, message, tip=None):
        results.append({"ok": bool(ok), "message": message, "tip": tip if not ok else None})

    def check(expr, expected, tip=None, label=None):
        label = label or expr
        try:
            actual = eval(expr, ns)
        except Exception as e:
            f = _friendly(e, code)
            record(False, f"Running {label} caused a {f['type']}: {f['message']}", tip or f["explain"])
            return
        if _same(actual, expected):
            record(True, f"{label} gave {_show(actual)}")
        else:
            extra = ""
            if _kind(actual) != _kind(expected):
                extra = f" We expected {_kind(expected)} but got {_kind(actual)}."
            record(False, f"{label} gave {_show(actual)}, we expected {_show(expected)}.{extra}", tip)

    def check_true(expr, fail_message, pass_message=None, tip=None):
        try:
            ok = bool(eval(expr, ns))
        except Exception as e:
            f = _friendly(e, code)
            record(False, f"{fail_message} ({f['type']}: {f['message']})", tip or f["explain"])
            return
        record(ok, (pass_message or fail_message) if ok else fail_message, tip)

    def check_output(expected, tip=None, exact=False):
        out = tee.text()
        lines = [l.rstrip() for l in out.strip().splitlines()]
        want = [l.rstrip() for l in str(expected).strip().splitlines()]
        if exact:
            ok = lines == want
        else:
            joined = "\n".join(lines)
            ok = "\n".join(want) in joined
        if ok:
            record(True, f"Your output included: {expected!s}")
        elif not out.strip():
            record(False, f"Nothing was printed. We expected to see: {expected!s}", tip or "Use print(...) to show something in the output panel.")
        else:
            shown = out.strip()
            if len(shown) > 200:
                shown = shown[:200] + "..."
            record(False, f"Your output was: {shown}  We expected to see: {expected!s}", tip)

    def check_defined(name, tip=None):
        ok = name in ns
        record(ok, f"{name} exists" if ok else f"We couldn't find {name}. Check the spelling, and that you didn't delete it.", tip)

    return {"check": check, "check_true": check_true, "check_output": check_output, "check_defined": check_defined, "record": record}

def _no_input(prompt=""):
    raise RuntimeError("input() can't ask questions here. Set the value directly instead, e.g. name = \"Sam\".")

def run(code, tests, driver, emit):
    tee = _Tee(emit)
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = tee
    sys.stderr = tee
    ns = {"__name__": "__main__", "input": _no_input}
    result = {"ok": True, "error": None, "tests": [], "out": None}
    try:
        try:
            exec(compile(code, "your_code.py", "exec"), ns)
        except BaseException as e:
            result["ok"] = False
            result["error"] = _friendly(e, code)
        if driver and result["ok"]:
            try:
                exec(compile(driver, "driver.py", "exec"), ns)
                out = ns.get("_ccs_out")
                result["out"] = json.dumps(out, default=str)
            except BaseException as e:
                result["ok"] = False
                result["error"] = _friendly(e, code)
        if tests:
            checks = _make_checks(ns, tee, result["tests"], code)
            tns = dict(ns)
            tns.update(checks)
            tns["_ccs_ran_ok"] = result["ok"]
            if not result["ok"]:
                checks["record"](False, "Your code stopped with an error before the checks could run.", "Fix the error shown above, then check again.")
            else:
                try:
                    exec(compile(tests, "checks.py", "exec"), tns)
                except BaseException as e:
                    checks["record"](False, f"A check couldn't run: {type(e).__name__}: {e}", None)
    finally:
        sys.stdout, sys.stderr = old_out, old_err
    result["stdout"] = tee.text()
    return json.dumps(result)
`;

self.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type === "init") {
    try {
      self.postMessage({ type: "status", text: "Downloading Python (about 8 MB, only the first time)…" });
      importScripts(msg.indexURL + "pyodide.js");
      pyodide = await self.loadPyodide({ indexURL: msg.indexURL });
      self.postMessage({ type: "status", text: "Warming up…" });
      pyodide.setStdin({ error: true });
      const mod = pyodide.runPython(HARNESS + "\nrun");
      runner = mod;
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "fatal", error: String(err && err.message ? err.message : err) });
    }
    return;
  }
  if (msg.type === "run") {
    const emit = (text) => self.postMessage({ type: "stdout", id: msg.id, text });
    try {
      const json = runner(msg.code || "", msg.tests || "", msg.driver || "", emit);
      self.postMessage({ type: "result", id: msg.id, result: JSON.parse(json) });
    } catch (err) {
      self.postMessage({
        type: "result",
        id: msg.id,
        result: { ok: false, error: { type: "InternalError", message: String(err), explain: "The Python runner itself had a problem. Try Reset Python." }, tests: [], stdout: "" },
      });
    }
  }
};
