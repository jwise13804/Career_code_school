---
title: Methods and status codes
minutes: 14
status: planned
summary: Go deeper into HTTP: the five methods you'll meet, the status codes worth knowing by heart, and how to choose the right one.
goals:
  - Use GET, POST, PUT, PATCH and DELETE correctly
  - Choose between 400, 404, 409 and 422
  - Explain why GET must never change anything
---

## What this lesson covers

- The five common methods, and which are safe to repeat
- 2xx, 4xx and 5xx in detail: 200 vs 201 vs 204, and 400 vs 422
- Choosing the right code for a declined payment, a duplicate request and a missing record
- Headers you'll meet every day: `Content-Type`, `Authorization`, `Location`

```analogy
Status codes are your decline-code cheat sheet. Picking the right one is like choosing the right outcome code on a case: it tells the next person exactly what happened.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- MDN: [HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) and [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- Use the Mini Bank API on the [Practice bench](#/practice) to trigger every status code it can return: 200, 201, 400, 401, 402, 403, 404, 405, 409, 422 and 500.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
