---
title: Logs and monitoring
minutes: 12
status: planned
summary: When something breaks at 2am, logs are how you find out what happened. Learn to write useful ones, and never log secrets or card data.
goals:
  - Use Python's logging module with levels
  - Write log messages that help future you
  - Keep sensitive data out of logs
---

## What this lesson covers

- `logging.info`, `warning` and `error`, and when to use each
- Useful messages: include IDs, not personal data
- Structured (JSON) logs and request IDs
- Monitoring and alerts: knowing before customers do

```analogy
Logs are case notes written by your code. Good ones let someone else pick up the incident without asking you a single question.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- Python docs: [Logging HOWTO](https://docs.python.org/3/howto/logging.html). The basic tutorial section is enough.
- Add a log line to your API for every payment, with the payment ID but no card number.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
