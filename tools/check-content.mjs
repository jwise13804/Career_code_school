// Validates content/ before deploying: every lesson in course.json has a file,
// titles match, quizzes and terminal scenarios referenced by lessons exist and
// parse, glossary links point at real terms. Run with: npm run check
import { readFileSync, existsSync } from "node:fs";

const errors = [];
const read = (p) => readFileSync(p, "utf8");
const json = (p) => {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    errors.push(`${p}: invalid JSON (${e.message})`);
    return null;
  }
};

const course = json("content/course.json");
const glossary = json("content/glossary.json") || [];
const slugs = new Set(glossary.map((t) => t.slug));
const ids = new Set();

for (const t of glossary) if (!t.slug || !t.term || !t.short) errors.push(`glossary: entry missing slug/term/short: ${JSON.stringify(t).slice(0, 80)}`);

function checkMarkdown(file, md) {
  for (const m of md.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)) {
    if (!slugs.has(m[1])) errors.push(`${file}: glossary link [[${m[1]}]] has no glossary entry`);
  }
  const fences = [...md.matchAll(/^```([\w-]+)[^\n]*\n([\s\S]*?)^```\s*$/gm)];
  for (const [, kind, body] of fences) {
    if (kind === "quiz") {
      const q = `content/quizzes/${body.trim()}.json`;
      if (!existsSync(q)) errors.push(`${file}: quiz ${body.trim()} not found`);
      else {
        const quiz = json(q);
        quiz?.questions?.forEach((qq) => {
          if (!qq.id || !qq.prompt) errors.push(`${q}: question missing id or prompt`);
          if ((qq.type || "mcq") === "mcq" && !(qq.answer in (qq.options || []))) errors.push(`${q} ${qq.id}: answer index out of range`);
        });
      }
    }
    if (kind === "terminal" && !existsSync(`content/terminal/${body.trim()}.json`)) errors.push(`${file}: terminal scenario ${body.trim()} not found`);
    if (["sql", "api", "video", "download"].includes(kind)) {
      try {
        JSON.parse(body);
      } catch (e) {
        errors.push(`${file}: \`\`\`${kind} block is not valid JSON (${e.message})`);
      }
    }
  }
}

for (const phase of course?.phases || []) {
  for (const unit of phase.units) {
    for (const lesson of unit.lessons) {
      if (ids.has(lesson.id)) errors.push(`course.json: duplicate lesson id ${lesson.id}`);
      ids.add(lesson.id);
      const file = `content/lessons/${lesson.id}.md`;
      if (!existsSync(file)) {
        errors.push(`${file}: missing (listed in course.json)`);
        continue;
      }
      const md = read(file);
      const title = md.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2");
      if (title !== lesson.title) errors.push(`${file}: title "${title}" doesn't match course.json "${lesson.title}"`);
      checkMarkdown(file, md);
    }
  }
}
for (const t of glossary) if (t.lesson && !ids.has(t.lesson)) errors.push(`glossary ${t.slug}: lesson ${t.lesson} doesn't exist`);
if (existsSync("content/pages/practice.md")) checkMarkdown("content/pages/practice.md", read("content/pages/practice.md"));

if (errors.length) {
  console.error(`Content check found ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content OK: ${ids.size} lessons, ${glossary.length} glossary terms.`);
