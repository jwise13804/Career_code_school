---
title: Practice bench
summary: Free-play versions of the course's tools. Nothing here is marked or counted, so experiment as much as you like.
---

## Python scratchpad

Try out anything from a lesson. Your code is saved in this browser.

```lab
id: bench-python
title: Python scratchpad
--- task
Change anything and press **Run**. If it goes wrong, the error box explains what happened in plain English.
--- starter
transactions = [12.50, -3.20, 45.00, 9.99]

total = 0
for amount in transactions:
    total = total + amount

print(f"Statement total: £{total:.2f}")
```

## SQL playground

The same sample bank database the SQL lessons use: customers, cards, transactions and disputes. Press **Ctrl+Enter** (or **Cmd+Enter** on a Mac) to run a query.

```sql-lab
{
  "id": "bench-sql",
  "title": "Explore the bank database",
  "starter": "SELECT merchant, COUNT(*) AS payments, SUM(amount) AS total\nFROM transactions\nWHERE status = 'approved'\nGROUP BY merchant\nORDER BY total DESC;"
}
```

## Mini Bank API

Send any request you like. `GET /` lists every endpoint. `GET /crash` breaks on purpose so you can see a 500.

```api
{
  "id": "bench-api",
  "title": "Mini Bank API",
  "presets": [
    { "label": "List customers", "method": "GET", "path": "/customers" },
    { "label": "Balance", "method": "GET", "path": "/accounts/1/balance" },
    { "label": "Pay £4.20", "method": "POST", "path": "/payments", "headers": { "Authorization": "Bearer demo-key-123", "Idempotency-Key": "order-001" }, "body": { "card_id": 1, "amount": 4.2, "merchant": "Greggs" } },
    { "label": "Server error", "method": "GET", "path": "/crash" }
  ]
}
```

## The other simulators

These live inside their lessons, where they make the most sense:

- **Git terminal**: [Git: case notes for your code](#/lesson/p1-15-git-basics) and [GitHub: sharing your work](#/lesson/p1-16-github)
- **pytest terminal**: [pytest: checks that run themselves](#/lesson/p2-10-pytest-basics)
- **Request handler lab**: [Write your first request handler](#/lesson/p2-04-write-a-handler)
- **Docker terminal**: [Docker: a sealed kit for your app](#/lesson/p3-01-docker-concepts)
- **CI pipeline**: [GitHub Actions: tests on every push](#/lesson/p3-04-github-actions)
- **Idempotency lab**: [Idempotency keys: charge once](#/lesson/p4-05-idempotency)
- **Dispute workflow builder**: [The dispute workflow](#/lesson/p4-07-dispute-workflow)
