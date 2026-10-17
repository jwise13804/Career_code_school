---
title: Testing the capstone
minutes: 15
status: planned
summary: Make the capstone trustworthy: tests for every rule, every failure case and every retry.
goals:
  - Test idempotency, the ledger and disputes end to end
  - Use fixtures for a clean database each time
  - Run the tests in CI on every push
---

## What this lesson covers

- Happy path, edge cases and failure cases for payments
- Retry tests: same key, different key, same key with a different body
- Dispute journeys, including the illegal ones
- Watching CI go green on GitHub

```analogy
This is your quality assurance checklist. If a mystery shopper tried every awkward thing a customer might do, would the system hold up?
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- Run `pytest -v` on the capstone starter and read every test name: together they read like a spec.
- Add two tests of your own for a feature you add.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
