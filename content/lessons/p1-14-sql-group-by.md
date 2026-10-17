---
title: "GROUP BY: totals and counts"
minutes: 15
summary: Turn thousands of rows into a short summary, such as spend per merchant or declines per status. This is how every dashboard and report is built.
goals:
  - Use COUNT, SUM and AVG
  - Group rows with GROUP BY
  - Filter groups with HAVING
---

## From rows to answers

Managers rarely ask "show me every transaction". They ask **"how many?"** and **"how much?"**: declines this week, refunds by merchant, average spend. SQL answers these with **aggregate** functions:

| Function | Gives you |
| --- | --- |
| `COUNT(*)` | how many rows |
| `SUM(amount)` | the total |
| `AVG(amount)` | the average |
| `MIN(amount)` / `MAX(amount)` | smallest / biggest |

```sql
SELECT COUNT(*) FROM transactions;                        -- 85
SELECT SUM(amount) FROM transactions WHERE status = 'approved';
```

## GROUP BY: one answer per group

`GROUP BY` splits the rows into piles and gives one answer **per pile**:

```sql
SELECT status, COUNT(*)
FROM transactions
GROUP BY status;
```

| status | COUNT(*) |
| --- | --- |
| approved | 56 |
| declined | 21 |
| refunded | 8 |

```analogy
It's sorting the post into piles by department, then counting each pile. `GROUP BY status` makes the piles; `COUNT(*)` counts each one.
```

You can name a result column with `AS`, then sort by it:

```sql
SELECT merchant, SUM(amount) AS total
FROM transactions
WHERE status = 'approved'
GROUP BY merchant
ORDER BY total DESC;
```

## WHERE vs HAVING

- `WHERE` filters **rows**, *before* grouping.
- `HAVING` filters **groups**, *after* grouping.

```sql
-- customers with more than one card
SELECT customer_id, COUNT(*)
FROM cards
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

## Your turn

```sql-lab
{
  "id": "p1-14-sql",
  "title": "Summaries",
  "challenges": [
    { "id": "count-all", "prompt": "How many transactions are there in total? Show a single number.", "solution": "SELECT COUNT(*) FROM transactions;", "hint": "`SELECT COUNT(*) FROM transactions;`" },
    { "id": "by-status", "prompt": "Show each transaction **status** and **how many** transactions have it.", "solution": "SELECT status, COUNT(*) FROM transactions GROUP BY status;", "hint": "`GROUP BY status`, with `status, COUNT(*)` after SELECT." },
    { "id": "spend-by-merchant", "prompt": "Show each **merchant** and the **total amount** of its **approved** transactions, **biggest total first**.", "solution": "SELECT merchant, SUM(amount) AS total FROM transactions WHERE status = 'approved' GROUP BY merchant ORDER BY total DESC;", "ordered": true, "hint": "WHERE comes before GROUP BY; ORDER BY comes after. Name the sum with `AS total` so you can sort by it." },
    { "id": "multi-card", "prompt": "Show the **name** of each customer with **more than one card**, and how many cards they have.", "solution": "SELECT customers.name, COUNT(*) FROM cards JOIN customers ON cards.customer_id = customers.id GROUP BY customers.name HAVING COUNT(*) > 1;", "hint": "Join cards to customers, `GROUP BY customers.name`, then `HAVING COUNT(*) > 1`." }
  ]
}
```

```tip
You now know enough SQL to be useful in almost any operations team: SELECT, WHERE, JOIN and GROUP BY are most of what people use day to day.
```

```quiz
p1-14-sql
```

## Practice this week

```practice
- SQLBolt [Lesson 10: Queries with aggregates](https://sqlbolt.com/lesson/select_queries_with_aggregates) and [Lesson 11](https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2).
- On the [Practice bench](#/practice): which **category** has the most declined transactions?
```
