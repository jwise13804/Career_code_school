// Scripted terminal simulator for Git, Docker and pytest.
// Scenarios live in content/terminal/<id>.json. Each step says which commands
// are accepted (regular expressions), what the "computer" prints back, and
// friendly explanations for common mistakes.
import { h, announce } from "../core/dom.js";
import { renderMarkdown, renderInline } from "../core/markdown.js";
import { fetchJSON } from "../core/content.js";
import { isChallengeDone, setChallengeDone } from "../core/storage.js";
import { simBadge } from "./api-sim.js";

const KNOWN = ["git", "docker", "pytest", "python", "python3", "pip", "ls", "cd", "cat", "pwd", "clear", "help", "hint", "echo", "mkdir"];

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const normalise = (cmd) => cmd.trim().replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

function fill(template, match) {
  return (template || "").replace(/\$(\d)/g, (_, n) => match?.[Number(n)] ?? "");
}

export async function mountTerminal(slot, config, ctx) {
  const sc = await fetchJSON(`terminal/${config.id}.json`);
  const doneKey = `terminal/${sc.id}`;
  let step = 0;
  const history = [];
  let historyPos = 0;

  const log = h("div", { class: "terminal-log", role: "log", "aria-live": "polite", "aria-label": "Terminal output" });
  const input = h("input", { class: "terminal-input", id: `${sc.id}-input`, autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false", enterkeyhint: "send" });
  const goal = h("div", { class: "goal-box" });
  const hintBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Hint");
  const restartBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "↺ Start again");

  const el = h(
    "section",
    { class: "card terminal-card", "aria-labelledby": `${sc.id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "Terminal"), simBadge()),
    h("h3", { id: `${sc.id}-title`, class: "card-title" }, sc.title),
    sc.intro ? h("div", { class: "prose", html: renderMarkdown(sc.intro) }) : null,
    h(
      "p",
      { class: "sim-note" },
      "This is a practice terminal with scripted answers. It understands the commands for this exercise, and it explains mistakes instead of just failing. ",
      sc.docs ? h("a", { href: sc.docs.url, target: "_blank", rel: "noopener noreferrer" }, `${sc.docs.label} ↗`) : null,
    ),
    goal,
    h(
      "div",
      { class: "terminal" },
      log,
      h("form", { class: "terminal-form", onsubmit: (e) => (e.preventDefault(), submit()) }, h("label", { for: `${sc.id}-input` }, h("span", { "aria-hidden": "true" }, `${sc.prompt || "~"} $`), h("span", { class: "sr-only" }, "Type a command")), input),
    ),
    h("div", { class: "toolbar" }, hintBtn, restartBtn),
  );
  slot.replaceWith(el);

  const line = (text, cls = "") => {
    log.append(h("div", { class: `terminal-line ${cls}` }, text));
    log.scrollTop = log.scrollHeight;
  };
  const explain = (md) => {
    log.append(h("div", { class: "terminal-explain", html: renderMarkdown(md) }));
    log.scrollTop = log.scrollHeight;
  };

  function showGoal() {
    if (step >= sc.steps.length) {
      goal.replaceChildren(h("p", {}, h("strong", {}, "All done! "), h("span", { html: renderInline(sc.finish || "You completed every step.") })));
      return;
    }
    goal.replaceChildren(
      h("p", { class: "small muted" }, `Step ${step + 1} of ${sc.steps.length}`),
      h("p", { html: renderInline(sc.steps[step].goal) }),
    );
  }

  function restart() {
    step = 0;
    log.replaceChildren();
    if (sc.welcome) line(sc.welcome, "muted");
    showGoal();
  }

  function submit() {
    const raw = input.value;
    const cmd = normalise(raw);
    input.value = "";
    if (!cmd) return;
    history.push(cmd);
    historyPos = history.length;
    line(cmd, "terminal-cmd");
    ctx.setStuck({ activity: `${sc.title}: ${sc.steps[step]?.goal || "finished"}`, code: history.slice(-6).join("\n"), language: "bash", error: null });

    if (cmd === "clear") return log.replaceChildren();
    if (cmd === "help" || cmd === "hint") return explain(step < sc.steps.length ? `**Goal:** ${sc.steps[step].goal}\n\n**Hint:** ${sc.steps[step].hint}` : "You've finished. Press Start again to repeat it.");

    const current = sc.steps[step];
    if (current) {
      for (const pattern of current.accept) {
        const m = cmd.match(new RegExp(pattern));
        if (m) {
          if (current.output) line(fill(current.output, m));
          if (current.explain) explain(fill(current.explain, m));
          step += 1;
          showGoal();
          if (step >= sc.steps.length) {
            setChallengeDone(doneKey);
            ctx.refresh();
            announce("Terminal exercise complete");
          } else announce(`Step ${step} done.`);
          return;
        }
      }
      for (const mistake of current.mistakes || []) {
        const m = cmd.match(new RegExp(mistake.match));
        if (m) {
          if (mistake.output) line(fill(mistake.output, m), "terminal-error");
          explain(fill(mistake.say, m));
          return;
        }
      }
      for (const extra of [...(current.extra || []), ...(sc.always || [])]) {
        const m = cmd.match(new RegExp(extra.match));
        if (m) {
          if (extra.output) line(fill(extra.output, m));
          if (extra.explain) explain(fill(extra.explain, m));
          return;
        }
      }
    } else {
      for (const extra of sc.always || []) {
        const m = cmd.match(new RegExp(extra.match));
        if (m) return line(fill(extra.output, m));
      }
    }

    // Generic, friendly diagnosis.
    const first = cmd.split(" ")[0];
    if (/^[A-Z]/.test(first) && KNOWN.includes(first.toLowerCase())) {
      line(`bash: ${first}: command not found`, "terminal-error");
      return explain(`Commands are case-sensitive. Try \`${first.toLowerCase()}\` with a lower-case letter.`);
    }
    if (cmd.startsWith("$ ")) return explain("No need to type the `$`. It's just the terminal's way of saying \"ready\". Type the command after it.");
    if (!KNOWN.includes(first)) {
      const near = KNOWN.map((k) => [k, distance(first, k)]).sort((a, b) => a[1] - b[1])[0];
      line(`bash: ${first}: command not found`, "terminal-error");
      return explain(near && near[1] <= 2 ? `Did you mean \`${near[0]}\`? A small typo is enough to confuse a terminal.` : "This practice terminal doesn't know that command. Type `hint` for help with this step.");
    }
    if (!current) return line("(You've finished this exercise. Press Start again to repeat it.)", "muted");
    line(current.fallback || "That command works, but it isn't the one this step needs.", "muted");
    explain(`**Goal:** ${current.goal}\n\nType \`hint\` if you'd like a nudge.`);
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && historyPos > 0) {
      historyPos -= 1;
      input.value = history[historyPos];
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      historyPos = Math.min(history.length, historyPos + 1);
      input.value = history[historyPos] || "";
      e.preventDefault();
    }
  });
  hintBtn.addEventListener("click", () => {
    if (step < sc.steps.length) explain(`**Hint:** ${sc.steps[step].hint}`);
    input.focus();
  });
  restartBtn.addEventListener("click", restart);
  restart();
  if (isChallengeDone(doneKey)) goal.prepend(h("p", { class: "badge badge-done" }, "✓ Completed before"));
  ctx.registerTask({ id: doneKey, label: sc.title, kind: "terminal", isDone: () => isChallengeDone(doneKey) });
}
