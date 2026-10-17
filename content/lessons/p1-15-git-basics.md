---
title: "Git: case notes for your code"
minutes: 14
summary: Git keeps a full history of your work, so you can always see what changed and go back. Every software team in the world uses it.
goals:
  - Explain what version control is and why teams depend on it
  - Use the core loop of git status, add and commit
  - Read a project's history with git log
---

## The case history

Every customer case has a history: who did what, when, and why. If something goes wrong, you can scroll back and see exactly where. Imagine doing your job without that, with just the latest version and no idea how it got there.

That's what writing code without **[[git]]** is like. Git is a **version control** system: it records snapshots of your project over time, so you can:

- see **what changed**, when and why,
- **go back** to any earlier version if you break something,
- **work with others** without overwriting each other's work.

## Four words

| Word | Meaning | Case-history version |
| --- | --- | --- |
| **[[repository]]** (repo) | A project folder that Git is tracking | The case file |
| **[[commit]]** | A saved snapshot, with a message saying what changed | A case note: what you did and why |
| **staging** | Choosing which changes go into the next commit | Ticking which documents to attach before saving the note |
| **log** | The list of all commits | The full case history |

## The everyday loop

You'll repeat this all day, every day:

1. **Change** some files.
2. `git status` to see what changed.
3. `git add <file>` to stage the changes you want.
4. `git commit -m "Message"` to save the snapshot.

```text
$ git add totals.py
$ git commit -m "Ignore declined transactions in total"
```

## Good commit messages

A commit message is a case note for your future self and your team. Compare:

- ❌ `stuff`, `fix`, `asdfgh`
- ✅ `Ignore declined transactions in statement total`
- ✅ `Show refunds as negative amounts`

Write it to finish the sentence *"If applied, this commit will…"*. Keep it short: one line is fine.

```analogy
"Called customer" is a useless case note. "Called customer, confirmed card received, unblocked it" is a good one. Same with commits.
```

## Try it

The terminal is where developers type commands. Git needs to be installed on a computer to run for real, so here's a practice terminal with scripted answers. It understands real Git commands, and it explains common mistakes kindly.

```terminal
git-basics
```

```quiz
p1-15-git
```

## Practice this week

```practice
- Install Git on your own computer from [git-scm.com/downloads](https://git-scm.com/downloads). (On a Mac you may already have it: open Terminal and type `git --version`.)
- Read chapter 1 of the free [Pro Git book](https://git-scm.com/book/en/v2), especially "What is Git?". It's the official Git book, and it's free online.
- Then do the real thing: make a folder, put your `totals.py` from the mini project in it, and run `git init`, `git add`, `git commit` for real.
```
