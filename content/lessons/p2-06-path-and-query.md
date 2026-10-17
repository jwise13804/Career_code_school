---
title: Path and query parameters
minutes: 14
status: planned
summary: Make endpoints that take input from the URL: /customers/3 and /transactions?status=declined.
goals:
  - Use path parameters for IDs
  - Use query parameters for filters
  - Let FastAPI validate types for you
---

## What this lesson covers

- Path parameters: `/customers/{customer_id}`
- Query parameters: `?city=Leeds&limit=10`
- Type hints (`customer_id: int`) and automatic 422 errors
- Returning 404 with `HTTPException`

```analogy
The path picks *which* record (the account number); query parameters are the filters on your case queue.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- FastAPI tutorial: [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/) and [Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/)
- Add `GET /transactions?status=declined` to your practice app.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
