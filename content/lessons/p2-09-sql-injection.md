---
title: Safe queries and SQL injection
minutes: 12
status: planned
summary: One of the most famous security bugs, and the one-line habit that prevents it: parameterised queries.
goals:
  - Explain how SQL injection works
  - Always use placeholders (`?`) for values in SQL
  - Recognise unsafe code in a code review
---

## What this lesson covers

- Why building SQL with f-strings is dangerous
- The classic `' OR '1'='1` example
- Parameterised queries: `conn.execute("... WHERE id = ?", (customer_id,))`
- Where else untrusted input sneaks in

```analogy
It's social engineering for databases: someone sneaks an instruction into a field that should only hold data, like a caller reading out a script that tricks an agent into skipping security.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- OWASP: [SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- Search the capstone code for `?`. Every query uses placeholders.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
