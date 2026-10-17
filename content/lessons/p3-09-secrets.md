---
title: Keeping secrets out of code
minutes: 14
status: planned
summary: API keys and passwords must never be written in code or pushed to GitHub. Here's where they go instead.
goals:
  - Explain why secrets in code are dangerous
  - Use environment variables and .env files (ignored by Git)
  - Store secrets for CI in GitHub Actions secrets
---

## What this lesson covers

- What counts as a secret: keys, passwords, tokens, connection strings
- Environment variables and `os.environ`
- `.env` files plus `.gitignore`
- GitHub Actions secrets, and what to do if you leak one (rotate it, immediately)

```analogy
You'd never write a customer's password on a sticky note on your monitor. Putting an API key in code is the same, except the sticky note is public on the internet.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- OWASP: [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html). Read the introduction.
- Microsoft Learn: [Learn continuous integration with GitHub Actions](https://learn.microsoft.com/training/modules/learn-continuous-integration-github-actions/) has units on creating and using encrypted secrets.
- Check the capstone's `.gitignore`: it already excludes `.env`.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
