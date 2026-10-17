---
title: Your portfolio on GitHub
minutes: 15
summary: Turn your capstone into a portfolio that does the talking for you, with a clear README, a tidy history and a profile a hiring manager can understand in two minutes.
goals:
  - Know what hiring managers look at on a junior's GitHub
  - Write a README that explains your project and your thinking
  - Put your capstone project files on your own GitHub
---

## What they actually look at

A hiring manager for a junior role will typically spend a couple of minutes on your GitHub. They are not looking for perfect, clever code. They're looking for signs that you:

1. **Finish things.** One complete, working project beats five half-done ones.
2. **Explain your thinking.** A README that says *why*, not just *what*.
3. **Test your work.** A `tests/` folder and a green CI badge say a lot.
4. **Work in small steps.** A history of clear commits ("Add idempotency keys to payments"), not one giant "final version" commit.
5. **Understand the domain.** For a payments company, a project about payments, built by someone who's handled real disputes, is very memorable.

```analogy
It's like a good case write-up: what happened, what you did, why, and the outcome. Clear, honest and easy to follow. You already know how to do that.
```

## Your capstone, step by step

Your capstone, the **mini card payments API**, brings the whole course together:

| Feature | Where you learned it |
| --- | --- |
| Endpoints with FastAPI | Phase 2 |
| SQLite tables and SQL | Phase 1 and Phase 2 |
| Idempotency keys | Phase 4: idempotency lesson |
| Double-entry ledger | Phase 4: ledger lesson |
| Dispute state machine | Phase 4: dispute lesson |
| pytest tests | Phase 2 |
| Dockerfile | Phase 3 |
| GitHub Actions CI | Phase 3 |

The starter project in the next lesson's download has all of these working, with 17 passing tests. **Make it yours**: read every file, change things, break things and fix them, and add at least one feature of your own (refunds, expiring keys or an API key check are all good choices). In an interview you must be able to explain every line, so don't keep anything you don't understand.

## The README

Your README is the front page of your project. The template in the download has these sections. Fill them in honestly:

- **What it is**, in one sentence.
- **Why you built it.** Your support background is a strength here, so say it.
- **Design decisions.** Idempotency, pence, the ledger, the state machine, *and why*.
- **How to run it and test it**: copy-pasteable commands.
- **What you'd do next** and **what you learned.**

## Your profile

- A **profile README** (a special repository named exactly like your username) with three or four lines: who you are, what you're learning, a link to your capstone.
- **Pin** your best two to four repositories: the capstone, the Phase 2 customers API, and `statement-totals`.
- A clear photo or avatar, your location (e.g. *Leeds, UK*), and a link to your LinkedIn.

## Putting it on GitHub

You'll download your files in the next lesson. Then, either:

**In the browser (no terminal):**

1. On GitHub, click **New repository**. Name it `card-payments-api`, make it **Public**, and don't add a README (you have one).
2. Click **uploading an existing file**, and drag in the *contents* of the unzipped folder.
3. Write a commit message like `Initial commit of card payments API` and commit.
4. Note: the browser can't upload the hidden `.github` folder easily. Create it with **Add file → Create new file**, and type the name `.github/workflows/ci.yml`, then paste in the CI file's contents.

**Or with the terminal (the way you practised):**

```text
cd card-payments-api
git init
git add .
git commit -m "Initial commit of card payments API"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/card-payments-api.git
git push -u origin main
```

Then open the **Actions** tab and watch your tests run. A green tick is your first CI badge.

```quiz
p4-10-portfolio
```

## Practice this week

```practice
- Create your profile README using GitHub's guide to [managing your profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme).
- Look at two or three other junior developers' GitHub profiles. What makes you want to click on a project?
- Ask a friend (no coding knowledge needed) to read your README and tell you what the project does. If they can, it's good.
```
