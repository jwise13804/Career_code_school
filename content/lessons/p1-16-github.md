---
title: "GitHub: sharing your work"
minutes: 14
summary: GitHub is where your code lives online, where teams review each other's changes, and where employers will look at your work.
goals:
  - Explain the difference between Git and GitHub
  - Describe branches and pull requests
  - Push a branch to GitHub (in the practice terminal) and know the steps to do it for real
---

## Git vs GitHub

- **Git** is the tool on your computer that records history.
- **[[github]]** is a website that stores Git repositories online, so you can back them up, share them and work on them together.

It's like the difference between a document and a shared drive. You could write case notes in a notebook, but storing them in the team's shared system means everyone can see them, and nothing's lost if your laptop dies.

GitHub matters for your career too: **it's your portfolio**. When you apply for junior roles, employers will look at your GitHub profile. By the end of this course, your card payments API will be there.

## Branches: drafts that don't touch the real thing

`main` is the official version of the code. You don't edit it directly. Instead you make a **[[branch]]**: a separate line of work where you can change things safely.

```text
main:          ●───●───●──────────●   (merged)
                        \        /
add-refunds:             ●───●───
```

When your change is ready, you ask for it to be merged back into `main`.

## Pull requests: the second approver

That "ask" is a **[[pull-request]]** (PR). On GitHub, it shows exactly what you changed, line by line, and lets teammates comment and approve it before it's merged.

```analogy
A pull request is a refund over your approval limit: you prepare it, and a colleague checks and approves it before it's paid. Teams review every change this way, and it's one of the main ways juniors learn on the job.
```

## Push and pull

- `git push` sends your commits **up** to GitHub.
- `git pull` brings other people's commits **down** to your computer.
- `origin` is the usual nickname for "my repository on GitHub".

## Try it

```terminal
github-push
```

## Doing it for real (about 15 minutes)

1. Create a free account at [github.com](https://github.com). Choose a professional username: it'll appear on your CV.
2. Click **New repository**, call it `statement-totals`, tick **Add a README**, and create it.
3. Either upload your `totals.py` in the browser (**Add file → Upload files**; no terminal needed), or use the commands you just practised.
4. Edit the README: two sentences about what the code does. You've just published your first project.

```tip
Don't worry about your GitHub looking empty at first. Everyone starts there. A few small, well-explained projects beat lots of half-finished ones.
```

```quiz
p1-16-github
```

## Practice this week

```practice
- GitHub's own [Hello World guide](https://docs.github.com/en/get-started/start-your-journey/hello-world) walks you through branches and pull requests in the browser, with no installs.
- Microsoft Learn's free [Introduction to GitHub](https://learn.microsoft.com/training/modules/introduction-to-github/) module is a good second explanation.
- Then celebrate: **you've finished Phase 1.** Python, SQL and Git are the foundations of every backend job.
```
