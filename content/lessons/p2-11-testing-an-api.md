---
title: Testing an API
minutes: 15
status: planned
summary: Test whole endpoints, not just functions, using FastAPI's TestClient and pytest fixtures.
goals:
  - Send requests to your API in tests with TestClient
  - Use fixtures for a fresh database per test
  - Test failure cases (404, 409, 422), not just the happy path
---

## What this lesson covers

- `TestClient(app)` and `client.get(...)`
- pytest fixtures and `tmp_path` for an isolated database
- Asserting status codes and JSON bodies
- The happy path vs edge cases vs failure cases

```analogy
It's mystery shopping the whole journey, not just checking one form: walk in, ask, get an answer, and check it's the right one.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- FastAPI tutorial: [Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- pytest docs: [How to use fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- Microsoft Learn: [Advanced testing with pytest](https://learn.microsoft.com/training/modules/python-advanced-pytest/)
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
