---
title: "WHERE and ORDER BY: filtering"
minutes: 14
summary: Ask for only the rows you care about, like every blocked card or every transaction over £100, and sort the answer.
goals:
  - Filter rows with WHERE and comparisons
  - Combine conditions with AND / OR
  - Sort results with ORDER BY, and get the "top 5" with LIMIT
---

## WHERE: only the rows that match

`WHERE` is a filter, exactly like the filters on a case queue:

```sql
SELECT * FROM cards WHERE status = 'blocked';
```

- Text values go in **single quotes**: `'blocked'`.
- Numbers don't: `WHERE amount > 100`.
- In SQL, a single `=` *compares* (unlike Python, where it stores).

The comparisons are the ones you know from Python: `=`, `!=` (or `<>`), `<`, `>`, `<=`, `>=`.

## AND / OR

```sql
SELECT * FROM transactions
WHERE status = 'declined' AND amount > 50;
```

You can split a query over several lines to make it easier to read. SQL only cares about the `;` at the end.

## ORDER BY: sorting

```sql
SELECT merchant, amount FROM transactions
ORDER BY amount DESC;
```

- `ASC` (ascending, smallest first) is the default.
- `DESC` means descending, biggest first.
- Text sorts alphabetically.

## The "top 5" pattern

Sort, then limit:

```sql
SELECT merchant, amount FROM transactions
WHERE status = 'approved'
ORDER BY amount DESC
LIMIT 5;
```

The order of the parts matters: `SELECT … FROM … WHERE … ORDER BY … LIMIT …`.

```analogy
"Show me this customer's five biggest approved transactions last month" is a question you've asked someone in a back-office team. Now you can answer it yourself.
```

## Your turn

```sql-lab
{
  "id": "p1-12-sql",
  "title": "Filter and sort",
  "challenges": [
    { "id": "blocked", "prompt": "Show **every column** for cards whose status is **blocked**.", "solution": "SELECT * FROM cards WHERE status = 'blocked';", "hint": "`WHERE status = 'blocked'`, and don't forget the single quotes." },
    { "id": "over-100", "prompt": "Show the **merchant** and **amount** of every transaction **over £100**.", "solution": "SELECT merchant, amount FROM transactions WHERE amount > 100;", "hint": "Numbers don't need quotes: `WHERE amount > 100`." },
    { "id": "london", "prompt": "Show the **name** of every customer in **London**, in **alphabetical order**.", "solution": "SELECT name FROM customers WHERE city = 'London' ORDER BY name;", "ordered": true, "hint": "Filter with `WHERE city = 'London'`, then `ORDER BY name`." },
    { "id": "declined-50", "prompt": "Show the **merchant** and **amount** of **declined** transactions over **£50**.", "solution": "SELECT merchant, amount FROM transactions WHERE status = 'declined' AND amount > 50;", "hint": "Two conditions joined with `AND`." },
    { "id": "top-5", "prompt": "Show the **merchant** and **amount** of the **5 biggest approved** transactions, biggest first.", "solution": "SELECT merchant, amount FROM transactions WHERE status = 'approved' ORDER BY amount DESC LIMIT 5;", "ordered": true, "hint": "`WHERE status = 'approved' ORDER BY amount DESC LIMIT 5`, in that order." }
  ]
}
```

```quiz
p1-12-sql
```

## Practice this week

```practice
- SQLBolt [Lesson 2: Queries with constraints](https://sqlbolt.com/lesson/select_queries_with_constraints), [Lesson 3](https://sqlbolt.com/lesson/select_queries_with_constraints_pt_2) and [Lesson 4: Filtering and sorting](https://sqlbolt.com/lesson/filtering_sorting_query_results).
- Try `WHERE merchant LIKE 'T%'` on the [Practice bench](#/practice). What do you think `%` means?
```
