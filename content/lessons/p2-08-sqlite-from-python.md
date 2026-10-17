---
title: Using a database from Python
minutes: 15
status: planned
summary: Connect your API to a real database so data survives restarts, using SQLite, which is built into Python.
goals:
  - Connect to SQLite from Python
  - Run SELECT and INSERT from code
  - Turn database rows into JSON responses
---

## What this lesson covers

- `sqlite3.connect()`, cursors and `commit()`
- Creating tables with code
- Reading rows as dictionaries with `row_factory`
- Why the handler lab forgot your POSTs, and how a database fixes it

```analogy
Keeping data in a Python list is like writing case notes on a whiteboard. A database is the case system: it's still there tomorrow.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- Python docs: [sqlite3 tutorial](https://docs.python.org/3/library/sqlite3.html#tutorial)
- FastAPI tutorial: [SQL (Relational) Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/). Read it for the ideas; it uses a library called SQLModel.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
