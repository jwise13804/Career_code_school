"""Checks every Python lab in content/: the solution must pass all its checks,
and the starter code must fail at least one (otherwise the lab is pointless).

It uses the exact same test harness as the browser (copied out of
assets/js/workers/python-worker.js), running in normal CPython.

    python3 tools/verify-labs.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
worker = (ROOT / "assets/js/workers/python-worker.js").read_text()
harness = re.search(r"const HARNESS = String\.raw`(.*?)`;", worker, re.S).group(1)
env = {}
exec(harness, env)
run = env["run"]

SECTION_KINDS = {"lab", "handler", "idempotency", "ci", "dispute"}


def parse_sections(text):
    config, current, buf = {}, None, []

    def flush():
        if current is None:
            return
        value = "\n".join(buf).strip("\n").rstrip()
        if current == "hint":
            config.setdefault("hints", []).append(value)
        else:
            config[current] = value

    for line in text.split("\n"):
        m = re.match(r"^---\s+([\w-]+)\s*$", line)
        if m:
            flush()
            current, buf = m.group(1), []
        elif current:
            buf.append(line)
        else:
            kv = re.match(r"^([\w-]+):\s*(.*)$", line)
            if kv:
                config[kv.group(1)] = kv.group(2)
    flush()
    return config


def blocks(md):
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        m = re.match(r"^```([\w-]+)", lines[i])
        if m and m.group(1) in SECTION_KINDS:
            inner = []
            i += 1
            while i < len(lines) and not re.match(r"^```\s*$", lines[i]):
                inner.append(lines[i])
                i += 1
            yield m.group(1), parse_sections("\n".join(inner))
        i += 1


problems = 0
count = 0
files = sorted((ROOT / "content/lessons").glob("*.md")) + sorted((ROOT / "content/pages").glob("*.md"))
for path in files:
    for kind, cfg in blocks(path.read_text()):
        if not cfg.get("tests"):
            continue
        count += 1
        name = f"{path.name} [{kind}] {cfg.get('id', '?')}"
        sol = json.loads(run(cfg.get("solution", ""), cfg["tests"], "", lambda s: None))
        failed = [t for t in sol["tests"] if not t["ok"]]
        if not sol["ok"] or failed or not sol["tests"]:
            problems += 1
            print(f"FAIL {name}: solution does not pass")
            if sol["error"]:
                print("   error:", sol["error"])
            for t in failed:
                print("   -", t["message"])
        start = json.loads(run(cfg.get("starter", ""), cfg["tests"], "", lambda s: None))
        if start["tests"] and all(t["ok"] for t in start["tests"]):
            problems += 1
            print(f"FAIL {name}: starter code already passes every check")
        else:
            first_fail = next((t for t in start["tests"] if not t["ok"]), None)
            print(f"ok   {name}  (starter fails with: {first_fail['message'][:90] if first_fail else start['error']})")

print(f"\n{count} labs checked, {problems} problem(s).")
sys.exit(1 if problems else 0)
